const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const {pathToFileURL} = require('node:url');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const scratch = path.join(process.env.HOME, '.hermes/cache/scratch');
const full = process.argv.includes('--full');
const expectedPath = process.env.MAGNOLIA_EXPECTED || path.join(root, 'editorial/approved-copy.json');
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
  const key=async k=>{await call('Input.dispatchKeyEvent',{type:'keyDown',key:k,code:k,windowsVirtualKeyCode:{ArrowUp:38,ArrowDown:40,ArrowLeft:37,ArrowRight:39,End:35,Enter:13}[k]});await call('Input.dispatchKeyEvent',{type:'keyUp',key:k,code:k});};
  const shot=async name=>{const d=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(scratch,name),Buffer.from(d.data,'base64'));};
  await call('Runtime.enable');await call('Page.enable');
  await call('Page.reload',{ignoreCache:true});
  for(let i=0;i<50;i++){if(await ev('!!window.__draft'))break;await sleep(100);}
  await ev('document.fonts.ready');
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  assert(await ev('!!window.__contentSync'),'The public sheet must be connected to the running board');
  await ev('__contentSync.refresh()');
  const live=await ev('__contentState');
  assert.equal(live.status,'synced',JSON.stringify(live));assert.equal(live.count,14);assert.equal(await ev('__draft.chapters'),14);assert.equal(await ev('document.querySelectorAll(".house-stop").length'),14);await ev('__draft.go(13)');assert.equal(await ev('memoryContent.querySelector("h1").textContent'),'Teste');
  console.log(JSON.stringify({realPublishedSheetRead:true,state:live}));
  const original=JSON.parse(fs.readFileSync(path.join(root,'docs/milestones.json'),'utf8'));
  const csv=rows=>['id,ordem,titulo,texto,foto',...rows.map(r=>['id','ordem','titulo','texto','foto'].map(k=>'"'+String(r[k]).replaceAll('"','""')+'"').join(','))].join('\r\n');
  const supply=async rows=>ev(`window.__testCsv=${JSON.stringify(csv(rows))};window.__nativeFetch ||= window.fetch;window.fetch=(url,options)=>{window.__lastFetch={url:String(url),options};return Promise.resolve(new Response(window.__testCsv,{status:200,headers:{'Content-Type':'text/csv'}}))};`);
  const read=()=>ev('({state:__boardState,title:memoryContent.querySelector("h1").textContent,text:memoryContent.querySelector("p").textContent,images:memoryContent.querySelectorAll("img").length})');
  await ev('__draft.go(2)');
  const changed=structuredClone(original);changed[2].titulo='Título alterado no teste';changed[2].texto='<img src=x onerror="window.__injected=true"> Texto, com vírgula\nsegunda linha';changed[2].foto=original[1].foto;
  await supply(changed);await ev('__contentSync.refresh()');
  let state=await read();assert.equal(state.title,changed[2].titulo);assert.equal(state.text,changed[2].texto);assert.equal(state.images,0);assert.equal(await ev('!!window.__injected'),false);assert.equal(state.state.active,2);
  assert.equal(await ev(`document.querySelector('[data-live-photo="casa-03"] image').getAttribute("href")`),changed[2].foto);
  assert.equal(await ev('__lastFetch.options.cache'),'no-store');assert(await ev('__lastFetch.url.includes("_=")'));
  const duplicate=structuredClone(changed);duplicate[1].id=duplicate[0].id;await supply(duplicate);await ev('__contentSync.refresh()');assert.equal((await read()).title,changed[2].titulo);assert.equal(await ev('__contentState.status'),'error');
  await ev('window.fetch=()=>Promise.reject(Error("offline test"))');await ev('__contentSync.refresh()');assert.equal((await read()).title,changed[2].titulo);
  const brokenPhoto=structuredClone(changed);brokenPhoto[2].foto=new URL('assets/missing-test-photo.jpg',url.startsWith('http')?url:'https://paulosanches.github.io/magnolia-jogo-da-vida/').href;
  await supply(brokenPhoto);await ev('__contentSync.refresh()');assert.equal(await ev(`document.querySelector('[data-live-photo="casa-03"] image').getAttribute("href")`),changed[2].foto);
  const reordered=structuredClone(changed);reordered[2].ordem=2;reordered[1].ordem=3;
  await supply(reordered);await ev('__contentSync.refresh()');state=await read();assert.equal(state.state.active,1);assert.equal(state.title,changed[2].titulo);
  const extended=structuredClone(original);extended.push({id:'novo-marco',ordem:15,titulo:'Outra casa',texto:'Casa adicionada durante a visita.',foto:''});
  await supply(extended);await ev('__contentSync.refresh()');assert.equal(await ev('__draft.chapters'),15);assert.equal(await ev('document.querySelectorAll(".house-stop").length'),15);
  await ev('__draft.go(14)');assert.equal((await read()).title,'Outra casa');
  await supply(original);await ev('__contentSync.refresh()');assert.equal(await ev('__draft.chapters'),14);assert.equal(await ev('document.querySelectorAll(".house-stop").length'),14);assert.equal((await read()).state.active,13);
  assert.equal(await ev('document.getElementById("timeline-remaining").textContent'),'Concluído');
  await ev('__draft.go(0)');assert.equal(await ev('document.getElementById("timeline-progress").getAttribute("aria-valuenow")'),'0');
  await supply(extended);await ev('__contentSync.refresh()');assert.equal(await ev('document.getElementById("timeline-remaining").textContent'),'Faltam 14 casas');
  await supply([original[0]]);await ev('__contentSync.refresh()');assert.equal(await ev('document.getElementById("timeline-progress").getAttribute("aria-valuenow")'),'100');assert.equal(await ev('document.getElementById("timeline-remaining").textContent'),'Concluído');
  await supply(original);await ev('__contentSync.refresh()');assert.equal(await ev('document.getElementById("timeline-progress").getAttribute("aria-valuenow")'),'0');
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await ev('void __draft.go(1)');
  for(let n=0;n<30&&!await ev('document.getAnimations().length');n++)await sleep(50);
  await ev('document.getAnimations().forEach(a=>a.pause())');
  const pendingRows=structuredClone(original);pendingRows[1].titulo='Atualizado durante movimento';await supply(pendingRows);await ev('__contentSync.refresh()');assert(await ev('__boardState.moving'));assert.equal(await ev('__contentState.status'),'pending');
  await ev('document.getAnimations().forEach(a=>a.finish())');for(let n=0;n<50&&await ev('__boardState.moving');n++)await sleep(100);
  assert.equal((await read()).title,pendingRows[1].titulo);assert.equal((await read()).state.active,1);
  await ev('window.fetch=window.__nativeFetch');await ev('__contentSync.refresh()');assert.equal(await ev('__contentState.status'),'synced');assert.equal((await read()).title,original[1].titulo);
  if(process.argv.includes('--timer')){
   await ev('__draft.go(1)');const polled=structuredClone(original);polled[1].titulo='Atualização recebida pelo temporizador';await supply(polled);
   const began=Date.now();
   for(let n=0;n<70&&(await read()).title!==polled[1].titulo;n++)await sleep(1000);
   assert.equal((await read()).title,polled[1].titulo,'An already-open page must update without manual refresh');
   console.log(JSON.stringify({automaticTimerRefresh:true,elapsedMs:Date.now()-began}));
   await ev('window.fetch=window.__nativeFetch');await ev('__contentSync.refresh()');assert.equal((await read()).title,original[1].titulo);
  }
  assert.equal(errors.length,0);
  console.log(JSON.stringify({liveRefresh:true,liveAddRemove:true,safeText:true,photoUpdate:true,invalidEditFallback:true,offlineFallback:true,brokenImageFallback:true,stableIdReorder:true,queuedDuringMotion:true,realSheetRestored:true,errors}));

 } finally { if(ws)ws.close(); child.kill('SIGTERM'); }
})().catch(e=>{console.error(e);process.exitCode=1;});
