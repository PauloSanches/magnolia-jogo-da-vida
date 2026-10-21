export function createTour({count=6,delay=5000,clock=globalThis,onChange=()=>{}}={}) {
 let index=0,playing=false,completed=false,reduced=false,visible=true,dead=false,timer=null,generation=0;
 const snapshot=()=>Object.freeze({index,playing,completed,reduced,visible});
 const emit=()=>onChange(snapshot());
 const cancel=()=>{generation++;if(timer!==null)clock.clearTimeout(timer);timer=null;};
 function schedule(){cancel();const ticket=generation;timer=clock.setTimeout(()=>{if(ticket!==generation||!playing||dead)return;timer=null;if(index===count-1){playing=false;completed=true;emit();return;}index++;emit();schedule();},delay);}
 function pause(){cancel();playing=false;emit();}
 return {get state(){return snapshot();},play(){if(dead||reduced||!visible||playing)return;if(index===count-1||completed)index=0;completed=false;playing=true;emit();schedule();},pause,select(value){if(!Number.isInteger(value)||value<0||value>=count)throw new RangeError('Invalid workflow step');cancel();index=value;playing=false;completed=false;emit();},reset(){this.select(0);},setReduced(value){reduced=!!value;if(reduced)pause();else emit();},setVisible(value){visible=!!value;if(!visible)pause();},destroy(){cancel();playing=false;dead=true;}};
}
