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
  const results=[];
  assert.equal(expected.at(-1).pergunta,'','The final house is a reflection, never a question');
  for(const [width,height] of [[320,568],[320,667],[390,844],[1440,1000]]){
   await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<701});
   await ev('__draft.go(0)');await ev('__draft.go(__draft.chapters-2)');
   const ordinaryFont=await ev('parseFloat(getComputedStyle(memoryContent.querySelector("p")).fontSize)');
   await activate('document.getElementById("timeline-next").click()');assert.equal((await state()).phase,'question');
   const beforeArrow=await ev('document.getElementById("timeline-next").getBoundingClientRect().toJSON()');
   await activate('document.getElementById("timeline-next").click()');const final=await state();
   assert.equal(final.active,expected.length-1);assert.equal(final.phase,'story');assert.equal(final.text,expected.at(-1).texto);
   assert(final.progress===100&&final.nextDisabled&&!final.restartHidden&&!final.questionCard&&final.separate&&!final.overflow&&final.bottom,JSON.stringify({width,height,final}));
   const design=await ev(`(()=>{const b=document.querySelector('.bubble'),p=memoryContent.querySelector('p'),a=avatar.getBoundingClientRect(),br=b.getBoundingClientRect(),c=memoryContent;return {final:b.classList.contains('finale'),font:parseFloat(getComputedStyle(p).fontSize),tail:getComputedStyle(b,'::before').display,finishMarkers:document.querySelectorAll('.finish-marker').length,contained:br.left>=8&&br.right<=innerWidth-8,avatarBottom:a.bottom,top:br.top,fullText:c.scrollHeight<=c.clientHeight+1}})()`);
   assert(design.final&&design.font>=24&&design.font>=ordinaryFont*1.5&&design.tail==='none'&&design.finishMarkers===1&&design.contained&&design.top>design.avatarBottom,JSON.stringify({width,height,design}));
   if(height>=667)assert(design.fullText,'The final reflection should be visible without scrolling at standard viewport sizes: '+JSON.stringify({width,height,design}));
   await ev('memoryContent.scrollTop=0');await shot('magnolia-finale-'+width+'x'+height+'.png');
   const afterArrow=await ev('document.getElementById("timeline-next").getBoundingClientRect().toJSON()');assert.equal(afterArrow.x,beforeArrow.x);assert.equal(afterArrow.y,beforeArrow.y);
   await activate('avatar.click();document.querySelector(".stage").click();document.getElementById("timeline-next").click()');assert.equal((await state()).active,expected.length-1);assert.equal((await state()).phase,'story');
   await activate('document.getElementById("timeline-prev").click()');assert.equal((await state()).phase,'question');assert.equal(await ev('document.querySelector(".bubble").classList.contains("finale")'),false);
   await activate('document.getElementById("timeline-next").click()');await activate('document.getElementById("timeline-restart").click()');assert.equal((await state()).active,0);assert.equal(await ev('document.querySelector(".bubble").classList.contains("finale")'),false);
   results.push({width,height,reflection:true,noQuestion:true,completionOnArrival:true,stableControls:true});
  }
  assert.deepEqual(sheetRequests,[]);assert.equal(errors.length,0);console.log(JSON.stringify({ok:true,results,errors}));
 } finally { if(ws)ws.close(); child.kill('SIGTERM'); }
})().catch(e=>{console.error(e);process.exitCode=1;});
