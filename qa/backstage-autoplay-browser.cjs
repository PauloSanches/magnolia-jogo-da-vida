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
  const wait=async(expression,label,ms=5000)=>{for(let n=0;n<ms/50;n++){try{if(await ev(expression))return;}catch{}await sleep(50);}throw Error('Timed out: '+label)};
  const ready='!window.__qaOldDocument&&document.querySelector(".flow-tour")?.dataset.ready==="true"';
  const playing='document.querySelector(".flow-tour").dataset.playing==="true"';
  const reload=async()=>{await ev('window.scrollTo({top:0,behavior:"instant"});window.__qaOldDocument=true');await call('Page.reload',{ignoreCache:true});await wait(ready,'fresh animation module');};
  const results=[];
  for(const [width,height] of [[390,844],[1440,1000]]){
   await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<701});await reload();assert(!(await ev(playing)),'Do not consume animation before it is visible');
   await ev(`document.querySelector('.flow-tour').scrollIntoView({block:'start',behavior:'instant'})`);await wait(playing,'autoplay on visible entry');
   await wait(`+document.querySelector('.flow-tour').dataset.step>0`,'automatic progression',7500);
   await ev(`document.querySelector('[data-flow-play]').click()`);assert(!(await ev(playing)));const step=await ev(`document.querySelector('.flow-tour').dataset.step`);
   await ev('window.scrollTo({top:0,behavior:"instant"})');await sleep(200);await ev(`document.querySelector('.flow-tour').scrollIntoView({block:'start',behavior:'instant'})`);await sleep(500);assert(!(await ev(playing)),'User pause survives viewport re-entry');assert.equal(await ev(`document.querySelector('.flow-tour').dataset.step`),step);
   await ev(`document.querySelector('[data-flow-play]').click()`);assert(await ev(playing),'Manual resume remains available');await ev('window.scrollTo({top:0,behavior:"instant"})');await wait('!('+playing+')','offscreen pause');
   results.push({width,autoplayOnVisible:true,advances:true,pauseRespected:true,manualResume:true,offscreenPause:true});
  }
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await reload();await ev(`document.querySelector('.flow-tour').scrollIntoView({block:'start',behavior:'instant'})`);await sleep(500);assert(!(await ev(playing)));assert(await ev(`!document.querySelector('.workflow-static').hidden&&document.querySelector('.flow-interactive').hidden`),'Reduced motion stays static');
  assert.equal(externalRequests.length,0,JSON.stringify(externalRequests));assert.equal(errors.length,0,JSON.stringify(errors));console.log(JSON.stringify({ok:true,autoplay:true,results,reducedMotion:true,errors}));
 } finally {if(ws)ws.close();child.kill('SIGTERM');}
})().catch(e=>{console.error(e);process.exitCode=1;});
