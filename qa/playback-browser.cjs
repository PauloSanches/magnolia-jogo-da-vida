const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const {pathToFileURL} = require('node:url');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const scratch = path.join(process.env.HOME, '.hermes/cache/scratch');
const full = process.argv.includes('--full');
const expectedPath = process.env.MAGNOLIA_EXPECTED || path.join(root, 'docs/milestones.json');
const url = process.env.MAGNOLIA_URL || pathToFileURL(path.join(root, 'docs/index.html')).href;
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
  await call('Network.enable');await call('Network.setBlockedURLs',{urls:['*docs.google.com/*','*sheets.googleapis.com/*','*spreadsheets*']});

  await ev('window.__qaOldDocument=true');
  await call('Page.reload',{ignoreCache:true});
  let loaded=false;for(let i=0;i<200;i++){try{loaded=await ev('!window.__qaOldDocument&&!!window.__draft');if(loaded)break;}catch{}await sleep(100);}
  assert(loaded,'The fresh document did not finish initializing');
  await ev('document.fonts.ready');
  assert.equal(await ev('MagnoliaContent.mode'),'static');
  assert.equal(await ev('typeof window.__contentSync'),'undefined','Final edition must not start any spreadsheet synchronizer');
  const expected=JSON.parse(fs.readFileSync(path.join(root,'qa/fixtures/approved-questions.json'),'utf8'));
  assert.equal(await ev('__draft.chapters'),expected.length,'Only the approved twelve draft houses must render');
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  const settle=async()=>{await ev('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');for(let i=0;i<150&&await ev('__boardState.moving');i++)await sleep(40);assert.equal(await ev('__boardState.moving'),false);};
  const activate=async expression=>{await ev(expression);await settle();};
  const state=()=>ev(`(()=>{const c=document.getElementById('memoryContent'),b=document.querySelector('.bubble'),nav=document.querySelector('.timeline-navigation');c.scrollTop=c.scrollHeight;return {active:__boardState.active,phase:__boardState.phase,title:c.querySelector('h1')?.textContent||'',text:c.querySelector('p')?.textContent||'',nextDisabled:document.getElementById('timeline-next').disabled,restartHidden:document.getElementById('timeline-restart').hidden,questionCard:b.classList.contains('question-card'),inputs:c.querySelectorAll('input,textarea,select').length,overflow:c.scrollWidth>c.clientWidth||document.documentElement.scrollWidth>innerWidth,bottom:c.scrollTop+c.clientHeight>=c.scrollHeight-1,separate:b.getBoundingClientRect().bottom<nav.getBoundingClientRect().top,progress:Number(document.getElementById('timeline-progress').getAttribute('aria-valuenow'))}})()`);
  const waitFor=async(expression,limit=160)=>{for(let i=0;i<limit;i++){if(await ev(expression))return;await sleep(100);}throw Error('Timed out: '+expression);};
  assert.equal(await ev('typeof MagnoliaPlayback'),'object','The typewriter controller must be loaded');
  const results=[];
  for(const [width,height] of [[320,667],[390,844],[1440,1000]]){
   await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<701});
   await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await ev('__draft.go(0)');
   await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await ev('__draft.go(1)');
   assert.equal(await ev('__boardState.typing'),true);
   const original=await ev('({a:avatar.getBoundingClientRect().toJSON(),b:document.querySelector(".bubble").getBoundingClientRect().toJSON(),text:memoryContent.querySelector("p").textContent})');
   assert.equal(original.text,expected[1].texto,'Full accessible text remains available while it is revealed visually');
   const ax=await call('Accessibility.getFullAXTree');assert(ax.nodes.some(n=>!n.ignored&&n.role?.value==='StaticText'&&n.name?.value===expected[1].texto),'Assistive technology must receive the whole story, not individual letter announcements');
   const pauseBounds=await ev('document.getElementById("reading-playback-toggle").getBoundingClientRect().toJSON()');assert(pauseBounds.width>=44&&pauseBounds.height>=44&&pauseBounds.left>=0&&pauseBounds.right<=width);
   await sleep(350);
   const writing=await ev('({visible:[...memoryContent.querySelectorAll(".writing-char")].filter(s=>getComputedStyle(s).opacity==="1").length,total:memoryContent.querySelectorAll(".writing-char").length,height:document.querySelector(".bubble").getBoundingClientRect().height})');
   assert(writing.visible>0&&writing.visible<writing.total);assert.equal(writing.height,original.b.height,'Typing must not resize the balloon');
   await shot('magnolia-writing-'+width+'.png');
   await waitFor('!__boardState.typing');assert.equal(await ev('__boardState.phase'),'story');
   await sleep(2000);assert.equal(await ev('__boardState.phase'),'story','Allow reading time after writing ends');
   await waitFor('__boardState.phase==="question"');await settle();assert.equal(await ev('__boardState.active'),1);
   const retained=await ev('({visible:!document.getElementById("retained-story").hidden,text:document.getElementById("retained-content").querySelector("p").textContent,b:document.getElementById("retained-story").getBoundingClientRect().toJSON()})');
   assert(retained.visible,'Automatic questions must not replace the story');assert.equal(retained.text,expected[1].texto);
   for(const key of ['x','y','width','height'])assert(Math.abs(retained.b[key]-original.b[key])<1,'The story must not move or reflow when the automatic question opens');
   const after=await ev('avatar.getBoundingClientRect().toJSON()');for(const key of ['x','y','width','height'])assert(Math.abs(after[key]-original.a[key])<.1);
   assert.equal(await ev('document.querySelector(".avatar-motion").getAnimations().length'),0,'Only the question balloon changes');
   await waitFor('!__boardState.typing');assert.equal(await ev('memoryContent.querySelector("p").textContent'),expected[1].pergunta);
   await sleep(3200);assert.equal(await ev('__boardState.active'),1);assert.equal(await ev('__boardState.phase'),'question','The game never advances to another house automatically');
   results.push({width,height,progressiveWriting:true,automaticQuestion:true,characterStill:true,questionWaits:true});
  }
  // Pausing is a real user control, not a test-only automation bypass.
  await ev('__draft.go(2)');await ev('document.getElementById("reading-playback-toggle").click()');assert.equal(await ev('__boardState.typing'),false);
  await sleep(3300);assert.equal(await ev('__boardState.phase'),'story');assert.equal(await ev('document.getElementById("reading-playback-toggle").getAttribute("aria-pressed")'),'true');
  await ev('document.getElementById("reading-playback-toggle").click()');await waitFor('__boardState.phase==="question"');await settle();
  // Forward during writing reveals the text but never skips the question.
  await ev('__draft.go(3)');await activate('document.getElementById("timeline-next").click()');assert.equal(await ev('__boardState.active'),3);assert.equal(await ev('__boardState.phase'),'story');assert.equal(await ev('__boardState.typing'),false);
  await waitFor('__boardState.phase==="question"');await settle();await activate('document.getElementById("timeline-next").click()');assert.equal(await ev('__boardState.active'),3);assert.equal(await ev('__boardState.typing'),false);
  await activate('document.getElementById("timeline-next").click()');assert.equal(await ev('__boardState.active'),4);
  // Live reduced motion, leaving a pending story and a new question-free ending.
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await waitFor('!__boardState.typing');
  await ev('__draft.go(__draft.chapters-1)');await sleep(3400);assert.equal(await ev('__boardState.active'),11);assert.equal(await ev('__boardState.phase'),'story');assert.equal(await ev('document.getElementById("timeline-restart").hidden'),false);
  await activate('document.getElementById("timeline-restart").click()');await sleep(3300);assert.equal(await ev('__boardState.active'),0);assert.equal(await ev('__boardState.phase'),'story');
  await ev('__draft.go(1)');await sleep(2000);assert.equal(await ev('__boardState.phase'),'story');await waitFor('__boardState.phase==="question"');assert.equal(await ev('__boardState.typing'),false);
  assert.deepEqual(sheetRequests,[]);assert.equal(errors.length,0);console.log(JSON.stringify({ok:true,results,pause:true,manualFinish:true,cancelStaleTimers:true,reducedMotion:true,openingAndFinalNoQuestion:true,errors}));
 } finally {if(ws)ws.close();child.kill('SIGTERM');}
})().catch(e=>{console.error(e);process.exitCode=1;});
