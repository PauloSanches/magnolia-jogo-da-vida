const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const {pathToFileURL} = require('node:url');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const scratch = path.join(process.env.HOME, '.hermes/cache/scratch');
const full = process.argv.includes('--full');
const expectedPath = process.env.MAGNOLIA_EXPECTED || path.join(root, 'docs/milestones.json');
const url = process.env.MAGNOLIA_URL || pathToFileURL(path.join(root, 'docs/backstage/index.html')).href;
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
 const profile = fs.mkdtempSync(path.join(scratch, 'magnolia-qa-'));
 const child = spawn(process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--no-first-run', '--no-default-browser-check', '--user-data-dir='+profile, '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', url], {stdio:'ignore'});
 let ws;
 const errors = [], checks = [];
 try {
  let port;
  for(let i=0;i<100;i++){try{port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];if(port)break;}catch{}await sleep(100);}
  assert(port, 'Chrome debugging endpoint unavailable');
  const tabs=await(await fetch('http://127.0.0.1:'+port+'/json')).json();
  const tab=tabs.find(t=>t.type==='page');assert(tab);
  ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true});});
  let id=0;const pending=new Map();
  ws.addEventListener('message', e=>{const d=JSON.parse(e.data);if(d.id){const p=pending.get(d.id);if(p){clearTimeout(p.timer);pending.delete(d.id);d.error?p.reject(d.error):p.resolve(d.result);}}if(d.method==='Runtime.exceptionThrown')errors.push(d.params);});
  const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>{pending.delete(n);reject(Error('CDP timeout '+method));},12000);pending.set(n,{resolve,reject,timer});ws.send(JSON.stringify({id:n,method,params}));});
  const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  const key=async k=>{await call('Input.dispatchKeyEvent',{type:'keyDown',key:k,code:k,text:k==='Enter'?'\r':undefined,windowsVirtualKeyCode:{ArrowUp:38,ArrowDown:40,ArrowLeft:37,ArrowRight:39,End:35,Enter:13}[k]});await call('Input.dispatchKeyEvent',{type:'keyUp',key:k,code:k});};
  const shot=async name=>{const d=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(scratch,name),Buffer.from(d.data,'base64'));};
  await call('Runtime.enable');await call('Page.enable');
  const sheetRequests=[];
  ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Network.requestWillBeSent'&&/docs\.google\.com|spreadsheets|sheet-sync\.js|sheet-data\.js/.test(m.params.request.url))sheetRequests.push(m.params.request.url)});
  const externalRequests=[];ws.addEventListener('message',e=>{const d=JSON.parse(e.data);if(d.method==='Network.requestWillBeSent'){const u=d.params.request.url;if(/^https?:/.test(u)&&new URL(u).origin!==new URL(url).origin)externalRequests.push(u)}});
  await call('Network.enable');await call('Network.setBlockedURLs',{urls:['*docs.google.com/*','*sheets.googleapis.com/*','*spreadsheets*']});

  await ev('window.__qaOldDocument=true');
  await call('Page.reload',{ignoreCache:true});
  let loaded=false;for(let i=0;i<200;i++){try{loaded=await ev('!window.__qaOldDocument&&!!document.querySelector("main#conteudo")');if(loaded)break;}catch{}await sleep(100);}
  assert(loaded,'The fresh document did not finish initializing');
  for(let i=0;i<100;i++){if(await ev('document.querySelector(".flow-tour")?.dataset.ready==="true"'))break;await sleep(50);}
  assert(await ev('document.querySelector(".flow-tour").dataset.ready==="true"'),'Workflow module ready');
  await ev('document.fonts.ready');
  const get=()=>ev(`(()=>{const r=document.querySelector('.flow-tour');return {step:+r.dataset.step,playing:r.dataset.playing==='true',svg:!!r.querySelector('.flow-figure svg'),fallback:!r.querySelector('.workflow-static').hidden,interactive:!r.querySelector('.flow-interactive').hidden,branch:r.querySelector('.flow-art-source').dataset.active}})()`);
  const results=[];
  for(const [width,height] of [[320,667],[390,844],[768,1024],[1440,1000]]){
   await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<701});
   await ev(`document.querySelector('.flow-tour').scrollIntoView({block:'start',behavior:'instant'})`);await sleep(250);
   if((await get()).playing)await ev(`document.querySelector('[data-flow-play]').click()`);assert(!(await get()).playing,'Pause before manual-selection checks');
   for(let n=0;n<6;n++){await ev(`document.querySelectorAll('.flow-steps button')[${n}].click()`);const state=await get();assert.equal(state.step,n);assert(state.svg);assert(!state.playing);}
   await ev(`document.querySelectorAll('.flow-steps button')[2].click()`);assert.equal((await get()).branch,'true');
   const geometry=await ev(`(()=>{const root=document.querySelector('.flow-tour'),s=root.querySelector('.flow-steps').getBoundingClientRect(),d=root.querySelector('.flow-stage').getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,overlap:s.right>d.left+1,buttons:[...root.querySelectorAll('button')].every(b=>b.getBoundingClientRect().height>=44)}})()`);assert(!geometry.overflow);assert(!geometry.overlap);assert(geometry.buttons);
   if(width===390||width===1440){const box=await ev(`(()=>{const r=document.querySelector('.flow-tour').getBoundingClientRect();return {x:r.x,y:r.y+scrollY,width:r.width,height:r.height}})()`);const d=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{...box,scale:1}});fs.writeFileSync(path.join(scratch,'magnolia-flow-'+width+'.png'),Buffer.from(d.data,'base64'));}
   await ev(`document.querySelector('[data-flow-reset]').click()`);results.push({width,noOverflow:true,sixSelections:true,touchTargets:true});
  }
  await ev(`document.querySelector('[data-flow-play]').focus()`);await key('Enter');await sleep(100);assert((await get()).playing,'Keyboard starts tour');
  const before=await ev(`document.querySelector('.flow-figure').innerHTML`);await sleep(3100);const after=await ev(`document.querySelector('.flow-figure').innerHTML`);assert(before!==after,'Hairline produces real SVG movement');
  await sleep(2100);assert.equal((await get()).step,1,'Sequence advances');await ev(`document.querySelector('[data-flow-play]').click()`);assert(!(await get()).playing);await sleep(5100);assert.equal((await get()).step,1,'Pause holds current step');
  await ev(`document.querySelector('[data-flow-reset]').click();document.querySelector('[data-flow-play]').click()`);
  for(let n=0;n<70;n++){if(!(await get()).playing)break;await sleep(500);}assert.equal((await get()).step,5);assert(!(await get()).playing);assert.equal(await ev(`document.querySelector('[data-flow-play]').textContent`),'Repetir animação');
  await ev(`document.querySelector('[data-flow-play]').click()`);assert.equal((await get()).step,0);await ev('window.scrollTo({top:0,behavior:"instant"})');await sleep(250);assert(!(await get()).playing,'Offscreen pauses');
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});for(let n=0;n<60;n++){const s=await get();if(s.fallback&&!s.interactive&&!s.svg)break;await sleep(50);}let state=await get();assert(state.fallback&&!state.interactive&&!state.svg);assert.equal(await ev(`document.querySelectorAll('.workflow-static li p').length`),6);
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});for(let n=0;n<60;n++){if((await get()).interactive)break;await sleep(50);}state=await get();assert(state.interactive&&!state.playing,JSON.stringify(state));
  await call('Network.setBlockedURLs',{urls:['*flow-tour.js*']});await call('Page.reload',{ignoreCache:true});await sleep(800);assert(await ev(`!document.querySelector('.workflow-static').hidden&&document.querySelector('.flow-interactive').hidden`),'Readable when JavaScript does not load');
  assert.equal(externalRequests.length,0,JSON.stringify(externalRequests));assert.equal(errors.length,0,JSON.stringify(errors));console.log(JSON.stringify({ok:true,workflow:true,results,keyboard:true,actualHairlineMotion:true,automaticSequence:true,pause:true,repeat:true,offscreenPause:true,reducedMotion:true,noScriptFallback:true,errors}));
 } finally {if(ws)ws.close();child.kill('SIGTERM');}
})().catch(e=>{console.error(e);process.exitCode=1;});
