/* Public worksheet polling. No credentials or executable sheet content. */
(function(root){
 'use strict';
 function start({source,allowedIds,baseUrl,initial,onRows,isMoving,parseRows,cachePrefix='magnolia-sheet-v1:'}){
  const storageKey=cachePrefix+source;
  let current=JSON.stringify(initial),applied=initial,inflight=null,pending=null,booting=true;
  const status={status:'fallback',count:initial.length,lastChecked:null,lastUpdated:null,error:null,source,pollMs:60000};
  root.__contentState=status;
  function save(csv){try{localStorage.setItem(storageKey,csv)}catch{}}
  function apply(update){
   if(isMoving()){pending=update;status.status='pending';return false;}
   onRows(update.rows);applied=update.rows;current=JSON.stringify(update.rows);pending=null;
   status.status='synced';status.count=applied.length;status.lastUpdated=new Date().toISOString();status.error=null;save(update.csv);return true;
  }
  function loadImage(url){
   return new Promise((resolve,reject)=>{
    const image=new Image();let settled=false;
    const done=error=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve()};
    const timer=setTimeout(()=>done(Error('A foto não respondeu a tempo.')),5000);
    image.referrerPolicy='no-referrer';image.src=url;
    image.decode().then(()=>done(),()=>done(Error('Uma foto não está acessível.')));
   });
  }
  async function accept(csv){
   const rows=parseRows?parseRows(csv,allowedIds,baseUrl):root.MagnoliaSheetData.parse(csv,allowedIds,baseUrl);
   if(JSON.stringify(rows)===current){pending=null;status.status='synced';status.error=null;return;}
   const previous=new Map(applied.map(row=>[row.id,row.foto]));
   await Promise.all(rows.filter(row=>row.foto&&row.foto!==previous.get(row.id)).map(row=>loadImage(row.foto)));
   apply({rows,csv});
  }
  async function run(){
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
   status.lastChecked=new Date().toISOString();
   try{
    const url=new URL(source);url.searchParams.set('_',String(Date.now()));
    const response=await fetch(url.href,{cache:'no-store',credentials:'omit',signal:controller.signal,referrerPolicy:'no-referrer'});
    if(!response.ok)throw Error('A planilha não respondeu: '+response.status);
    const csv=await response.text();await accept(csv);
   }catch(error){status.status='error';status.error=String(error.message||error);}
   finally{clearTimeout(timer);}
   return {...status};
  }
  function refresh(){
   if(!inflight)inflight=run().finally(()=>{inflight=null});
   return inflight;
  }
  function flush(){if(pending&&!isMoving())apply(pending);}
  // Start with the last validated version, without discarding the bundled fallback.
  async function boot(){
   try{const csv=localStorage.getItem(storageKey);if(csv)await accept(csv)}catch{}
   booting=false;
   return refresh();
  }
  const timer=setInterval(()=>{if(!booting&&!document.hidden)refresh()},status.pollMs);
  const visible=()=>{if(!booting&&!document.hidden&&(!status.lastChecked||Date.now()-Date.parse(status.lastChecked)>5000))refresh()};
  document.addEventListener('visibilitychange',visible);addEventListener('focus',visible);
  const ready=boot();
  return Object.freeze({refresh:async()=>{await ready;return refresh()},flush,stop(){clearInterval(timer);document.removeEventListener('visibilitychange',visible);removeEventListener('focus',visible)}});
 }
 root.MagnoliaSheetSync=Object.freeze({start});
})(window);
