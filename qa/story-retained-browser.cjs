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
  await ev('document.getElementById("reading-playback-toggle").getAttribute("aria-pressed")==="false"&&document.getElementById("reading-playback-toggle").click()');
  assert.equal(await ev('MagnoliaContent.mode'),'static');
  assert.equal(await ev('typeof window.__contentSync'),'undefined','Final edition must not start any spreadsheet synchronizer');
  const expected=JSON.parse(fs.readFileSync(path.join(root,'qa/fixtures/approved-questions.json'),'utf8'));
  assert.equal(await ev('__draft.chapters'),expected.length,'Only the approved twelve draft houses must render');
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  const settle=async()=>{await ev('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');for(let i=0;i<150&&await ev('__boardState.moving');i++)await sleep(40);assert.equal(await ev('__boardState.moving'),false);};
  const activate=async expression=>{await ev(expression);await settle();};
  const state=()=>ev(`(()=>{const c=document.getElementById('memoryContent'),b=document.querySelector('.bubble'),nav=document.querySelector('.timeline-navigation');c.scrollTop=c.scrollHeight;return {active:__boardState.active,phase:__boardState.phase,title:c.querySelector('h1')?.textContent||'',text:c.querySelector('p')?.textContent||'',nextDisabled:document.getElementById('timeline-next').disabled,restartHidden:document.getElementById('timeline-restart').hidden,questionCard:b.classList.contains('question-card'),inputs:c.querySelectorAll('input,textarea,select').length,overflow:c.scrollWidth>c.clientWidth||document.documentElement.scrollWidth>innerWidth,bottom:c.scrollTop+c.clientHeight>=c.scrollHeight-1,separate:b.getBoundingClientRect().bottom<nav.getBoundingClientRect().top,progress:Number(document.getElementById('timeline-progress').getAttribute('aria-valuenow'))}})()`);
  const results=[];
  const snapshot=()=>ev(`(()=>{const b=document.querySelector('.bubble'),s=document.getElementById('retained-story'),r=document.getElementById('retained-content'),n=document.querySelector('.timeline-navigation'),a=avatar.getBoundingClientRect();return {a:a.toJSON(),b:b.getBoundingClientRect().toJSON(),s:s?.getBoundingClientRect().toJSON(),navTop:n.getBoundingClientRect().top,visible:!!s&&!s.hidden&&s.checkVisibility(),title:r?.querySelector('h1')?.textContent||'',text:r?.querySelector('p')?.textContent||'',overflow:!!r&&r.scrollWidth>r.clientWidth,scrollTop:r?.scrollTop,align:r&&getComputedStyle(r.querySelector('p')||r).textAlign,question:memoryContent.querySelector('p')?.textContent,inputs:document.querySelectorAll('input,textarea,select').length}})()`);
  for(const [width,height] of [[320,568],[320,667],[390,844],[700,700],[701,700],[844,390],[1440,1000]]){
   await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<701});await ev('__draft.update()');await settle();
   for(let i=0;i<expected.length;i++){
    await ev('__draft.go(0)');await ev('__draft.go('+i+')');await settle();
    assert.equal((await snapshot()).visible,false,'No retained duplicate when only the story is open');
    if(!expected[i].pergunta)continue;
    await state();const before=await snapshot(),scroll=await ev('memoryContent.scrollTop');
    await activate('document.getElementById("timeline-next").click()');const after=await snapshot();
    assert(after.visible,'Opening the question must keep the complete story visible on the same screen');
    assert.equal(after.title,expected[i].titulo);assert.equal(after.text,expected[i].texto);assert.equal(after.question,expected[i].pergunta);assert.equal(after.align,'center');assert.equal(after.inputs,0);assert(!after.overflow);
    for(const key of ['x','y','width','height']){assert(Math.abs(after.a[key]-before.a[key])<.1,'Character must not move');assert(Math.abs(after.s[key]-before.b[key])<1,'The retained story must keep its original balloon geometry: '+JSON.stringify({width,height,i,before:before.b,after:after.s}));}
    assert(Math.abs(after.scrollTop-scroll)<1,'Preserve the current reading/scroll position');
    assert(after.s.left>=11&&after.s.right<=width-11&&after.s.bottom<after.navTop-12,'Retained story must not cover navigation: '+JSON.stringify({width,height,i,s:after.s,nav:after.navTop}));
    assert(after.b.right+12<=after.s.left||after.b.left-12>=after.s.right||after.b.bottom+12<=after.s.top,'Story and question must remain separate: '+JSON.stringify({width,height,i,q:after.b,s:after.s}));
    if(i===1){
     await shot('magnolia-story-and-question-'+width+'x'+height+'.png');
     const ax=await call('Accessibility.getFullAXTree');for(const text of [expected[i].texto,expected[i].pergunta])assert.equal(ax.nodes.filter(n=>!n.ignored&&n.role?.value==='StaticText'&&n.name?.value===text).length,1,'Story and question each need one complete accessible text node');
    }
    // Reading the retained history must not navigate or restart writing.
    await ev('document.getElementById("retained-content").click();document.getElementById("retained-content").focus()');await key('ArrowDown');await settle();assert.equal(await ev('__boardState.active'),i);assert.equal(await ev('__boardState.phase'),'question');await ev('document.activeElement.blur()');
    await activate('document.getElementById("timeline-prev").click()');assert.equal((await snapshot()).visible,false);assert.equal((await state()).text,expected[i].texto);
    results.push({width,height,house:i+1});
   }
  }
  // Returning from a later house restores that previous house's story, not stale text.
  await ev('__draft.go(2)');await activate('document.getElementById("timeline-prev").click()');assert.equal((await snapshot()).text,expected[1].texto);assert.equal((await snapshot()).question,expected[1].pergunta);
  await ev('__draft.go(__draft.chapters-1)');assert.equal((await snapshot()).visible,false);await activate('document.getElementById("timeline-restart").click()');assert.equal((await snapshot()).visible,false);
  assert.equal(results.length,expected.filter(r=>r.pergunta).length*7);assert.equal(errors.length,0);console.log(JSON.stringify({ok:true,storyRetained:true,houseViewportChecks:results.length,charactersUnmoved:true,storyGeometryPreserved:true,scrollPreserved:true,separateBalloons:true,accessibleFullText:true,backAndRestart:true,errors}));
 } finally {if(ws)ws.close();child.kill('SIGTERM');}
})().catch(e=>{console.error(e);process.exitCode=1;});
