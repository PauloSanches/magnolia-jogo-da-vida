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
  const art=JSON.parse(fs.readFileSync(path.join(root,'editorial/finale-scenery.json'),'utf8')),results=[];
  const imageSelector='[data-finale-scenery=casa-13]';
  for(const [width,height] of [[320,568],[320,667],[390,844],[700,700],[701,700],[844,390],[1440,1000]]){
   await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<701});await ev('__draft.update()');await settle();await ev('__draft.go(0)');await ev('__draft.go(__draft.chapters-1)');await settle();await ev('avatar.decode()');
   assert.equal(await ev(`document.querySelectorAll(${JSON.stringify(imageSelector)}).length`),1,'The supplied church and staircase must be scenery on the final house');
   assert.equal(await ev('avatar.getAttribute("src")'),'assets/character-casa-13-a09313b62126.png','Keep the approved final character');
   const g=await ev(`(()=>{const i=document.querySelector(${JSON.stringify(imageSelector)}),a=avatar.getBoundingClientRect(),b=document.querySelector('.bubble').getBoundingClientRect(),f=document.querySelector('.finish-marker').getBoundingClientRect(),progress=document.getElementById('timeline-progress').getBoundingClientRect();return {image:i.getBoundingClientRect().toJSON(),href:i.getAttribute('href'),fit:i.getAttribute('preserveAspectRatio'),a:a.toJSON(),b:b.toJSON(),f:f.toJSON(),progress:progress.toJSON(),text:memoryContent.querySelector('p').textContent,phase:__boardState.phase,retained:document.getElementById('retained-story').hidden,restart:!document.getElementById('timeline-restart').hidden}})()`);
   assert.equal(g.href,art.asset);assert.equal(g.fit,'xMidYMid meet');assert.equal(g.text,expected.at(-1).texto);assert.equal(g.phase,'story');assert(g.retained&&g.restart);
   assert(g.image.left>=11&&g.image.right<=width-11&&g.image.top>=g.progress.bottom+12&&g.image.bottom<g.b.top-12,'Whole landmark must fit above the reflection: '+JSON.stringify({width,height,g}));
   assert(g.image.right<=g.a.left-12,'The new scenery must not replace or cover the character');assert(g.f.left>=g.a.right+8&&g.f.right<=width-8&&g.f.top>=g.progress.bottom+12,'Keep the finish flag separate from the landmark and character: '+JSON.stringify({width,height,g}));
   assert(Math.abs(g.image.width/g.image.height-art.width/art.height)<.001,'Do not stretch the supplied artwork');assert(g.image.width>=70);
   const scale=Math.min(width/480,1.65),left=(width-480*scale)/2;
   assert(Math.abs(g.a.x-(left+300*scale-g.a.width/2))<1&&Math.abs(g.a.bottom-height*.4)<1,'Do not move the final character to make room for scenery');
   const pixels=await ev(`(async()=>{const img=new Image();img.src=${JSON.stringify(art.asset)};await img.decode();const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d');x.drawImage(img,0,0);const d=x.getImageData(0,0,c.width,c.height).data;let transparent=0,opaque=0;for(let i=3;i<d.length;i+=4){if(d[i]===0)transparent++;if(d[i]===255)opaque++;}return {width:c.width,height:c.height,transparent,opaque}})()`);
   assert.equal(pixels.width,art.width);assert.equal(pixels.height,art.height);assert(pixels.transparent>0&&pixels.opaque>0,'Deliver a real transparent cutout, not an opaque white rectangle');
   await shot('magnolia-finale-scenery-'+width+'x'+height+'.png');results.push({width,height,completeScenery:true,characterUnchanged:true,reflectionUnchanged:true,transparent:true});
  }
  assert.equal(results.length,7);assert.equal(errors.length,0,JSON.stringify(errors));console.log(JSON.stringify({ok:true,finalScenery:true,results,errors}));
 } finally {if(ws)ws.close();child.kill('SIGTERM');}
})().catch(e=>{console.error(e);process.exitCode=1;});
