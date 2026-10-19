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
  let liveFixture=null;
  if(!process.env.MAGNOLIA_EXPECTED&&await ev('!!window.__contentSync')){
   await ev('__contentSync.refresh()');
   if(await ev('__contentState.status==="synced"'))liveFixture=require('../docs/sheet-data.js').parse(await ev('fetch(__contentState.source+"&_qa="+Date.now(),{cache:"no-store",credentials:"omit"}).then(r=>{if(!r.ok)throw Error(r.status);return r.text()})'),null,'https://paulosanches.github.io/magnolia-jogo-da-vida/');
  }
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  for(const [k,want] of [['ArrowUp',3],['ArrowDown',1],['ArrowRight',3],['ArrowLeft',1]]){
   await ev('__draft.go(2);document.activeElement.blur()');await key(k);checks.push({key:k,expected:want,actual:await ev('__boardState.active')});
  }
  console.log(JSON.stringify({keyboard:checks}));assert(checks.every(c=>c.actual===c.expected),'Keyboard direction does not follow the upward board');
  if(process.argv.includes('--motion')){
   await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
   await ev('__draft.go(0)');
   await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
   await ev('void __draft.go(1)');
   for(let n=0;n<30&&!await ev('document.getAnimations().length');n++)await sleep(50);
   const spin=await ev(`(()=>{const a=document.getElementById('avatar'),g=document.querySelector('.avatar-ghost');return {moving:__boardState.moving,frames:a.getAnimations().flatMap(x=>x.effect.getKeyframes()).map(f=>f.transform||''),ghost:!!g,ghostHidden:g?.getAttribute('aria-hidden'),ghostPointer:g&&getComputedStyle(g).pointerEvents,source:a.getAttribute('src'),decoded:a.complete&&a.naturalWidth>0}})()`);
   assert(spin.frames.some(t=>t.includes('rotateY')),'Changing character must animate a visible rotating transition');
   assert(spin.moving&&spin.ghost&&spin.ghostHidden==='true'&&spin.ghostPointer==='none'&&spin.decoded&&spin.source==='assets/littlemag.webp',JSON.stringify(spin));
   await ev('document.getAnimations().forEach(a=>{a.pause();a.currentTime=a.effect.getTiming().duration*.25});new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
   const bar=await ev(`(()=>{const fill=document.querySelector('.timeline-progress-fill'),a=fill.getAnimations()[0],r=fill.getBoundingClientRect();return {animated:!!a,ratio:r.width/fill.parentElement.getBoundingClientRect().width,target:1/(__draft.chapters-1),duration:a?.effect.getTiming().duration}})()`);
   assert(bar.animated&&bar.duration===760&&bar.ratio>0&&bar.ratio<bar.target,'Progress must animate through intermediate values in sync with movement: '+JSON.stringify(bar));
   await shot('magnolia-spin-out.png');
   await ev('document.getAnimations().forEach(a=>{a.currentTime=a.effect.getTiming().duration*.75})');
   await shot('magnolia-spin-in.png');
   await ev('document.getAnimations().forEach(a=>a.finish())');
   for(let n=0;n<50&&await ev('__boardState.moving');n++)await sleep(100);
   assert.equal(await ev('__boardState.active'),1);assert.equal(await ev('document.querySelectorAll(".avatar-ghost").length'),0);
   assert.equal(await ev('document.getAnimations().length'),0);
   await ev('void __draft.go(2)');await sleep(50);
   assert.equal(await ev('document.querySelectorAll(".avatar-ghost").length'),0,'Do not spin when character has not changed');
   for(let n=0;n<50&&await ev('__boardState.moving');n++)await sleep(100);
   assert.equal(await ev('__boardState.active'),2);
   await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
   await ev('__draft.go(3)');assert.equal(await ev('document.getAnimations().length'),0);assert.equal(await ev('__boardState.active'),3);
   assert.equal(await ev('document.querySelectorAll(".avatar-ghost").length'),0);
   await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
   await ev('void __draft.go(2)');
   for(let n=0;n<30&&!await ev('document.getAnimations().length');n++)await sleep(50);
   assert(await ev('avatar.getAnimations().some(a=>a.effect.getKeyframes().some(f=>(f.transform||"\").includes("rotateY(85deg)")))'),'Backward character transition should reverse its turn');
   await ev('document.getAnimations().forEach(a=>a.pause());void __draft.go(9)');
   await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
   for(let n=0;n<10&&await ev('__boardState.moving');n++)await sleep(50);
   assert.equal(await ev('__boardState.moving'),false,'Enabling reduced motion must settle the in-flight turn');
   assert.equal(await ev('__boardState.active'),2,'Ignore rapid activation during character transition');
   assert.equal(await ev('document.querySelectorAll(".avatar-ghost").length'),0);
   console.log(JSON.stringify({rotatingCharacterTransition:true,decodedBeforeSwap:true,ghostCleaned:true,sameCharacterNoSpin:true,reducedMotion:true,liveReducedMotion:true,reverseTurn:true,rapidInputLocked:true}));
  }
  if(full){
   const fixture=liveFixture||JSON.parse(fs.readFileSync(expectedPath,'utf8'));const expected=Array.isArray(fixture)?fixture.map(row=>({title:row.titulo,text:row.texto,detail:''})):fixture.chapters;
   const counts=await ev('({chapters:__draft.chapters,stops:document.querySelectorAll(".house-stop").length})');
   assert.equal(counts.chapters,expected.length,'All approved chapters must exist');assert.equal(counts.stops,expected.length,'One visible stop per chapter');
   const states=[];
   for(const [width,height] of [[320,667],[390,844],[1440,1000]]){
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<701});
    for(let i=0;i<expected.length;i++){
     await ev('__draft.go('+i+')');await ev('document.fonts.ready');await ev('avatar.decode()');
     const state=await ev(`(()=>{const c=document.getElementById('memoryContent'),b=document.querySelector('.bubble'),a=document.getElementById('avatar');c.scrollTop=c.scrollHeight;return {active:__boardState.active,waiting:__boardState.waiting,title:c.querySelector('h1').textContent,text:c.querySelector('p').textContent,detail:c.querySelector('.family-detail')?.textContent||'',overflow:c.scrollWidth>c.clientWidth||document.documentElement.scrollWidth>innerWidth,bottom:c.scrollTop+c.clientHeight>=c.scrollHeight-1,bubbleBottom:b.getBoundingClientRect().bottom,avatarBottom:a.getBoundingClientRect().bottom,bubbleTop:b.getBoundingClientRect().top,stopActive:document.querySelectorAll('.house-stop.active').length,animations:document.getAnimations().length}})()`);
     assert.equal(state.title,expected[i].title);assert.equal(state.text,expected[i].text);assert.equal(state.detail,expected[i].detail);
     assert(state.active===i&&state.waiting&&!state.overflow&&state.bottom&&state.bubbleBottom<=height+1&&state.avatarBottom<state.bubbleTop&&state.stopActive===1&&state.animations===0,JSON.stringify({width,i,state}));
     const stamp=await ev(`(()=>{const el=document.getElementById('app-version');if(!el)return null;const r=el.getBoundingClientRect();return {text:el.textContent,datetime:el.getAttribute('datetime'),left:r.left,right:r.right,top:r.top,bottom:r.bottom,position:getComputedStyle(el).position}})()`);
     assert(stamp,'Release timestamp must be visible');
     const release=JSON.parse(fs.readFileSync(path.join(root,'docs/version.json'),'utf8')).version;
     assert.equal(stamp.text,release);assert.equal(stamp.datetime,release);
     assert(stamp.position==='fixed'&&stamp.left>=0&&stamp.right<=width&&width-stamp.right<=20&&stamp.bottom<=height&&height-stamp.bottom<=20&&stamp.top>state.bubbleBottom,JSON.stringify({width,i,stamp,bubbleBottom:state.bubbleBottom}));
     const progress=await ev(`(()=>{const el=document.getElementById('timeline-progress');if(!el)return null;const rect=el.getBoundingClientRect(),fill=el.querySelector('.timeline-progress-fill'),track=fill.parentElement;return {value:Number(el.getAttribute('aria-valuenow')),max:Number(el.getAttribute('aria-valuemax')),label:el.getAttribute('aria-valuetext'),visibleText:el.textContent.trim(),ratio:fill.getBoundingClientRect().width/track.getBoundingClientRect().width,left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,avatarTop:avatar.getBoundingClientRect().top}})()`);
     assert(progress,'Timeline progress must exist');
     const fraction=expected.length===1?1:i/(expected.length-1);
     assert.equal(progress.value,Math.round(fraction*100));assert.equal(progress.max,100);
     assert(progress.label.includes(`${i+1} de ${expected.length}`));
     assert(Math.abs(progress.ratio-fraction)<0.01&&progress.left>=0&&progress.right<=width&&progress.top>=0&&progress.bottom<progress.avatarTop,JSON.stringify({width,i,progress}));
     assert.equal(progress.visibleText,'','Progress must be a bar only, without visible labels or percentage');
     const nav=await ev(`(()=>{const prev=document.getElementById('timeline-prev'),next=document.getElementById('timeline-next');if(!prev||!next)return null;const r=prev.parentElement.getBoundingClientRect(),p=prev.getBoundingClientRect(),n=next.getBoundingClientRect();return {prevDisabled:prev.disabled,nextDisabled:next.disabled,left:r.left,right:r.right,top:r.top,bottom:r.bottom,prevWidth:p.width,prevHeight:p.height,nextWidth:n.width,nextHeight:n.height}})()`);
     assert(nav,'Visible previous/next arrows must exist');
     assert.equal(nav.prevDisabled,i===0);assert.equal(nav.nextDisabled,i===expected.length-1);
     assert(nav.left>=0&&nav.right<=width&&nav.top>state.bubbleBottom&&nav.bottom<stamp.top&&nav.prevWidth>=44&&nav.prevHeight>=44&&nav.nextWidth>=44&&nav.nextHeight>=44,JSON.stringify({width,i,nav,state,stamp}));
     states.push({width,chapter:i,ok:true});
     if(width===390&&i===1){
      const photo=await ev(`(()=>{const p=document.querySelector('image[href$="assets/alagoas.webp"]');if(!p)return null;const r=p.getBoundingClientRect();return {src:p.getAttribute('href'),top:r.top,bottom:r.bottom,left:r.left,right:r.right,bubbleTop:document.querySelector('.bubble').getBoundingClientRect().top}})()`);
      assert(photo&&photo.bottom>0&&photo.top>=0&&photo.left>=0&&photo.right<=width&&photo.bottom<photo.bubbleTop,JSON.stringify(photo));
      await ev(`new Promise((resolve,reject)=>{const i=new Image();i.onload=resolve;i.onerror=reject;i.src='assets/alagoas.webp'})`);
      await shot('magnolia-13-alagoas.png');
     }
     if(i===2){
      const photo=await ev(`(()=>{const p=document.querySelector('image[href$="assets/irmaos-placeholder.jpg"]');if(!p)return null;const r=p.getBoundingClientRect(),a=document.getElementById('avatar').getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,avatarRight:a.right,bubbleTop:document.querySelector('.bubble').getBoundingClientRect().top,fit:p.getAttribute('preserveAspectRatio')}})()`);
      assert(photo,'The siblings chapter must show the supplied placeholder image');
      assert(photo.top>=0&&photo.left>=0&&photo.right<=width&&photo.bottom<photo.bubbleTop&&photo.left>photo.avatarRight&&photo.fit==='xMidYMid meet',JSON.stringify({width,photo}));
      await ev(`new Promise((resolve,reject)=>{const i=new Image();i.onload=resolve;i.onerror=reject;i.src='assets/irmaos-placeholder.jpg'})`);
      if(width===390)await shot('magnolia-siblings-placeholder.png');
     }
     if(width===320&&i===0){await ev('memoryContent.scrollTop=0');await shot('magnolia-13-opening-320.png');}
     if(width===1440&&i===expected.length-1){await ev('memoryContent.scrollTop=0');await shot('magnolia-13-final-desktop.png');}
    }
   }
   await call('Emulation.setDeviceMetricsOverride',{width:320,height:667,deviceScaleFactor:1,mobile:true});
   await ev('__draft.go(0);document.getElementById("timeline-next").focus()');await key('Enter');assert.equal(await ev('__boardState.active'),1,'Next arrow must work with keyboard');
   const prev=await ev('(()=>{const r=document.getElementById("timeline-prev").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');
   await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...prev});await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...prev});assert.equal(await ev('__boardState.active'),0,'Previous arrow must work by click');
   await ev('__draft.go(2);memoryContent.focus();memoryContent.scrollTop=0');await key('ArrowDown');await key('End');await sleep(250);
   const reading=await ev('({active:__boardState.active,end:memoryContent.scrollTop+memoryContent.clientHeight>=memoryContent.scrollHeight-1})');assert(reading.active===2&&reading.end);
   await ev('memoryContent.blur();__draft.go(0)');await key('ArrowDown');assert.equal(await ev('__boardState.active'),0);
   await ev('__draft.go('+ (expected.length-1) +');avatar.click()');assert.equal(await ev('__boardState.active'),expected.length-1,'Avatar must not restart at the end');
   await key('ArrowUp');await key('ArrowRight');await ev('document.querySelector(".stage").click();document.querySelector(".stage").dispatchEvent(new WheelEvent("wheel",{deltaY:100,bubbles:true,cancelable:true}))');
   assert.equal(await ev('__boardState.active'),expected.length-1,'Forward actions must stop at the end');
   assert.equal(await ev('document.querySelectorAll(".house-stop.next").length'),0,'No next stop after final house');
   const restart=await ev('(()=>{const el=document.getElementById("timeline-restart");if(!el||el.hidden)return null;const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,width:r.width,height:r.height,right:r.right}})()');
   assert(restart&&restart.height>=44&&restart.right<=320,'Final house must expose a visible restart button');
   await shot('magnolia-restart-mobile.png');
   await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,x:restart.x,y:restart.y});await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:restart.x,y:restart.y});
   assert.equal(await ev('__boardState.active'),0,'Restart only by its explicit button');assert(await ev('document.getElementById("timeline-restart").hidden'));
   await ev('document.querySelector("[data-go=\\\"12\\\"]").dispatchEvent(new MouseEvent("click",{bubbles:true}))');assert.equal(await ev('__boardState.active'),12);
   await ev('__draft.go(0)');await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
   await key('ArrowUp');await key('ArrowUp');assert(await ev('__boardState.moving'));for(let n=0;n<40 && await ev('__boardState.moving');n++)await sleep(100);assert.equal(await ev('__boardState.active'),1,JSON.stringify(await ev('__boardState')));await sleep(700);assert.equal(await ev('__boardState.active'),1);
   await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
   await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:270,y:120}]});await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:270,y:40}]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});for(let n=0;n<50&&await ev('__boardState.moving');n++)await sleep(100);assert.equal(await ev('__boardState.active'),2);
   assert.equal(await ev('document.getAnimations().length'),0);assert.equal(errors.length,0);
   fs.writeFileSync(path.join(scratch,'magnolia-13-qa.json'),JSON.stringify({ok:true,counts,keyboard:checks,states,reading,errors},null,2));
   console.log(JSON.stringify({ok:true,chapterViewportChecks:states.length,keyboardDirections:4,reading,fullCount:expected.length,movementLock:true,dwell:true,swipe:true,restart:true,errors}));
  }
 } finally { if(ws)ws.close(); child.kill('SIGTERM'); }
})().catch(e=>{console.error(e);process.exitCode=1;});
