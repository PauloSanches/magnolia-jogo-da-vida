const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const {pathToFileURL} = require('node:url');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const scratch = path.join(process.env.HOME, '.hermes/cache/scratch');
const review=path.join(scratch,'magnolia-v2-public-review');fs.mkdirSync(review,{recursive:true});
const full = process.argv.includes('--full');
const expectedPath = process.env.MAGNOLIA_EXPECTED || path.join(root, 'docs/milestones.json');
const url = process.env.MAGNOLIA_URL || pathToFileURL(path.join(root, 'docs/backstage/v2/index.html')).href;
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
  const shot=async name=>{const d=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(review,name),Buffer.from(d.data,'base64'));};
  await call('Runtime.enable');await call('Page.enable');
  const sheetRequests=[];
  ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Network.requestWillBeSent'&&/docs\.google\.com|spreadsheets|sheet-sync\.js|sheet-data\.js/.test(m.params.request.url))sheetRequests.push(m.params.request.url)});
  await call('Network.enable');await call('Network.setBlockedURLs',{urls:['*docs.google.com/*','*sheets.googleapis.com/*','*spreadsheets*']});

  await ev('window.__qaOldDocument=true');
  await call('Page.reload',{ignoreCache:true});
  let loaded=false;for(let i=0;i<200;i++){try{loaded=await ev('!window.__qaOldDocument&&!!document.querySelector("main#conteudo")');if(loaded)break;}catch{}await sleep(100);}
  assert(loaded,'The fresh document did not finish initializing');
  await ev('document.fonts.ready');const results=[];
  const proposal=JSON.parse(fs.readFileSync(path.join(root,'editorial/backstage-v2-copy.json'),'utf8'));
  const expectedCopy=[proposal.title,proposal.subtitle,...proposal.introduction,...proposal.sections.flatMap(s=>[s.title,...s.blocks.filter(b=>['p','h3'].includes(b.type)).map(b=>b.text)])];
  assert.deepEqual(await ev(`[...document.querySelectorAll('[data-case-copy]')].map(e=>e.textContent.replace(/\\s+/g,' ').trim())`),expectedCopy,'All approved case copy is rendered verbatim');
  for(const [width,height] of [[320,667],[390,844],[600,900],[768,1024],[900,1000],[901,1000],[1100,1000],[1101,1000],[1280,900],[1440,1000],[1600,1000]]){
   await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<701});await ev('window.scrollTo({top:0,behavior:"instant"});new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
   assert.equal(await ev('scrollY'),0,'Capture the document top after each viewport change');
   const g=await ev(`(()=>{const images=[...document.images];return {overflow:document.documentElement.scrollWidth>innerWidth,heading:document.querySelector('h1').textContent,h1:document.querySelectorAll('h1').length,anchors:[...document.querySelectorAll('a[href^="#"]')].every(a=>document.getElementById(a.hash.slice(1))),images:images.map(i=>({loaded:i.complete&&i.naturalWidth>0,src:i.getAttribute('src')})),missing:[...document.querySelectorAll('p,h1,h2,h3,li,dt,dd,a')].filter(e=>e.getBoundingClientRect().width>0).filter(e=>e.getBoundingClientRect().right>innerWidth+1||e.getBoundingClientRect().left<-.5).map(e=>e.textContent),scripts:document.scripts.length,typography:[...document.querySelectorAll('h1,h2')].map(e=>{const s=getComputedStyle(e);return {size:s.fontSize,tracking:s.letterSpacing,ratio:parseFloat(s.letterSpacing)/parseFloat(s.fontSize)}})}})()`);
   assert(!g.overflow,JSON.stringify({width,g}));assert(g.typography.every(t=>t.ratio>=-.04001),'Tracking floor');if(width===1440)console.log('Measured typography',JSON.stringify(g.typography));assert.equal(g.h1,1);assert(g.anchors);assert.equal(g.scripts,1,'Only the isolated workflow animation module may load');assert.equal(g.missing.length,0,JSON.stringify({width,g}));
   await ev('Promise.all([...document.images].map(i=>{i.loading="eager";return i.decode()}))');
   if(width===390||width===1440){await shot('magnolia-backstage-hero-'+width+'.png');const metrics=await call('Page.getLayoutMetrics');const size=metrics.cssContentSize;const capture=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height:Math.ceil(size.height),scale:1}});fs.writeFileSync(path.join(review,'magnolia-backstage-full-'+width+'.png'),Buffer.from(capture.data,'base64'));}
   if(width===390||width===1440){
    for(const section of ['arquitetura','temporizacao','fluxo']){
     await ev(`document.getElementById('${section}').scrollIntoView({block:'start',behavior:'instant'});new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);
     await shot('v2-'+section+'-'+width+'.png');
    }
   }
   results.push({width,height,noOverflow:true,anchors:true,imagesDecoded:true});
  }
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});assert.equal(await ev('getComputedStyle(document.documentElement).scrollBehavior'),'auto');
  // A prior scrollIntoView moves Chromium's sequential-focus start; test initial Tab on a fresh document.
  await ev('window.scrollTo({top:0,behavior:"instant"});window.__qaOldDocument=true');
  await call('Page.reload',{ignoreCache:true});
  let fresh=false;for(let n=0;n<100;n++){try{fresh=await ev('!window.__qaOldDocument&&document.readyState==="complete"');if(fresh)break;}catch{}await sleep(50);}
  assert(fresh);await ev('document.fonts.ready');
  await key('Tab');assert.equal(await ev('document.activeElement.className'),'skip-link');
  await ev('document.querySelector("nav a[href$=fluxo]").click()');await sleep(150);assert.equal(await ev('location.hash'),'#fluxo');
  const destinations=await ev(`[...document.querySelectorAll('.hero .actions a')].map(a=>a.href)`);
  assert.deepEqual(destinations,['https://paulosanches.github.io/magnolia-jogo-da-vida/','https://github.com/PauloSanches/magnolia-jogo-da-vida']);
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await ev('window.scrollTo({top:0,behavior:"instant"});document.querySelector(".mobile-contents summary").focus()');
  await key('Enter');assert(await ev('document.querySelector(".mobile-contents").open'));
  await ev(`document.querySelector('.mobile-contents a[href="#temporizacao"]').click()`);
  assert.equal(await ev('location.hash'),'#temporizacao');
  assert.equal(errors.length,0,JSON.stringify(errors));console.log(JSON.stringify({ok:true,backstage:true,results,playLink:true,reducedMotion:true,keyboard:true,errors}));
 } finally {if(ws)ws.close();child.kill('SIGTERM');}
})().catch(e=>{console.error(e);process.exitCode=1;});
