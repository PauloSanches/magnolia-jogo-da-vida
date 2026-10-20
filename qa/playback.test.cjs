'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {create}=require('../docs/story-playback.js');
function setup({reduced=false}={}){
 let time=0,next=0,hidden=false,readable=true;const timers=new Map();
 const p=create({now:()=>time,setTimer:(f,ms)=>{timers.set(++next,{at:time+ms,f});return next;},clearTimer:id=>timers.delete(id),reduced:()=>reduced,hidden:()=>hidden,canAuto:()=>readable});
 const tick=ms=>{const end=time+ms;for(;;){const first=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!first||first[1].at>end)break;time=first[1].at;timers.delete(first[0]);first[1].f();}time=end;};
 const chars=n=>Array.from({length:n},()=>({style:{}}));
 return {p,tick,chars,timers,setHidden:v=>{hidden=v;p.visibilityChanged();},setReduced:v=>{reduced=v;p.preferenceChanged();},setReadable:v=>{readable=v;}};
}
test('reveals characters progressively and opens a question only after a full reading delay',()=>{
 const {p,tick,chars}=setup();const c=chars(4);let calls=0;p.start(c,()=>calls++);
 assert(p.state.typing);assert(c.every(x=>x.style.opacity==='0'));
 tick(48);assert(c.some(x=>x.style.opacity==='1')&&c.some(x=>x.style.opacity==='0'));
 tick(48);assert(c.every(x=>x.style.opacity==='1'));assert(!p.state.typing);
 tick(2952);assert.equal(calls,0);tick(72);assert.equal(calls,1);tick(10000);assert.equal(calls,1);
});
test('cancellation and replacement discard stale question callbacks',()=>{
 const {p,tick,chars}=setup();let old=0,fresh=0;p.start(chars(2),()=>old++);tick(300);p.cancel();tick(4000);assert.equal(old,0);
 p.start(chars(3),()=>old++);tick(24);p.start(chars(1),()=>fresh++);tick(3100);assert.equal(old,0);assert.equal(fresh,1);
});
test('pause reveals complete text, prevents automatic changes, and resumes with a fresh reading delay',()=>{
 const {p,tick,chars}=setup();const c=chars(10);let calls=0;p.start(c,()=>calls++);tick(48);p.setPaused(true);
 assert(c.every(x=>x.style.opacity==='1'));tick(5000);assert.equal(calls,0);
 p.setPaused(false);tick(2952);assert.equal(calls,0);tick(72);assert.equal(calls,1);
});
test('reduced motion shows complete text while preserving the automatic question delay',()=>{
 const {p,tick,chars}=setup({reduced:true});const c=chars(20);let calls=0;p.start(c,()=>calls++);assert(c.every(x=>x.style.opacity==='1'));assert(!p.state.typing);tick(2952);assert.equal(calls,0);tick(72);assert.equal(calls,1);
});
test('live reduced motion finishes typing without skipping the reading delay',()=>{
 const s=setup();let calls=0;s.p.start(s.chars(100),()=>calls++);s.tick(48);s.setReduced(true);assert(!s.p.state.typing);s.tick(2952);assert.equal(calls,0);s.tick(72);assert.equal(calls,1);
});
test('hidden pages suspend writing and resume without consuming background time',()=>{
 const s=setup();let calls=0;const c=s.chars(4);s.p.start(c,()=>calls++);s.tick(24);s.setHidden(true);const before=c.map(x=>x.style.opacity);s.tick(10000);assert.deepEqual(c.map(x=>x.style.opacity),before);assert.equal(calls,0);s.setHidden(false);s.tick(72);assert(!s.p.state.typing);s.tick(3024);assert.equal(calls,1);
});
test('a story that is still being read gets a fresh delay instead of disappearing',()=>{
 const s=setup({reduced:true});let calls=0;s.p.start(s.chars(10),()=>calls++);s.tick(2000);s.setReadable(false);s.tick(4000);assert.equal(calls,0);s.setReadable(true);s.tick(2952);assert.equal(calls,0);s.tick(72);assert.equal(calls,1);
});
test('opening, question and final reflection never schedule a new house or a phantom question',()=>{
 const s=setup();s.p.start(s.chars(10));s.tick(10000);assert(!s.p.state.typing);assert(!s.p.state.waiting);assert.equal(s.timers.size,0);
});
