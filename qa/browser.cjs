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
  await ev('window.__qaOldDocument=true');
  await call('Page.reload',{ignoreCache:true});
  let loaded=false;for(let i=0;i<200;i++){try{loaded=await ev('!window.__qaOldDocument&&!!window.__draft');if(loaded)break;}catch{}await sleep(100);}
  assert(loaded,'The fresh document did not finish initializing');
  await ev('document.fonts.ready');
  await ev('document.getElementById("reading-playback-toggle").getAttribute("aria-pressed")==="false"&&document.getElementById("reading-playback-toggle").click()');
  const liveFixture=null; // Final content is bundled; never consult the former sheet.
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  const completeCard=async()=>{if(await ev('document.getElementById("timeline-next").getAttribute("aria-label")==="Ver pergunta"')){await ev('document.getElementById("timeline-next").click()');for(let n=0;n<100&&await ev('__boardState.moving');n++)await sleep(30);assert.equal(await ev('__boardState.moving'),false);}};
  if(process.argv.includes('--restart-ground')){
   const frames='new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))';
   const travel="document.getAnimations().filter(a=>a.effect.target!==avatar)";
   const wait=async expression=>{for(let i=0;i<100;i++){if(await ev(expression))return;await sleep(30);}assert.fail('Timed out: '+expression);};
   const seek=async(expression,fraction)=>{await ev(`${expression}.forEach(a=>{a.pause();a.currentTime=a.effect.getTiming().duration*${fraction}});${frames}`);};
   const measure=()=>ev(`(()=>{const a=avatar.getBoundingClientRect(),fill=document.querySelector('.timeline-progress-fill');return {width:a.width,height:a.height,bottom:a.bottom,mapY:new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.map')).transform).m42,progress:fill.getBoundingClientRect().width/fill.parentElement.getBoundingClientRect().width,moving:__boardState.moving,origin:getComputedStyle(avatar).transformOrigin,ghosts:document.querySelectorAll('.avatar-ghost').length}})()`);
   const prepare=async()=>{await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await ev('__draft.go(0)');const src=await ev('avatar.getAttribute("src")');await ev('__draft.go(__draft.chapters-1)');await completeCard();await ev('avatar.decode()');await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});return src;};
   const start=async()=>{await ev('document.getElementById("timeline-restart").click()');await wait('avatar.getAnimations().length>0');await ev('avatar.getAnimations().forEach(a=>a.pause())');};
   const finishShrink=async()=>{await ev('avatar.getAnimations().forEach(a=>a.finish())');await wait('document.querySelector(".map").getAnimations().length>0');await ev(`${travel}.forEach(a=>a.pause())`);};
   const finishTravel=async()=>{await ev(`${travel}.forEach(a=>a.finish())`);await wait('avatar.getAnimations().some(a=>a.effect.getKeyframes()[0].transform==="scale(0)")');await ev('avatar.getAnimations().filter(a=>a.playState!=="finished").forEach(a=>a.pause())');};
   const rise="avatar.getAnimations().filter(a=>a.effect.getKeyframes()[0].transform==='scale(0)')";
   const checks=[];
   for(const [width,height] of [[320,667],[390,844],[1440,1000]]){
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<701});const firstSrc=await prepare(),initial=await measure();await start();
    const keys=await ev('avatar.getAnimations().flatMap(a=>a.effect.getKeyframes()).map(f=>f.transform)');assert(keys.includes('scale(0)'),'Restart must first shrink the character to zero');
    assert.equal(await ev('document.querySelector(".map").getAnimations().length'),0,'Map must wait until the character disappears');
    await seek('avatar.getAnimations()',.5);const shrinking=await measure();assert(shrinking.width>0&&shrinking.width<initial.width&&Math.abs(shrinking.bottom-initial.bottom)<.1,'Shrink toward the feet, not the body center');assert.equal(shrinking.mapY,initial.mapY);assert.equal(shrinking.progress,1);
    if(width===390)await shot('magnolia-restart-shrink.png');
    await seek('avatar.getAnimations()',1);assert((await measure()).width<.01);await finishShrink();await seek(travel,.5);const hidden=await measure();assert(hidden.width<.01&&hidden.height<.01&&hidden.moving&&hidden.ghosts===0);assert(hidden.progress>.4&&hidden.progress<.6);
    if(width===390)await shot('magnolia-restart-hidden.png');
    await ev('void __draft.go(1)');await key('ArrowLeft');await finishTravel();await seek(rise,0);const arrived=await measure();assert(arrived.width<.01&&arrived.progress<.01);assert(Math.abs(arrived.bottom-height*.40)<.1,'Grow from the destination story ground, not the question-row ground');assert.equal(await ev('avatar.getAttribute("src")'),firstSrc);
    await seek(rise,.5);const growing=await measure();assert(growing.width>0&&growing.width<initial.width&&Math.abs(growing.bottom-arrived.bottom)<.1);assert.equal(growing.mapY,arrived.mapY,'Map must stay at the start while the character grows');
    if(width===390)await shot('magnolia-restart-grow.png');
    await ev(`${rise}.forEach(a=>a.finish())`);await wait('!__boardState.moving');assert.equal(await ev('__boardState.active'),0);assert.equal(await ev('document.getAnimations().length'),0);assert.equal((await measure()).width,initial.width);
    checks.push({width,shrunkAtFeet:true,hiddenDuringTravel:true,growsAfterArrival:true});
   }
   for(const phase of ['shrink','travel','grow']){await prepare();await start();if(phase!=='shrink')await finishShrink();if(phase==='grow')await finishTravel();await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait('!__boardState.moving');assert.equal(await ev('__boardState.active'),0);assert.equal(await ev('document.getAnimations().length'),0);assert((await measure()).width>0);}
   const targetSrc=await prepare(),otherSrc=targetSrc==='assets/littlemag.webp'?'assets/mag.webp':'assets/littlemag.webp';await ev(`avatar.src=${JSON.stringify(otherSrc)};avatar.decode()`);await start();await finishShrink();await seek(travel,.5);assert.equal(await ev('avatar.getAttribute("src")'),otherSrc);assert((await measure()).width<.01);assert.equal((await measure()).ghosts,0);await finishTravel();assert.equal(await ev('avatar.getAttribute("src")'),targetSrc);await ev(`${rise}.forEach(a=>a.finish())`);await wait('!__boardState.moving');assert.equal(await ev('__boardState.active'),0);
   for(const phase of ['shrink','travel','grow']){
    await prepare();
    await ev(`(()=>{const target=${phase==='travel'?"document.querySelector('.map')":"avatar"},original=target.animate;window.__qaRestoreAnimate=()=>target.animate=original;target.animate=function(frames,options){if(${JSON.stringify(phase)}!=='grow'||frames[0].transform==='scale(0)')throw Error('Injected animation failure');return original.call(this,frames,options)}})()`);
    await ev('document.getElementById("timeline-restart").click()');await wait('!__boardState.moving');await ev('__qaRestoreAnimate();delete window.__qaRestoreAnimate');assert.equal(await ev('__boardState.active'),0);assert.equal(await ev('document.getAnimations().length'),0);assert((await measure()).width>0);
   }
   assert.equal(errors.length,0);console.log(JSON.stringify({restartGroundSequence:checks,liveReducedMotionInAllPhases:true,inputLock:true,changedCharacterSwappedWhileHidden:true,animationFailureCleanup:true,errors}));return;
  }
  if(process.argv.includes('--restart-motion')){
   const settle=async()=>{for(let i=0;i<80&&await ev('__boardState.moving');i++)await sleep(50);assert.equal(await ev('__boardState.moving'),false);};
   const prepare=async()=>{await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await ev('__draft.go(__draft.chapters-1)');await completeCard();await ev('avatar.decode()');};
   const start=async()=>{await ev('document.getElementById("timeline-restart").click()');for(let i=0;i<40&&!await ev('document.querySelector(".map").getAnimations().length');i++)await sleep(25);assert(await ev('document.querySelector(".map").getAnimations().length'),'Restart must animate the board');await ev('document.getAnimations().filter(a=>a.effect.target!==avatar).forEach(a=>a.pause())');};
   const results=[];
   for(const [width,height] of [[320,667],[390,844],[1440,1000]]){
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<701});await prepare();
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await start();
    const timing=await ev(`(()=>{const map=document.querySelector('.map').getAnimations()[0],bar=document.querySelector('.timeline-progress-fill').getAnimations()[0],pawn=document.querySelector('.avatar-motion').getAnimations()[0];return {map:map.effect.getTiming(),bar:bar.effect.getTiming(),pawn:pawn.effect.getTiming(),locked:__boardState.moving&&document.getElementById('timeline-restart').disabled&&document.getElementById('timeline-next').disabled&&document.getElementById('timeline-prev').disabled}})()`);
    assert(timing.map.duration>=1200&&timing.map.duration<=2800,'Restart must allow time for a smooth return, not use the short adjacent-house duration: '+JSON.stringify(timing));
    assert.equal(timing.bar.duration,timing.map.duration);assert.equal(timing.pawn.duration,timing.map.duration);assert(timing.locked);
    const samples=[];
    for(const fraction of [0,.1,.5,.9,1]){
     await ev(`document.getAnimations().filter(a=>a.effect.target!==avatar).forEach(a=>a.currentTime=a.effect.getTiming().duration*${fraction});new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`);
     samples.push(await ev(`(()=>{const m=document.querySelector('.map'),f=document.querySelector('.timeline-progress-fill');return {y:new DOMMatrixReadOnly(getComputedStyle(m).transform).m42,progress:f.getBoundingClientRect().width/f.parentElement.getBoundingClientRect().width}})()`));
     if(width===390&&fraction===.5)await shot('magnolia-restart-midpoint.png');
    }
    const distance=samples.at(-1).y-samples[0].y;assert(Math.abs(distance)>100);
    const fractions=samples.map(s=>(s.y-samples[0].y)/distance);
    assert(fractions[1]>0&&fractions[1]<.06&&fractions[2]>.4&&fractions[2]<.6&&fractions[3]>.94&&fractions[3]<1,'Return should ease in and out, with continuous intermediate positions: '+JSON.stringify(fractions));
    for(let i=1;i<samples.length;i++){assert(fractions[i]>fractions[i-1]);assert(samples[i].progress<samples[i-1].progress);}
    assert(Math.abs(samples[0].progress-1)<.01&&samples.at(-1).progress<.01);
    await ev('document.getElementById("timeline-restart").click();document.getElementById("timeline-next").click()');await key('ArrowRight');
    await ev('document.getAnimations().forEach(a=>a.finish())');await settle();
    assert.equal(await ev('__boardState.active'),0);assert.equal(await ev('document.getAnimations().length'),0);assert(await ev('document.getElementById("timeline-restart").hidden'));
    assert.equal(await ev('document.querySelectorAll(".avatar-ghost").length'),0);
    await prepare();await ev('document.getElementById("timeline-restart").click()');assert.equal(await ev('__boardState.active'),0);assert.equal(await ev('document.getAnimations().length'),0,'Respect reduced motion');
    await prepare();await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await start();
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await settle();assert.equal(await ev('__boardState.active'),0);assert.equal(await ev('document.getAnimations().length'),0,'Live reduced motion must settle restart');
    results.push({width,duration:timing.map.duration,fractions,progress:samples.map(s=>s.progress)});
   }
   assert.equal(errors.length,0);console.log(JSON.stringify({smoothRestart:results,rapidInputLocked:true,reducedMotion:true,liveReducedMotion:true,errors}));return;
  }
  if(process.argv.includes('--end-controls')){
   const settle=async()=>{for(let i=0;i<120&&await ev('__boardState.moving');i++)await sleep(50);assert.equal(await ev('__boardState.moving'),false);};
   const click=async(point,input='mouse')=>{
    if(input==='touch'){await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
    else{await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});}
    await ev('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');await settle();
   };
   const rect=async id=>ev(`(()=>{const r=document.getElementById(${JSON.stringify(id)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
   const results=[];
   for(const [width,height] of [[320,667],[390,844],[1440,1000]])for(const motion of ['reduce','no-preference'])for(const input of ['mouse','touch']){
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<701});
    await call('Emulation.setTouchEmulationEnabled',{enabled:input==='touch',maxTouchPoints:1});
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await ev('__draft.go(__draft.chapters-2)');await completeCard();
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:motion}]});
    const before=await rect('timeline-next'),previousBefore=await rect('timeline-prev');await click(before,input);
    const last=await ev('__draft.chapters-1');assert.equal(await ev('__boardState.active'),last);await click(before,input);assert.equal(await ev('__boardState.phase'),'story');
    const after=await rect('timeline-next'),previousAfter=await rect('timeline-prev'),hit=await ev(`document.elementFromPoint(${before.x},${before.y})?.closest('button')?.id`);
    await click(before,input);
    const actual=await ev('__boardState.active');console.log(JSON.stringify({width,motion,input,before,after,secondClickTarget:hit,expected:last,actual}));
    assert.equal(actual,last,'Repeating a click at the advance-arrow position must not restart the story');
    assert.deepEqual(previousBefore,previousAfter,'Previous arrow must remain in place too');
    assert(Math.abs(before.x-after.x)<.5&&Math.abs(before.y-after.y)<.5,'Navigation arrows must not move at the final house');
    await click(await rect('timeline-restart'),input);assert.equal(await ev('__boardState.active'),0,'Only the explicit restart button restarts');
    results.push({width,motion,input,ok:true});
   }
   console.log(JSON.stringify({finalControls:results,errors}));assert.equal(errors.length,0);return;
  }
  for(const [k,want] of [['ArrowUp',3],['ArrowDown',1],['ArrowRight',3],['ArrowLeft',1]]){
   await ev('__draft.go(0)');await ev('__draft.go(2);document.activeElement.blur()');if(want===3)await completeCard();await key(k);checks.push({key:k,expected:want,actual:await ev('__boardState.active')});
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
   assert.equal(await ev('document.querySelectorAll(".avatar-ghost").length'),1,'The third house now has a different character');
   for(let n=0;n<50&&await ev('__boardState.moving');n++)await sleep(100);
   assert.equal(await ev('__boardState.active'),2);
   assert.match(await ev('avatar.getAttribute("src")'),/^assets\/character-casa-03-[a-f0-9]+\.png$/);
   await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
   await ev('__draft.go(0)');
   const professional=JSON.parse(fs.readFileSync(path.join(root,'editorial/character-artwork.json'),'utf8')).find(row=>row.id==='casa-profissao').asset;
   await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
   await ev('void __draft.go(10)');
   for(let n=0;n<30&&!await ev('document.querySelectorAll(".avatar-ghost").length');n++)await sleep(50);
   assert.equal(await ev('avatar.getAttribute("src")'),professional);assert.equal(await ev('document.querySelectorAll(".avatar-ghost").length'),1,'The eleventh house must turn into its newly supplied character');
   for(let n=0;n<50&&await ev('__boardState.moving');n++)await sleep(100);
   await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await ev('__draft.go(0)');
   // Every active house now has unique artwork. Test image reuse by preloading
   // the target image onto the pawn, without changing production mappings.
   await ev('avatar.src='+JSON.stringify(professional)+';avatar.decode()');const sameSource=await ev('avatar.getAttribute("src")');
   await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
   await ev('void __draft.go(10)');await sleep(50);
   assert.equal(await ev('avatar.getAttribute("src")'),sameSource);
   assert.equal(await ev('document.querySelectorAll(".avatar-ghost").length'),0,'Do not spin when character has not changed');
   for(let n=0;n<50&&await ev('__boardState.moving');n++)await sleep(100);
   assert.equal(await ev('__boardState.active'),10);
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
   const fixture=liveFixture||JSON.parse(fs.readFileSync(expectedPath,'utf8'));const expected=Array.isArray(fixture)?fixture.map(row=>({id:row.id,title:row.titulo,text:row.texto,question:row.pergunta,detail:''})):fixture.chapters;
   const counts=await ev('({chapters:__draft.chapters,stops:document.querySelectorAll(".house-stop").length})');
   assert.equal(counts.chapters,expected.length,'All approved chapters must exist');assert.equal(counts.stops,expected.length,'One visible stop per chapter');
   const artwork=new Map(JSON.parse(fs.readFileSync(path.join(root,'editorial/character-artwork.json'),'utf8')).map(row=>[row.id,row]));
   const states=[];
   for(const [width,height] of [[320,667],[390,844],[1440,1000]]){
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<701});
    for(let i=0;i<expected.length;i++){
     await ev('__draft.go('+i+')');await ev('document.fonts.ready');await ev('avatar.decode()');
     const state=await ev(`(()=>{const c=document.getElementById('memoryContent'),b=document.querySelector('.bubble'),a=document.getElementById('avatar');c.scrollTop=c.scrollHeight;return {active:__boardState.active,waiting:__boardState.waiting,title:c.querySelector('h1')?.textContent||'',text:c.querySelector('p').textContent,detail:c.querySelector('.family-detail')?.textContent||'',overflow:c.scrollWidth>c.clientWidth||document.documentElement.scrollWidth>innerWidth,bottom:c.scrollTop+c.clientHeight>=c.scrollHeight-1,bubbleBottom:b.getBoundingClientRect().bottom,avatarBottom:a.getBoundingClientRect().bottom,bubbleTop:b.getBoundingClientRect().top,stopActive:document.querySelectorAll('.house-stop.active').length,animations:document.getAnimations().length}})()`);
     assert.equal(state.title,expected[i].title);assert.equal(state.text,expected[i].text);assert.equal(state.detail,expected[i].detail);
     assert(state.active===i&&state.waiting&&!state.overflow&&state.bottom&&state.bubbleBottom<=height+1&&state.avatarBottom<state.bubbleTop&&state.stopActive===1&&state.animations===0,JSON.stringify({width,i,state}));
     const stamp=await ev(`(()=>{const el=document.getElementById('app-version');if(!el)return null;const r=el.getBoundingClientRect();return {text:el.textContent,datetime:el.getAttribute('datetime'),left:r.left,right:r.right,top:r.top,bottom:r.bottom,position:getComputedStyle(el).position}})()`);
     assert(stamp,'Release timestamp must be visible');
     const release=JSON.parse(fs.readFileSync(path.join(root,'docs/version.json'),'utf8')).version;
     assert.equal(stamp.text,release);assert.equal(stamp.datetime,release);
     assert(stamp.position==='fixed'&&stamp.left>=0&&stamp.right<=width&&width-stamp.right<=20&&stamp.bottom<=height&&height-stamp.bottom<=20&&stamp.top>state.bubbleBottom,JSON.stringify({width,i,stamp,bubbleBottom:state.bubbleBottom}));
     const progress=await ev(`(()=>{const el=document.getElementById('timeline-progress');if(!el)return null;const rect=el.getBoundingClientRect(),fill=el.querySelector('.timeline-progress-fill'),track=fill.parentElement;return {value:Number(el.getAttribute('aria-valuenow')),max:Number(el.getAttribute('aria-valuemax')),label:el.getAttribute('aria-valuetext'),visibleText:el.textContent.trim(),ratio:fill.getBoundingClientRect().width/track.getBoundingClientRect().width,left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,avatarTop:avatar.getBoundingClientRect().top}})()`);
     assert(progress,'Timeline progress must exist');
     const total=expected.reduce((n,d)=>n+1+(d.question?.trim()?1:0),0);const before=expected.slice(0,i).reduce((n,d)=>n+1+(d.question?.trim()?1:0),0);const fraction=total===1?1:before/(total-1);
     assert.equal(progress.value,Math.round(fraction*100));assert.equal(progress.max,100);
     assert(progress.label.includes(`${i+1} de ${expected.length}`));
     assert(Math.abs(progress.ratio-fraction)<0.01&&progress.left>=0&&progress.right<=width&&progress.top>=0&&progress.bottom<progress.avatarTop,JSON.stringify({width,i,progress}));
     assert.equal(progress.visibleText,'','Progress must be a bar only, without visible labels or percentage');
     const nav=await ev(`(()=>{const prev=document.getElementById('timeline-prev'),next=document.getElementById('timeline-next');if(!prev||!next)return null;const r=prev.parentElement.getBoundingClientRect(),p=prev.getBoundingClientRect(),n=next.getBoundingClientRect();return {prevDisabled:prev.disabled,nextDisabled:next.disabled,left:r.left,right:r.right,top:r.top,bottom:r.bottom,prevWidth:p.width,prevHeight:p.height,nextWidth:n.width,nextHeight:n.height}})()`);
     assert(nav,'Visible previous/next arrows must exist');
     assert.equal(nav.prevDisabled,i===0);assert.equal(nav.nextDisabled,i===expected.length-1&&!expected[i].question?.trim());
     assert(nav.left>=0&&nav.right<=width&&nav.top>state.bubbleBottom&&nav.bottom<stamp.top&&nav.prevWidth>=44&&nav.prevHeight>=44&&nav.nextWidth>=44&&nav.nextHeight>=44,JSON.stringify({width,i,nav,state,stamp}));
     const art=artwork.get(expected[i].id);
     if(art){
      const image=await ev(`(()=>{const a=document.getElementById('avatar'),r=a.getBoundingClientRect(),canvas=document.createElement('canvas');canvas.width=a.naturalWidth;canvas.height=a.naturalHeight;const ctx=canvas.getContext('2d');ctx.drawImage(a,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;let transparent=0,opaque=0;for(let n=3;n<pixels.length;n+=4){if(pixels[n]===0)transparent++;if(pixels[n]===255)opaque++;}return {src:a.getAttribute('src'),decoded:a.complete&&a.naturalWidth>0,width:a.naturalWidth,height:a.naturalHeight,fit:getComputedStyle(a).objectFit,left:r.left,right:r.right,top:r.top,bottom:r.bottom,transparent,opaque}})()`);
      assert.equal(image.src,art.asset);assert.equal(image.width,art.width);assert.equal(image.height,art.height);assert.equal(image.fit,'contain');
      assert(image.decoded&&image.transparent>0&&image.opaque>0&&image.left>=0&&image.right<=width&&image.top>=0&&image.bottom<state.bubbleTop,JSON.stringify(image));
      if(width===390)await shot('magnolia-character-'+art.id+'.png');
     }
     if(expected[i].id==='casa-08')assert.equal(await ev('document.querySelectorAll("[data-live-photo=casa-08]").length'),0,'House 7 must retain its character without a side photograph');
     states.push({width,chapter:i,ok:true});
     if(width===390&&i===1){
      const photo=await ev(`(()=>{const p=document.querySelector('image[href$="assets/alagoas.webp"]');if(!p)return null;const r=p.getBoundingClientRect();return {src:p.getAttribute('href'),top:r.top,bottom:r.bottom,left:r.left,right:r.right,bubbleTop:document.querySelector('.bubble').getBoundingClientRect().top}})()`);
      assert(photo&&photo.bottom>0&&photo.top>=0&&photo.left>=0&&photo.right<=width&&photo.bottom<photo.bubbleTop,JSON.stringify(photo));
      await ev(`new Promise((resolve,reject)=>{const i=new Image();i.onload=resolve;i.onerror=reject;i.src='assets/alagoas.webp'})`);
      await shot('magnolia-13-alagoas.png');
     }
     if(i===2){
      assert.equal(await ev('document.querySelectorAll("[data-live-photo=casa-03], [data-photo=siblings-placeholder], image[href*=irmaos-placeholder]").length'),0,'House 3 must keep its character without a side photograph');
      if(width===390)await shot('magnolia-house3-no-side-photo.png');
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
   await ev('__draft.go('+ (expected.length-1) +')');await completeCard();await ev('avatar.click()');assert.equal(await ev('__boardState.active'),expected.length-1,'Avatar must not restart at the end');
   await key('ArrowUp');await key('ArrowRight');await ev('document.querySelector(".stage").click();document.querySelector(".stage").dispatchEvent(new WheelEvent("wheel",{deltaY:100,bubbles:true,cancelable:true}))');
   assert.equal(await ev('__boardState.active'),expected.length-1,'Forward actions must stop at the end');
   assert.equal(await ev('document.querySelectorAll(".house-stop.next").length'),0,'No next stop after final house');
   const restart=await ev('(()=>{const el=document.getElementById("timeline-restart");if(!el||el.hidden)return null;const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,width:r.width,height:r.height,right:r.right}})()');
   assert(restart&&restart.height>=44&&restart.right<=320,'Final house must expose a visible restart button');
   await shot('magnolia-restart-mobile.png');
   await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,x:restart.x,y:restart.y});await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:restart.x,y:restart.y});
   assert.equal(await ev('__boardState.active'),0,'Restart only by its explicit button');assert(await ev('document.getElementById("timeline-restart").hidden'));
   await ev('document.querySelectorAll(".house-stop")[__draft.chapters-1].dispatchEvent(new MouseEvent("click",{bubbles:true}))');assert.equal(await ev('__boardState.active'),1,'Direct shortcuts cannot skip unseen houses');
   await ev('__draft.go(0)');await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
   await key('ArrowUp');await key('ArrowUp');assert(await ev('__boardState.moving'));for(let n=0;n<40 && await ev('__boardState.moving');n++)await sleep(100);assert.equal(await ev('__boardState.active'),1,JSON.stringify(await ev('__boardState')));await sleep(700);assert.equal(await ev('__boardState.active'),1);
   await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
   await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:270,y:120}]});await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:270,y:40}]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});for(let n=0;n<50&&await ev('__boardState.moving');n++)await sleep(100);assert.equal(await ev('__boardState.active'),1);assert.equal(await ev('__boardState.phase'),'question');await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:270,y:120}]});await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:270,y:40}]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});for(let n=0;n<50&&await ev('__boardState.moving');n++)await sleep(100);assert.equal(await ev('__boardState.active'),2);
   assert.equal(await ev('document.getAnimations().length'),0);assert.equal(errors.length,0);
   fs.writeFileSync(path.join(scratch,'magnolia-13-qa.json'),JSON.stringify({ok:true,counts,keyboard:checks,states,reading,errors},null,2));
   console.log(JSON.stringify({ok:true,chapterViewportChecks:states.length,keyboardDirections:4,reading,fullCount:expected.length,movementLock:true,dwell:true,swipe:true,restart:true,errors}));
  }
 } finally { if(ws)ws.close(); child.kill('SIGTERM'); }
})().catch(e=>{console.error(e);process.exitCode=1;});
