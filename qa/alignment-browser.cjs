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
  const measure=()=>ev(`(()=>{const b=document.querySelector('.bubble'),br=b.getBoundingClientRect(),a=avatar.getBoundingClientRect(),p=memoryContent.querySelector('p'),pr=p.getBoundingClientRect(),ps=getComputedStyle(p),c=memoryContent.getBoundingClientRect(),nav=document.querySelector('.timeline-navigation').getBoundingClientRect(),glyphs=[...p.querySelectorAll('.writing-char')].filter(x=>!x.hidden&&getComputedStyle(x).opacity==='1').flatMap(x=>[...x.getClientRects()]).filter(r=>r.width>.1);return {a:a.toJSON(),b:br.toJSON(),p:pr.toJSON(),content:c.toJSON(),textAlign:ps.textAlign,navTop:nav.top,width:innerWidth,side:b.dataset.side||null,glyphs:glyphs.map(r=>r.toJSON())}})()`);
  for(const [width,height] of [[320,568],[320,667],[390,844],[700,700],[701,700],[1440,1000]]){
   await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<701});await ev('__draft.update()');await settle();
   for(let i=0;i<expected.length;i++){
    await ev('__draft.go(0)');await ev('__draft.go('+i+')');
    let m=await measure();const avatarCenter=m.a.x+m.a.width/2,half=m.b.width/2,margin=12,want=Math.max(margin+half,Math.min(width-margin-half,avatarCenter));
    assert(Math.abs(m.b.x+half-want)<1,'Story balloon must follow its character center, clamped only at viewport edges: '+JSON.stringify({width,i,avatar:m.a,box:m.b,want}));
    assert.equal(m.textAlign,'center','Text should be centered within every balloon');
    assert(Math.abs(m.p.x+m.p.width/2-(m.b.x+m.b.width/2))<1,'Reading area needs symmetric gutters/padding');
    assert(m.b.left>=11&&m.b.right<=width-11&&m.b.bottom<m.navTop);
    const original=m.a;
    if(expected[i].pergunta){
     await activate('document.getElementById("timeline-next").click()');m=await measure();
     for(const key of ['x','y','width','height'])assert(Math.abs(m.a[key]-original[key])<.1);
     assert(m.b.right<=m.a.left-8||m.b.left>=m.a.right+8);assert.equal(m.textAlign,'center');
     const safe=await ev(`(()=>{const b=document.querySelector('.bubble').getBoundingClientRect(),progress=document.querySelector('.timeline-progress').getBoundingClientRect(),pause=document.getElementById('reading-playback-toggle').getBoundingClientRect();return Math.max(24,progress.bottom+12,b.right>pause.left&&b.left<pause.right?pause.bottom+12:0)})()`);
     const story=await ev('document.getElementById("retained-story").getBoundingClientRect().toJSON()');
     const bottom=Math.min(m.navTop-20,m.b.right+12>story.left&&m.b.left-12<story.right?story.top-16:Infinity);
     const wantTop=Math.max(safe,Math.min(bottom-m.b.height,m.a.y+m.a.height/2-m.b.height/2));
     assert(Math.abs(m.b.top-wantTop)<1,'Side question must be vertically centered against character unless controls or the retained story constrain it: '+JSON.stringify({width,i,avatar:m.a,box:m.b,wantTop}));
     assert(Math.abs(m.p.x+m.p.width/2-(m.b.x+m.b.width/2))<1);
    }
    results.push({width,height,house:i+1});
   }
  }
  // During writing the visible text, not its invisible future suffix, stays centered.
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await ev('__draft.go(0)');await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await ev('document.getElementById("reading-playback-toggle").click()');await ev('__draft.go(1)');const before=await measure();await sleep(500);const partial=await measure();
  assert.equal(partial.b.height,before.b.height,'The balloon must retain its final height during writing');
  assert(partial.glyphs.length>0);const l=Math.min(...partial.glyphs.map(g=>g.left)),rr=Math.max(...partial.glyphs.map(g=>g.right));
  assert(Math.abs((l+rr)/2-(partial.p.left+partial.p.width/2))<1.5,'Visible partial text must remain centered, not offset by unrevealed letters');
  await shot('magnolia-aligned-writing-mobile.png');
  await ev('document.getElementById("reading-playback-toggle").click()');await shot('magnolia-aligned-story-mobile.png');
  await activate('document.getElementById("timeline-next").click()');await shot('magnolia-aligned-question-mobile.png');
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await ev('__draft.go(0)');await ev('__draft.go(1)');await settle();await shot('magnolia-aligned-story-desktop.png');
  assert.equal(results.length,expected.length*6);assert.equal(errors.length,0);console.log(JSON.stringify({ok:true,houseViewportChecks:results.length,centeredBalloons:true,centeredText:true,centeredPartialWriting:true,charactersUnmoved:true,errors}));
 } finally {if(ws)ws.close();child.kill('SIGTERM');}
})().catch(e=>{console.error(e);process.exitCode=1;});
