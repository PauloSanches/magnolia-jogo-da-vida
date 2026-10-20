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
  const photoAsset='assets/photo-casa-11-landscape-695b72657f4e.jpg';
  const photoURL='https://paulosanches.github.io/magnolia-jogo-da-vida/'+photoAsset;
  const localPreview=url.startsWith('http://127.0.0.1:');
  if(localPreview){
   ws.addEventListener('message',e=>{const message=JSON.parse(e.data);if(message.method==='Fetch.requestPaused')call('Fetch.fulfillRequest',{requestId:message.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'image/jpeg'}],body:fs.readFileSync(path.join(root,'docs',photoAsset)).toString('base64')}).catch(error=>errors.push(String(error)));});
   await call('Fetch.enable',{patterns:[{urlPattern:photoURL,requestStage:'Request'}]});
  }
  await ev('window.__qaOldDocument=true');
  await call('Page.reload',{ignoreCache:true});
  let loaded=false;for(let i=0;i<200;i++){try{loaded=await ev('!window.__qaOldDocument&&!!window.__draft');if(loaded)break;}catch{}await sleep(100);}
  assert(loaded,'The fresh document did not finish initializing');
  await ev('document.fonts.ready');
  await ev('__contentSync.refresh()');
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  const expected=JSON.parse(fs.readFileSync(path.join(root,'docs/milestones.json'),'utf8'))[7];
  assert.equal(expected.id,'casa-11');const checks=[];
  for(const [width,height] of [[320,667],[390,844],[1440,1000]]){
   await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<701});await ev('__draft.go(0)');await ev('__draft.go(7);avatar.decode()');
   for(const phase of ['story','question']){
    if(phase==='question'){await ev('document.getElementById("timeline-next").click();new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');}
    const image=await ev(`(()=>{const p=document.querySelector('[data-live-photo="casa-11"] image');if(!p)return null;const rect=p.getBoundingClientRect(),a=avatar.getBoundingClientRect(),b=document.querySelector('.bubble').getBoundingClientRect();return {href:p.getAttribute('href'),fit:p.getAttribute('preserveAspectRatio'),left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,avatarLeft:a.left,avatarRight:a.right,avatarTop:a.top,bubbleTop:b.top,avatar:avatar.getAttribute('src'),text:memoryContent.querySelector('p').textContent,phase:__boardState.phase}})()`);
    assert(image,'The supplied photograph must appear beside the house-8 character');assert.equal(image.href,photoURL);assert.equal(image.fit,'xMidYMid meet');assert.equal(image.avatar,'assets/character-casa-11-36214710664c.png');assert.equal(image.text,phase==='story'?expected.texto:expected.pergunta);assert.equal(image.phase,phase);
    assert(image.left>=0&&image.right<=width&&image.top>=0&&image.bottom<image.bubbleTop&&(phase==='question'?image.bottom<image.avatarTop:(image.right<image.avatarLeft||image.left>image.avatarRight)),JSON.stringify({width,phase,image}));
    const dimensions=await ev(`new Promise((resolve,reject)=>{const i=new Image(),timer=setTimeout(()=>reject(Error('Photo decode timeout')),8000);i.onload=()=>{clearTimeout(timer);resolve({width:i.naturalWidth,height:i.naturalHeight})};i.onerror=()=>{clearTimeout(timer);reject(Error('Photo decode failed'))};i.src=${JSON.stringify(photoURL)}})`);assert.equal(dimensions.width*108,dimensions.height*178,'Landscape photo must exactly fill the standard 178×108 frame without padding or distortion');
    if(width===390&&phase==='story')await shot('magnolia-house8-side-photo.png');checks.push({width,phase,ok:true});
   }
  }
  assert.equal(await ev('__contentState.status'),'synced',JSON.stringify(await ev('__contentState')));assert.equal(errors.length,0);console.log(JSON.stringify({photoBesideHouse8:true,landscapeCropFillsFrame:true,characterAndTextUnchanged:true,checks,localPhotoRoute:localPreview,errors}));
 } finally { if(ws)ws.close(); child.kill('SIGTERM'); }
})().catch(e=>{console.error(e);process.exitCode=1;});
