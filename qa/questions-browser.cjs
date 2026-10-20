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
  const results=[];const totalSteps=expected.reduce((n,r)=>n+1+(r.pergunta.trim()?1:0),0);
  for(const [width,height] of [[320,667],[390,844],[1440,1000]]){
   await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<701});await ev('__draft.go(0)');let step=0;
   for(let i=0;i<expected.length;i++){
    let s=await state();assert.equal(s.active,i);assert.equal(s.phase,'story');assert.equal(s.title,expected[i].titulo);assert.equal(s.text,expected[i].texto);assert(!s.questionCard&&!s.overflow&&s.bottom&&s.separate,JSON.stringify({width,i,s}));assert.equal(s.progress,Math.round(step/(totalSteps-1)*100));results.push({width,id:expected[i].id,phase:'story'});
    if(expected[i].pergunta.trim()){
     const beforeQuestion=await ev('avatar.getBoundingClientRect().toJSON()');
     assert(s.restartHidden,'Final story cannot expose restart before its question');await activate('document.getElementById("timeline-next").click()');s=await state();step++;
     assert.equal(s.active,i,'Showing a question must not move to another house');assert.equal(s.phase,'question');assert.equal(s.text,expected[i].pergunta);assert(s.questionCard&&!s.overflow&&s.bottom&&s.separate&&s.inputs===0,JSON.stringify({width,i,s}));assert.equal(s.progress,Math.round(step/(totalSteps-1)*100));results.push({width,id:expected[i].id,phase:'question'});
     const geometry=await ev(`(()=>{const a=avatar.getBoundingClientRect(),b=document.querySelector('.bubble').getBoundingClientRect();return {a:a.toJSON(),b:b.toJSON(),beside:b.right<=a.left-8||b.left>=a.right+8,aligned:Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>40,contained:b.left>=8&&b.right<=innerWidth-8&&a.left>=0&&a.right<=innerWidth}})()`);
     for(const prop of ['x','y','width','height'])assert(Math.abs(geometry.a[prop]-beforeQuestion[prop])<.1,'Showing a question must not move or resize the character: '+prop);
     assert(geometry.beside&&geometry.aligned&&geometry.contained,'Question must sit beside its character: '+JSON.stringify({width,i,geometry}));
     if(i===1)await shot('magnolia-question-side-'+width+'.png');
     if(width===390&&i===5)await shot('magnolia-final-house6.png');
     if(width===390&&i===1)await shot('magnolia-question-card-mobile.png');
    }
    if(i<expected.length-1){await activate('document.getElementById("timeline-next").click()');step++;}
    else{assert.equal(s.progress,100);assert(s.nextDisabled&&!s.restartHidden);await activate('document.getElementById("timeline-next").click()');assert.equal((await state()).active,i);await shot('magnolia-question-final.png');await activate('document.getElementById("timeline-restart").click()');assert.equal((await state()).active,0);assert.equal((await state()).phase,'story');}
   }
  }
  // Resize the question in place, including short landscape and breakpoint edges.
  await ev('__draft.go(0)');await ev('__draft.go(1)');await activate('document.getElementById("timeline-next").click()');
  for(const [width,height] of [[320,568],[700,700],[701,700],[844,390]]){
   await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<701});await ev('__draft.update()');
   const g=await ev(`(()=>{const b=document.querySelector('.bubble').getBoundingClientRect(),a=avatar.getBoundingClientRect(),n=document.querySelector('.timeline-navigation').getBoundingClientRect(),t=getComputedStyle(document.querySelector('.bubble'),'::before');return {beside:b.left>=a.right+8||b.right<=a.left-8,inside:b.left>=8&&b.right<=innerWidth-8&&b.top>=0&&b.bottom<n.top-12,tail:(parseFloat(t.left)<0||parseFloat(t.right)<0)&&parseFloat(t.top)>=20}})()`);
   assert(g.beside&&g.inside&&g.tail,JSON.stringify({width,height,g}));
  }
  await call('Emulation.setDeviceMetricsOverride',{width:320,height:568,deviceScaleFactor:1,mobile:true});
  await ev('memoryContent.querySelector("p").textContent="Pergunta longa para conversar em família. ".repeat(60);__draft.update()');
  let long=await state();assert(!long.overflow&&long.bottom&&long.separate,'Long questions must remain scrollable and clear of controls');
  await shot('magnolia-question-side-long.png');
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await ev('__draft.go(0)');
  await ev('__draft.go(1)');await activate('document.querySelector("[data-go=\\"11\\"]").dispatchEvent(new MouseEvent("click",{bubbles:true}))');assert.equal((await state()).active,1);assert.equal((await state()).phase,'question');await activate('document.querySelector("[data-go=\\"11\\"]").dispatchEvent(new MouseEvent("click",{bubbles:true}))');assert.equal((await state()).active,2,'Board shortcuts cannot skip unseen houses');
  for(const expression of ['avatar.click()','document.querySelector(".stage").click()','document.getElementById("timeline-next").click()']){
   await ev('__draft.go(0)');await ev('__draft.go(1)');await activate(expression);assert.equal((await state()).active,1);assert.equal((await state()).phase,'question');await activate(expression);assert.equal((await state()).active,2);
  }
  for(const k of ['ArrowUp','ArrowRight']){await ev('__draft.go(0)');await ev('__draft.go(1);document.activeElement.blur()');await key(k);await settle();assert.equal((await state()).active,1);assert.equal((await state()).phase,'question');await key(k);await settle();assert.equal((await state()).active,2);}
  await ev('__draft.go(0)');await ev('__draft.go(1);avatar.focus()');await key('Enter');await settle();assert.equal((await state()).active,1);assert.equal((await state()).phase,'question');await key('Enter');await settle();assert.equal((await state()).active,2);await ev('avatar.blur()');
  await ev('__draft.go(0)');await ev('__draft.go(1)');await activate('document.querySelector(".stage").dispatchEvent(new WheelEvent("wheel",{deltaY:100,bubbles:true,cancelable:true}))');assert.equal((await state()).active,1);assert.equal((await state()).phase,'question');await ev('new Promise(r=>setTimeout(r,1000))');await activate('document.querySelector(".stage").dispatchEvent(new WheelEvent("wheel",{deltaY:100,bubbles:true,cancelable:true}))');assert.equal((await state()).active,2);
  await ev('__draft.go(0)');await ev('__draft.go(1)');await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await activate('document.getElementById("timeline-next").click();document.getElementById("timeline-next").click();window.__qaPawnMotion=document.querySelector(".avatar-motion").getAnimations().length');assert.equal(await ev('__qaPawnMotion'),0,'Only the balloon may animate when a question opens');assert.equal((await state()).active,1);assert.equal((await state()).phase,'question','Rapid input must not skip question rendering');
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await activate('document.getElementById("timeline-prev").click()');assert.equal((await state()).active,1);assert.equal((await state()).phase,'story');
  // Going back must land directly in the previous question row, without a final snap.
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await ev('__draft.go(0)');await ev('__draft.go(2);avatar.decode()');
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await ev('document.getElementById("timeline-prev").click()');
  for(let i=0;i<100&&!await ev('document.querySelector(".avatar-motion").getAnimations().length');i++)await sleep(30);
  await ev('document.getAnimations().forEach(a=>{a.pause();a.currentTime=a.effect.getTiming().duration});new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  const arrival=await ev('avatar.getBoundingClientRect().toJSON()');
  await ev('document.getAnimations().forEach(a=>a.finish())');await settle();
  const landed=await ev('avatar.getBoundingClientRect().toJSON()');
  assert.equal((await state()).phase,'question');
  assert(Math.abs(arrival.x-landed.x)<1&&Math.abs(arrival.y-landed.y)<1,'Reverse travel must end at question position without snapping: '+JSON.stringify({arrival,landed}));
  await ev('window.dispatchEvent(new Event("focus"));document.dispatchEvent(new Event("visibilitychange"))');
  assert.deepEqual(sheetRequests,[],'No Google Sheets or synchronization-script requests, including on refocus');
  assert.equal(errors.length,0);console.log(JSON.stringify({staticContent:true,noSheetRequests:true,ok:true,houses:expected.length,questions:expected.filter(r=>r.pergunta.trim()).length,cardViewportChecks:results.length,exactDraftText:true,mandatoryQuestions:true,noInputOrSkip:true,keyboard:true,boardShortcutGated:true,rapidInputLocked:true,errors}));
 } finally { if(ws)ws.close(); child.kill('SIGTERM'); }
})().catch(e=>{console.error(e);process.exitCode=1;});
