const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const {pathToFileURL} = require('node:url');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const scratch = path.join(process.env.HOME, '.hermes/cache/scratch');
const allowAutoplay=process.argv.includes('--allow-autoplay');
const expectedPath = process.env.MAGNOLIA_EXPECTED || path.join(root, 'docs/milestones.json');
const url = process.env.MAGNOLIA_URL || pathToFileURL(path.join(root, 'docs/index.html')).href;
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
 const profile = fs.mkdtempSync(path.join(scratch, 'magnolia-qa-'));
 const child = spawn(process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new','--autoplay-policy='+(allowAutoplay?'no-user-gesture-required':'document-user-activation-required'), '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--no-first-run', '--no-default-browser-check', '--user-data-dir='+profile, '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', url], {stdio:'ignore'});
 let ws;
 const errors = [], checks = [];
 try {
  let port;
  for(let i=0;i<100;i++){try{port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];break;}catch{await sleep(100);}}
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
  await call('Page.reload',{ignoreCache:true});
  for(let i=0;i<50;i++){if(await ev('!!window.__draft'))break;await sleep(100);}
  await ev('document.fonts.ready');
  const audioExists=await ev('!!document.getElementById("background-music")&&!!document.getElementById("sound-toggle")');
  assert(audioExists,'Background music and a visible sound control must exist');
  const sound=()=>ev('(()=>{const a=document.getElementById("background-music"),b=document.getElementById("sound-toggle");return {paused:a.paused,time:a.currentTime,duration:a.duration,loop:a.loop,volume:a.volume,pressed:b.getAttribute("aria-pressed"),label:b.textContent.trim(),state:b.dataset.state,ready:a.readyState,error:a.error?.code||null}})()');
  const waitFor=async predicate=>{for(let i=0;i<100;i++){const s=await sound();if(predicate(s))return s;await sleep(100);}throw Error('Audio state timeout: '+JSON.stringify(await sound()));};
  const clickSound=async()=>{const point=await ev('(()=>{const r=document.getElementById("sound-toggle").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});};
  if(allowAutoplay){await waitFor(s=>!s.paused&&s.time>0&&s.pressed==='true');}
  else{await waitFor(s=>s.paused&&s.state==='off');assert.equal((await sound()).label,'Ativar som');await clickSound();await waitFor(s=>!s.paused&&s.time>0&&s.pressed==='true');}
  const playing=await sound();assert(playing.loop&&playing.duration>15&&playing.duration<16&&playing.volume>0&&playing.volume<=0.5&&!playing.error);
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  const before=(await sound()).time;await ev('__draft.go(1)');await sleep(300);assert((await sound()).time>before,'Navigation must not restart the music');
  await clickSound();await waitFor(s=>s.paused&&s.pressed==='false');const paused=(await sound()).time;await sleep(250);assert.equal((await sound()).time,paused);
  assert.equal(await ev('localStorage.getItem("magnolia-music-preference")'),'off');
  await call('Page.reload',{ignoreCache:true});await sleep(1000);await waitFor(s=>s.paused&&s.state==='off');
  await clickSound();await waitFor(s=>!s.paused&&s.time>0);
  await ev('document.getElementById("background-music").currentTime=document.getElementById("background-music").duration-0.15');
  await waitFor(s=>!s.paused&&s.time<2);
  for(const [width,height] of [[320,667],[390,844],[1440,1000]]){
   await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<701});
   await ev('__draft.go(0);__draft.update()');
   const bounds=await ev('(()=>{const b=document.getElementById("sound-toggle").getBoundingClientRect(),p=document.getElementById("timeline-progress").getBoundingClientRect(),a=avatar.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height,progressBottom:p.bottom,avatarTop:a.top}})()');
   assert(bounds.left>=0&&bounds.right<=width&&bounds.width>=44&&bounds.height>=44&&bounds.top>bounds.progressBottom&&bounds.bottom<bounds.avatarTop,JSON.stringify(bounds));
   if(width===320)await shot('magnolia-sound-mobile.png');
  }
  await clickSound();
  await ev('window.__originalAudioPlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){return Promise.reject(new DOMException("simulated policy block","NotAllowedError"))}');
  await clickSound();await waitFor(s=>s.paused&&s.state==='off');assert.equal((await sound()).pressed,'false');
  await ev('HTMLMediaElement.prototype.play=function(){return Promise.reject(new DOMException("simulated decode failure","NotSupportedError"))}');
  await clickSound();await waitFor(s=>s.state==='error');assert.equal((await sound()).pressed,'false');
  await ev('HTMLMediaElement.prototype.play=window.__originalAudioPlay');await clickSound();await waitFor(s=>!s.paused&&s.pressed==='true');
  await clickSound();assert.equal(errors.length,0);
  console.log(JSON.stringify({mode:allowAutoplay?'autoplay-permitted':'autoplay-blocked',realAudioDecoded:true,explicitSoundButton:true,pauseResume:true,mutePreference:true,loop:true,navigationContinuity:true,responsiveControl:true,policyBlockFallback:true,decodeFailureRecovery:true,errors}));
 } finally {if(ws)ws.close();child.kill('SIGTERM');}
})().catch(e=>{console.error(e);process.exitCode=1;});
