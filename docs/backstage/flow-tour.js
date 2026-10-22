import {phone,loupe,laptop,sieve,branches,relay} from './vendor/hairline-0.5.1.js';
import {createTour} from './flow-controller.mjs?v=1a3e218fecce161f';
const root=document.querySelector('.flow-tour');
if(root){
 const fallback=root.querySelector('.workflow-static'),panel=root.querySelector('.flow-interactive'),steps=[...fallback.children].map(li=>({title:li.querySelector('h3').textContent,text:li.querySelector('p').textContent}));
 const factories=[phone,loupe,laptop,sieve,branches,relay],list=root.querySelector('.flow-steps'),figureBox=root.querySelector('.flow-figure'),detail=root.querySelector('.flow-description'),title=root.querySelector('.flow-title'),play=root.querySelector('[data-flow-play]'),reset=root.querySelector('[data-flow-reset]'),source=root.querySelector('.flow-art-source');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let figure=null,drawn=-1,inView=false,rendered=-1,autoStarted=false;
 const buttons=steps.map((step,index)=>{const li=document.createElement('li'),button=document.createElement('button'),number=document.createElement('span');button.type='button';button.setAttribute('aria-controls','flow-stage');number.textContent=String(index+1).padStart(2,'0');number.setAttribute('aria-hidden','true');button.append(number,document.createTextNode(step.title));li.append(button);list.append(li);return button;});
 function destroyFigure(){figure?.destroy();figure=null;drawn=-1;}
 function render(state){
  root.dataset.step=String(state.index);root.dataset.playing=String(state.playing);
  root.style.setProperty('--flow-progress',String(state.index/(steps.length-1)));
  buttons.forEach((button,i)=>{if(i===state.index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');button.dataset.passed=String(i<state.index);});
  if(rendered!==state.index){title.textContent=steps[state.index].title;detail.textContent=steps[state.index].text;rendered=state.index;}
  play.textContent=state.playing?'Pausar':state.completed?'Repetir animação':'Iniciar animação';play.setAttribute('aria-pressed',String(state.playing));
  source.dataset.active=String(state.index===2);
  if(state.reduced){destroyFigure();panel.hidden=true;fallback.hidden=false;return;}
  if(drawn!==state.index){destroyFigure();figure=factories[state.index](figureBox,{theme:'light',intensity:.25,play:false,label:steps[state.index].title});drawn=state.index;}
  figure.update({play:state.playing});panel.hidden=false;fallback.hidden=true;
 }
 const tour=createTour({onChange:render});
 buttons.forEach((button,i)=>button.addEventListener('click',()=>tour.select(i)));
 play.addEventListener('click',()=>tour.state.playing?tour.pause():tour.play());reset.addEventListener('click',()=>tour.reset());
 const syncVisibility=()=>{
  const visible=inView&&!document.hidden;
  tour.setVisible(visible);
  if(visible&&!reduced.matches&&!autoStarted){autoStarted=true;tour.play();}
 };
 const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;syncVisibility();},{threshold:0});observer.observe(panel);
 document.addEventListener('visibilitychange',syncVisibility);
 reduced.addEventListener('change',()=>tour.setReduced(reduced.matches));
 window.addEventListener('pagehide',()=>{tour.pause();destroyFigure();});
 window.addEventListener('pageshow',()=>{render(tour.state);syncVisibility();});
 tour.setReduced(reduced.matches);syncVisibility();
 root.dataset.ready='true';
}
