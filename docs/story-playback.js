(function(root){
'use strict';
const STEP_MS=24,READING_DELAY_MS=3000;
function create({now=()=>performance.now(),setTimer=setTimeout,clearTimer=clearTimeout,reduced=()=>false,hidden=()=>false,canAuto=()=>true,onState=()=>{}}={}){
 let job=null,timer=null,paused=false,last=0;
 const state=()=>({typing:Boolean(job&&job.index<job.characters.length),waiting:Boolean(job&&job.callback),paused});
 const notify=()=>onState(state());
 function stopTimer(){if(timer!==null)clearTimer(timer);timer=null;}
 function schedule(){
  if(timer!==null||paused||hidden()||!job||(!state().typing&&!job.callback))return;
  last=now();timer=setTimer(tick,STEP_MS);
 }
 function reveal(){
  if(!job)return;
  while(job.index<job.characters.length){const char=job.characters[job.index++];char.style.opacity='1';char.hidden=false;}
 }
 function tick(){
  timer=null;if(!job||paused||hidden())return;
  const elapsed=now()-last;
  if(state().typing){
   const char=job.characters[job.index++];char.style.opacity='1';char.hidden=false;
   if(!state().typing){job.remaining=READING_DELAY_MS;notify();}
  }else if(job.callback){
   job.remaining=canAuto()?job.remaining-elapsed:READING_DELAY_MS;
   if(job.remaining<=0){const callback=job.callback;job.callback=null;notify();callback();return;}
  }
  schedule();
 }
 function cancel(){stopTimer();reveal();job=null;notify();}
 function start(characters,callback=null){
  cancel();job={characters,index:0,remaining:READING_DELAY_MS,callback};
  if(reduced()||paused)reveal();else characters.forEach(char=>{char.style.opacity='0';char.hidden=true;});
  notify();schedule();
 }
 function finish(){stopTimer();reveal();if(job)job.remaining=READING_DELAY_MS;notify();schedule();}
 function setPaused(value){paused=Boolean(value);finish();}
 function preferenceChanged(){if(reduced())finish();}
 function visibilityChanged(){stopTimer();if(job&&!state().typing)job.remaining=READING_DELAY_MS;schedule();}
 return Object.freeze({start,cancel,finish,setPaused,preferenceChanged,visibilityChanged,get state(){return state();}});
}
const api=Object.freeze({create,STEP_MS,READING_DELAY_MS});
if(typeof module==='object'&&module.exports)module.exports=api;else root.MagnoliaPlayback=api;
})(typeof globalThis!=='undefined'?globalThis:this);
