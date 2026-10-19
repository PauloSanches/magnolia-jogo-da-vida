/* Optional background music; browser permission and explicit mute are respected. */
(()=>{
 'use strict';
 const audio=document.getElementById('background-music'),button=document.getElementById('sound-toggle'),label=button.querySelector('span');
 const key='magnolia-music-preference';
 let request=0,pending=false,failed=false,wanted=true;
 try{wanted=localStorage.getItem(key)!=='off'}catch{}
 audio.volume=0.35;
 function save(value){try{localStorage.setItem(key,value)}catch{}}
 function render(){
  const playing=!audio.paused&&!audio.ended&&!audio.error;
  button.dataset.state=pending?'loading':playing?'on':failed?'error':'off';
  label.textContent=pending?'Cancelar som':playing?'Desligar som':failed?'Tentar som':'Ativar som';
  button.setAttribute('aria-label',label.textContent);
  button.setAttribute('aria-pressed',String(playing));
 }
 function stop(){
  wanted=false;request++;pending=false;failed=false;audio.pause();save('off');render();
 }
 async function start(user=false){
  const id=++request;wanted=true;pending=true;failed=false;render();
  const timeout=setTimeout(()=>{
   if(id!==request)return;
   request++;pending=false;failed=true;wanted=false;audio.pause();render();
  },10000);
  try{
   if(audio.error)audio.load();
   await audio.play();
   if(id!==request||!wanted){if(!wanted)audio.pause();return;}
   if(user)save('on');
  }catch(error){
   if(id===request)failed=error.name!=='NotAllowedError'&&error.name!=='AbortError';
  }finally{
   clearTimeout(timeout);
   if(id===request){pending=false;render();}
  }
 }
 button.addEventListener('click',()=>{if(pending||!audio.paused)stop();else void start(true)});
 audio.addEventListener('playing',render);
 audio.addEventListener('pause',render);
 audio.addEventListener('ended',render);
 audio.addEventListener('error',()=>{failed=true;render()});
 render();
 if(wanted)void start();
})();
