(()=>{'use strict';const DATA=[{"title": "Jogo da Vida versão Magnólia", "text": "Hoje eu faço 58 anos. E resolveram transformar minha vida num jogo! Quero ver quem conhece essa história tão bem quanto eu. Vem comigo: dessa vez, sou eu quem vai contar.", "detail": "", "quiet": false, "x": 180, "y": 4650, "avatar": "assets/mag.webp", "id": "casa-01", "photo": ""}, {"title": "Tudo começou em Alagoas.", "text": "Nasci em Alagoas, filha de Olívia e Agnaldo. Cresci entre Porto da Rua, Tatuamunha e Porto de Pedras.", "detail": "", "quiet": false, "x": 300, "y": 4300, "avatar": "assets/littlemag.webp", "id": "casa-02", "photo": "https://paulosanches.github.io/magnolia-jogo-da-vida/assets/alagoas.webp"}, {"title": "A terceira da turma", "text": "Somos cinco irmãos: Rico, Monquinha, eu, Najila e Chuchu. Fui a terceira a chegar. Bem no meio da turma, com dois mais velhos e dois mais novos. Ficou fácil me achar na fila!", "detail": "", "quiet": false, "x": 180, "y": 3950, "avatar": "assets/character-casa-03-9b56bfec5278.png", "id": "casa-03", "photo": ""}, {"title": "Recife, lá fui eu!", "text": "Ainda adolescente, me mudei com a família para Recife, em busca de uma vida melhor. Saí de Alagoas e fui conhecer outro lugar para chamar de casa. Recife ia ganhar bastante espaço na minha história.", "detail": "", "quiet": false, "x": 300, "y": 3600, "avatar": "assets/magzinha.webp", "id": "casa-04", "photo": "https://paulosanches.github.io/magnolia-jogo-da-vida/assets/recife.webp"}, {"title": "Meu paquera da escola", "text": "Em Recife, teve escola e também teve um paquera que entrou na história. Sim, meninas, a mãe de vocês também teve seus namoricos! Não nasci sabendo dar conselho, não.", "detail": "", "quiet": false, "x": 180, "y": 3250, "avatar": "assets/character-casa-05-0bae1a184ab4.png", "id": "casa-05", "photo": ""}, {"title": "Meu casamento aos 17", "text": "Eu me casei aos 17 anos. Essa foi uma das primeiras grandes mudanças da minha vida. E ainda vinha tanta coisa pela frente!", "detail": "", "quiet": false, "x": 300, "y": 2900, "avatar": "assets/character-casa-06-0587f4c90056.png", "id": "casa-06", "photo": ""}, {"title": "Daniela me fez mãe", "text": "Primeiro veio Daniela. Foi com você, minha filha, que eu virei mãe. Até aqui, eu estava contando como filha e irmã. A partir da sua chegada, minha história passou a incluir a nossa.", "detail": "", "quiet": false, "x": 180, "y": 2550, "avatar": "assets/character-casa-07-8bbba10b678a.png", "id": "casa-07", "photo": ""}, {"title": "Três anos depois, Dedey", "text": "Três anos depois de Daniela, chegou Dedey. Minha segunda menina! Dedey, você tem uma casa só sua aqui, porque essa chegada merece ser contada direitinho. Agora eu era mãe de duas.", "detail": "", "quiet": false, "x": 300, "y": 2200, "avatar": "assets/character-casa-08-fa6251291c86.png", "id": "casa-08", "photo": "https://paulosanches.github.io/magnolia-jogo-da-vida/assets/dedey-baby.webp"}, {"title": "Com a avó e o primo", "text": "Daniela e Dedey ficavam com minha mãe, Olívia, junto do primo Leo. Minhas meninas cresceram com a avó e o primo fazendo parte do dia a dia. Essa lembrança também merece um lugar aqui.", "detail": "", "quiet": false, "x": 180, "y": 1850, "avatar": "assets/mag.webp", "id": "casa-09", "photo": ""}, {"title": "Nós três no Arruda", "text": "Eu e minhas meninas fomos morar no Arruda. Daniela, Dedey e eu: nós três, em mais um endereço da nossa história. Filhas, essa parte também é de vocês.", "detail": "", "quiet": false, "x": 300, "y": 1500, "avatar": "assets/mag.webp", "id": "casa-10", "photo": ""}, {"title": "Nossa temporada no Curado", "text": "Depois, fomos para o Curado, morar com minha mãe e meu irmão Chuchu. Passamos alguns anos por lá. Quando falo do Curado, lembro dessa época em família, com as meninas crescendo perto da avó e do tio.", "detail": "", "quiet": false, "x": 180, "y": 1150, "avatar": "assets/character-casa-11-36214710664c.png", "id": "casa-11", "photo": ""}, {"title": "Em 1996, eu e Ruston", "text": "Eu trabalhava no hospital, e Ruston era o advogado de lá. Em 1996, começamos a sair. E eu, que já tinha duas filhas, também tinha um namoro pra contar. Mãe também namora, minha gente!", "detail": "", "quiet": false, "x": 300, "y": 800, "avatar": "assets/character-casa-12-b45240dfcda7.png", "id": "casa-12", "photo": ""}, {"title": "Agora vem comemorar comigo!", "text": "Cheguei aos 58 e quero aproveitar meu aniversário com vocês. Tenho carinho por tanta gente que faz parte da minha vida, e ainda tenho planos, viu? Quero rir mais, fazer o que gosto e continuar juntando histórias com a minha família. Agora vem comemorar comigo!", "detail": "", "quiet": false, "x": 180, "y": 450, "avatar": "assets/character-casa-13-a09313b62126.png", "id": "casa-13", "photo": ""}, {"quiet": false, "avatar": "assets/mag.webp", "detail": "", "x": 180, "y": 450, "id": "casa14", "title": "Teste", "text": "Nova casa de teste", "photo": ""}, {"id": "casa-netos", "avatar": "assets/character-casa-netos-b8ed9e475a6b.png", "quiet": false}],map=document.querySelector('.map'),avatar=document.getElementById('avatar'),bubble=document.querySelector('.bubble'),content=document.getElementById('memoryContent'),stage=document.querySelector('.stage'),reduce=matchMedia('(prefers-reduced-motion: reduce)');let active=0,moving=false,cardMoving=false,questionVisible=false,scale=1,left=0,baseline=0,currentMap='',currentAvatar='',moves=0,suppress=0,touch=null,wheelLocked=false,wheelTimer=0;const pawn=document.createElement('div');pawn.className='avatar-motion';avatar.before(pawn);pawn.append(avatar);
const avatarImages=new Map(),progressFill=document.querySelector('.timeline-progress-fill'),restartButton=document.getElementById('timeline-restart');
const playbackButton=document.getElementById('reading-playback-toggle');
const retainedStory=document.getElementById('retained-story'),retainedContent=document.getElementById('retained-content');
const playback=window.MagnoliaPlayback.create({
 reduced:()=>reduce.matches,hidden:()=>document.hidden,
 canAuto:()=>!isBusy()&&content.scrollTop+content.clientHeight>=content.scrollHeight-2&&!content.matches(':focus-visible')&&!window.getSelection()?.toString(),
 onState:status=>{
  playbackButton.setAttribute('aria-pressed',String(status.paused));
  playbackButton.setAttribute('aria-label',status.paused?'Retomar animação e pergunta automática':'Pausar animação e pergunta automática');
  playbackButton.title=status.paused?'Retomar':'Pausar';content.dataset.writing=String(status.typing);state();
 }
});
const graphemes=typeof Intl.Segmenter==='function'?new Intl.Segmenter('pt',{granularity:'grapheme'}):null;
function prepareAvatar(src){
 if(avatarImages.has(src))return avatarImages.get(src);
 const ready=new Promise(resolve=>{
  const image=new Image();let settled=false;
  const finish=ok=>{if(settled)return;settled=true;clearTimeout(timer);resolve(ok)};
  const timer=setTimeout(()=>finish(false),1500);
  image.src=src;image.decode().then(()=>finish(true),()=>finish(false));
 });
 avatarImages.set(src,ready);ready.then(ok=>{if(!ok)avatarImages.delete(src)});return ready;
}
const visualById=new Map(DATA.map(d=>[d.id,{...d}]));
let stops=[];
const initialRows=window.MagnoliaContent.initial;
const svg=map.querySelector('svg'),svgNS='http://www.w3.org/2000/svg';
// Remove photographs, not unrelated scenery that happens to share a parent.
svg.querySelectorAll('image').forEach(image=>{
 const parent=image.parentElement;
 if([...parent.children].every(child=>['rect','image'].includes(child.tagName)))parent.remove();else image.remove();
});
const routes=[...svg.children].filter(el=>el.tagName==='path').map(el=>el.cloneNode(true));
const sceneById=new Map([...svg.querySelectorAll('[data-scene]')].map(scene=>{
 const i=Number(scene.dataset.scene),stop=svg.querySelector(`[data-go="${i}"] circle`);
 return [DATA[i].id,{node:scene.cloneNode(true),y:Number(stop.getAttribute('cy'))}];
}));
const defaultScene=[...sceneById.values()].at(-1);
const makeSVG=(tag,attrs)=>{const el=document.createElementNS(svgNS,tag);Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,value));return el};
function renderPhotos(){
 svg.querySelectorAll('[data-live-photo]').forEach(el=>el.remove());
 DATA.forEach(d=>{
  if(!d.photo)return;
  const group=makeSVG('g',{'data-live-photo':d.id}),x=d.x===180?284:22,y=d.y-150;
  group.append(makeSVG('rect',{x:x-6,y:y-6,width:190,height:126,rx:4,fill:'#fffdf5'}),makeSVG('image',{href:d.photo,x,y,width:178,height:108,preserveAspectRatio:'xMidYMid meet'}));svg.append(group);
 });
}
function renderBoard(){
 DATA.forEach((d,i)=>{d.x=i%2===0?180:300;d.y=450+(DATA.length-1-i)*350});
 const height=DATA[0].y+600,colors=['#f7d4d4','#c5e9d7','#f9dfab','#d9e8cd'];
 svg.setAttribute('height',height);svg.setAttribute('viewBox',`0 0 480 ${height}`);map.style.height=height+'px';
 svg.replaceChildren(makeSVG('rect',{width:480,height,fill:'#dff0bd'}));
 DATA.forEach((d,i)=>svg.append(makeSVG('ellipse',{cx:i%2===0?165:315,cy:d.y-25,rx:230,ry:150,fill:colors[i%colors.length]})));
 let route=`M ${DATA[0].x} ${DATA[0].y+300} L ${DATA[0].x} ${DATA[0].y}`;
 for(let i=1;i<DATA.length;i++){const prev=DATA[i-1],d=DATA[i],mid=(prev.y+d.y)/2;route+=` C ${prev.x} ${mid} ${d.x} ${mid} ${d.x} ${d.y}`;}
 // The path ends at the final house instead of continuing past the finish.
 routes.forEach(template=>{const path=template.cloneNode(true);path.setAttribute('d',route);svg.append(path)});
 DATA.forEach((d,i)=>{
  const template=sceneById.get(d.id)||defaultScene;
  if(template){const group=makeSVG('g',{transform:`translate(0 ${d.y-template.y})`});group.append(template.node.cloneNode(true));svg.append(group);}
  const final=i===DATA.length-1,stop=makeSVG('g',{class:final?'house-stop final-stop':'house-stop','data-go':i});
  stop.append(makeSVG('circle',{cx:d.x,cy:d.y,r:final?44:34,fill:final?'#ffd34f':'#fff9de'}),makeSVG('circle',{cx:d.x,cy:d.y,r:final?32:22,fill:'#f4b5a8',class:'stop-core'}));svg.append(stop);
  if(final){
   const flag=makeSVG('g',{class:'finish-marker',transform:`translate(${d.x-160} ${d.y-110})`});
   flag.append(makeSVG('path',{d:'M0 0V110',stroke:'#284f45','stroke-width':5,'stroke-linecap':'round'}),makeSVG('rect',{x:0,y:0,width:64,height:32,rx:2,fill:'#fffdf5'}));
   for(const [x,y] of [[0,0],[32,0],[16,16],[48,16]])flag.append(makeSVG('rect',{x,y,width:16,height:16,fill:'#284f45'}));
   svg.append(flag);
  }
 });
 stops=[...svg.querySelectorAll('.house-stop')];renderPhotos();
}
function applyContentRows(rows){
 const currentId=DATA[active].id,previousIndex=active,scrollTop=content.scrollTop;
 const next=rows.map(row=>({...visualById.get(row.id),id:row.id,title:row.titulo,text:row.texto,question:row.pergunta||'',detail:'',photo:row.foto,avatar:visualById.get(row.id)?.avatar||'assets/mag.webp',quiet:false}));
 DATA.splice(0,DATA.length,...next);const kept=DATA.findIndex(d=>d.id===currentId);active=kept>=0?kept:Math.min(previousIndex,DATA.length-1);questionVisible=kept>=0&&questionVisible&&hasQuestion(active);
 renderBoard();memory();layout();content.scrollTop=scrollTop;document.title=DATA[0].title;
}
applyContentRows(initialRows);
function positionQuestion(navTop){
 // The pawn and camera stay on their story coordinates. Only place the balloon.
 const a=avatar.getBoundingClientRect(),margin=12,gap=16;
 const spaceLeft=a.left-margin-gap,spaceRight=innerWidth-a.right-margin-gap;
 const onLeft=spaceLeft>spaceRight,width=Math.min(410,Math.max(spaceLeft,spaceRight));
 bubble.dataset.side=onLeft?'left':'right';bubble.style.width=width+'px';
 bubble.style.left=(onLeft?a.left-gap-width:a.right+gap)+'px';
 const b=bubble.getBoundingClientRect(),pause=playbackButton.getBoundingClientRect(),progress=document.getElementById('timeline-progress').getBoundingClientRect();
 const upper=Math.max(24,progress.bottom+12,b.right>pause.left&&b.left<pause.right?pause.bottom+12:0);
 const padding=parseFloat(getComputedStyle(bubble).paddingTop)+parseFloat(getComputedStyle(bubble).paddingBottom);
 const story=retainedStory.getBoundingClientRect(),overlaps=b.right+12>story.left&&b.left-12<story.right;
 const bottom=Math.min(navTop-20,overlaps?story.top-16:Infinity);
 content.style.maxHeight=Math.max(24,bottom-upper-padding)+'px';
 const height=bubble.getBoundingClientRect().height,center=a.top+a.height/2;
 const top=Math.max(upper,Math.min(bottom-height,center-height/2));bubble.style.top=top+'px';
 bubble.style.setProperty('--side-tail',Math.max(20,Math.min(height-38,center-top-10))+'px');
}
function layout(){
 state();scale=Math.min(innerWidth/480,1.65);left=(innerWidth-480*scale)/2;baseline=innerHeight*.40;
 map.style.left=left+'px';const d=DATA[active],aw=avatar.offsetWidth,ah=avatar.offsetHeight;
 currentMap=`translateY(${baseline-d.y*scale}px) scale(${scale})`;map.style.transform=currentMap;
 const navTop=document.querySelector('.timeline-navigation').getBoundingClientRect().top;
 currentAvatar=`translate(${left+d.x*scale-aw/2}px,${baseline-ah}px)`;pawn.style.transform=currentAvatar;
 if(questionVisible){
  positionStory(retainedStory,retainedContent,navTop);
  positionQuestion(navTop);
 }else positionStory(bubble,content,navTop,active===DATA.length-1);
}
function positionStory(panel,reader,navTop,final=false){
 delete panel.dataset.side;
 panel.style.removeProperty('left');panel.style.removeProperty('width');panel.style.removeProperty('--side-tail');
 const x=left+DATA[active].x*scale,half=panel.getBoundingClientRect().width/2;
 panel.style.left=Math.max(12+half,Math.min(innerWidth-12-half,x))+'px';
 const top=baseline+(final?20:35),style=getComputedStyle(panel),padding=parseFloat(style.paddingTop)+parseFloat(style.paddingBottom);
 panel.style.top=top+'px';reader.style.maxHeight=Math.max(24,navTop-top-20-padding)+'px';
 const bounds=panel.getBoundingClientRect();panel.style.setProperty('--tail',Math.max(20,Math.min(bounds.width-40,x-bounds.left-12))+'px');
}
function isBusy(){return moving||cardMoving;}
function hasQuestion(index=active){return Boolean(DATA[index]?.question?.trim());}
function finished(){return active===DATA.length-1&&(!hasQuestion()||questionVisible);}
function progressAt(index=active,question=questionVisible){
 const total=DATA.reduce((n,d)=>n+1+(d.question?.trim()?1:0),0);
 const before=DATA.slice(0,index).reduce((n,d)=>n+1+(d.question?.trim()?1:0),0);
 return total===1?1:(before+(question&&hasQuestion(index)?1:0))/(total-1);
}
function state(){
 const busy=isBusy(),end=finished();
 restartButton.hidden=!end;restartButton.disabled=busy||(DATA.length===1&&!questionVisible);
 avatar.setAttribute('aria-disabled',String(busy||end));
 const prev=document.getElementById('timeline-prev'),next=document.getElementById('timeline-next');
 prev.disabled=busy||(active===0&&!questionVisible);next.disabled=busy||end;
 next.setAttribute('aria-label',playback.state.typing?'Mostrar texto completo':hasQuestion()&&!questionVisible?'Ver pergunta':'Avançar para a próxima memória');
 prev.setAttribute('aria-label',questionVisible?'Voltar à história':'Voltar à memória anterior');
 window.__boardState={active,moving:busy,waiting:!busy,typing:playback.state.typing,automatic:!playback.state.paused,phase:questionVisible?'question':'story',renderer:'svg',moves,idleLoops:0};
}
function updateProgress(){
 const el=document.getElementById('timeline-progress'),fraction=progressAt();
 el.hidden=false;el.setAttribute('aria-valuenow',String(Math.round(fraction*100)));
 el.setAttribute('aria-valuetext',`Casa ${active+1} de ${DATA.length}. ${finished()?'Concluído':questionVisible?'Pergunta':'História'}.`);
 progressFill.style.transform=`scaleX(${fraction})`;
}
function renderStory(target,d){
 if(d.title!==''){const title=document.createElement('h1');title.textContent=d.title;target.append(title);}
 const text=document.createElement('p');text.textContent=d.text;target.append(text);
 if(d.detail){const detail=document.createElement('p');detail.className='family-detail';detail.textContent=d.detail;target.append(detail);}
}
function memory(avatarReady=true){
 updateProgress();const d=DATA[active];if(avatarReady)avatar.src=d.avatar;
 avatar.alt='Personagem ilustrada de Magnolia';avatar.setAttribute('aria-label',finished()?'Última memória':hasQuestion()&&!questionVisible?'Ver pergunta':'Mover para a próxima memória');
 bubble.classList.toggle('quiet',d.quiet);bubble.classList.toggle('question-card',questionVisible);
 bubble.classList.toggle('finale',active===DATA.length-1&&!questionVisible);
 content.setAttribute('aria-label',questionVisible?'Pergunta desta memória':'Texto desta memória');content.replaceChildren();
 retainedStory.hidden=!questionVisible;retainedStory.classList.toggle('quiet',d.quiet);retainedContent.replaceChildren();
 if(questionVisible){
  renderStory(retainedContent,d);
  const text=document.createElement('p');text.textContent=d.question;text.className='question-text';content.append(text);
 }else renderStory(content,d);
 content.scrollTop=0;stops.forEach((el,i)=>{el.classList.toggle('active',i===active);el.classList.toggle('next',i===active+1&&(!hasQuestion()||questionVisible));});
 // Keep full text accessible and reserve its layout separately from the visible writing.
 const characters=[];
 content.querySelectorAll('h1,p').forEach(element=>{
  const text=element.textContent,parts=graphemes?Array.from(graphemes.segment(text),part=>part.segment):Array.from(text);
  const accessible=document.createElement('span');accessible.className='sr-only';accessible.textContent=text;
  const reserved=document.createElement('span');reserved.className='writing-layout';reserved.dataset.text=text;reserved.setAttribute('aria-hidden','true');
  const visual=document.createElement('span');visual.className='writing-visual';visual.setAttribute('aria-hidden','true');
  const ink=document.createElement('span');ink.className='writing-ink';visual.append(ink);
  for(const part of parts){const span=document.createElement('span');span.className='writing-char';span.dataset.character=part;ink.append(span);characters.push(span);}
  element.replaceChildren(accessible,reserved,visual);
 });
 const story=active;
 playback.start(characters,!questionVisible&&hasQuestion()?()=>{if(active===story&&!questionVisible&&!isBusy())changeCard(true);}:null);
}
async function changeCard(show){
 if(isBusy()||show===questionVisible||(show&&!hasQuestion()))return;
 playback.cancel();cardMoving=true;const from=progressFill.style.transform;const animations=[];state();
 try{
  const scrollTop=(show?content:retainedContent).scrollTop;
  questionVisible=show;memory();layout();(show?retainedContent:content).scrollTop=scrollTop;
  if(!reduce.matches&&bubble.animate){
   const timing={duration:220,easing:'ease-out',fill:'both'};
   animations.push(bubble.animate([{opacity:0},{opacity:1}],timing));
   animations.push(progressFill.animate([{transform:from},{transform:progressFill.style.transform}],timing));
   await Promise.all(animations.map(a=>a.finished.catch(()=>{})));
  }else await new Promise(resolve=>requestAnimationFrame(resolve));
 }finally{animations.forEach(a=>a.cancel());cardMoving=false;state();}
}
function advance(){if(isBusy())return;if(playback.state.typing){playback.finish();return;}if(hasQuestion()&&!questionVisible)return changeCard(true);return go(active+1);}
function retreat(){if(isBusy())return;if(questionVisible)return changeCard(false);return go(active-1,{showQuestion:true});}
async function go(n,{restart=false,showQuestion=false}={}){
 if(isBusy())return;n=Math.max(0,Math.min(DATA.length-1,n));if(n===active)return;
 playback.cancel();moving=true;avatar.setAttribute('aria-disabled','true');document.body.classList.add('moving');state();
 const d=DATA[n],changed=avatar.getAttribute('src')!==d.avatar,animations=[],restarting=restart&&active===DATA.length-1&&n===0;
 let ghost=null,avatarReady=true,shrunk=false;
 try{
  if(changed&&!reduce.matches)avatarReady=await prepareAvatar(d.avatar);
  if(restarting&&!reduce.matches&&map.animate&&avatar.animate){
   const sink=avatar.animate([
    {transform:'scale(1)',transformOrigin:'50% 100%'},
    {transform:'scale(0)',transformOrigin:'50% 100%'}
   ],{duration:300,easing:'cubic-bezier(.4,0,.8,1)',fill:'forwards'});
   animations.push(sink);await sink.finished.catch(()=>{});shrunk=true;
  }
  const aw=avatar.offsetWidth,ah=avatar.offsetHeight;
  const finalMap=`translateY(${baseline-d.y*scale}px) scale(${scale})`,finalAvatar=`translate(${left+d.x*scale-aw/2}px,${baseline-ah}px)`;
  const duration=reduce.matches?0:restarting?Math.min(2800,1200+Math.abs(n-active)*80):changed&&avatarReady?760:620;
  if(duration&&map.animate){
   const travel={duration,easing:restarting?'cubic-bezier(.65,0,.35,1)':'cubic-bezier(.22,1,.36,1)',fill:'both'};
   animations.push(map.animate([{transform:currentMap},{transform:finalMap}],travel));
   animations.push(pawn.animate([{transform:currentAvatar},{transform:finalAvatar}],travel));
   animations.push(progressFill.animate([{transform:progressFill.style.transform||'scaleX(0)'},{transform:`scaleX(${progressAt(n,showQuestion)})`}],travel));
   if(changed&&avatarReady&&!restarting){
    // Keep the old decoded image visible while the new one turns into view.
    ghost=avatar.cloneNode(false);ghost.removeAttribute('id');ghost.removeAttribute('role');ghost.removeAttribute('tabindex');ghost.removeAttribute('aria-label');ghost.setAttribute('aria-hidden','true');ghost.alt='';ghost.classList.add('avatar-ghost');pawn.append(ghost);
    avatar.src=d.avatar;
    const direction=n>active||active===DATA.length-1&&n===0?1:-1;
    const turn=(angle,size=1,lift=0)=>`perspective(650px) translateY(${lift}px) rotateY(${angle}deg) scale(${size})`;
    const spin={duration,easing:'ease-in-out',fill:'both'};
    animations.push(ghost.animate([
     {transform:turn(0),opacity:1,offset:0},
     {transform:turn(direction*85,.92,-7),opacity:0,offset:.48},
     {transform:turn(direction*85,.92,-7),opacity:0,offset:1}
    ],spin));
    animations.push(avatar.animate([
     {transform:turn(-direction*85,.92,-7),opacity:0,offset:0},
     {transform:turn(-direction*85,.92,-7),opacity:0,offset:.36},
     {transform:turn(direction*4,1.025,-2),opacity:1,offset:.83},
     {transform:turn(0),opacity:1,offset:1}
    ],spin));
   }
   await Promise.all(animations.map(a=>a.finished.catch(()=>{})));
  }
  if(restarting&&avatarReady)avatar.src=d.avatar;
  if(shrunk&&!reduce.matches){
   const rise=avatar.animate([
    {transform:'scale(0)',transformOrigin:'50% 100%'},
    {transform:'scale(1)',transformOrigin:'50% 100%'}
   ],{duration:360,easing:'cubic-bezier(.2,.8,.3,1)',fill:'both'});
   animations.push(rise);await rise.finished.catch(()=>{});
  }
 }catch{
  // Unsupported or interrupted effects must never lock story navigation.
 }finally{
  animations.forEach(a=>a.cancel());if(ghost)ghost.remove();
  active=n;questionVisible=showQuestion&&hasQuestion(n);moves++;moving=false;avatar.setAttribute('aria-disabled','false');document.body.classList.remove('moving');memory(avatarReady);layout();
 }
}

reduce.addEventListener('change',()=>{if(reduce.matches){map.getAnimations().forEach(a=>a.finish());pawn.getAnimations({subtree:true}).forEach(a=>a.finish());progressFill.getAnimations().forEach(a=>a.finish());bubble.getAnimations().forEach(a=>a.finish());}});
playbackButton.addEventListener('click',()=>playback.setPaused(!playback.state.paused));
document.addEventListener('visibilitychange',()=>playback.visibilityChanged());
reduce.addEventListener('change',()=>playback.preferenceChanged());
content.addEventListener('click',()=>{if(playback.state.typing&&!window.getSelection()?.toString())playback.finish();});
content.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&playback.state.typing){event.preventDefault();playback.finish();}});
document.getElementById('timeline-prev').addEventListener('click',retreat);
document.getElementById('timeline-next').addEventListener('click',advance);
restartButton.addEventListener('click',()=>{if(isBusy()||!finished())return;return DATA.length===1?changeCard(false):go(0,{restart:true});});
avatar.addEventListener('click',e=>{e.stopPropagation();if(performance.now()>suppress)advance();});
avatar.addEventListener('keydown',e=>{if(!e.repeat&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.stopPropagation();advance();}});
stage.addEventListener('click',e=>{if(isBusy()||performance.now()<suppress||e.target===avatar)return;const hit=e.target.closest('[data-go]');if(hit&&Number(hit.dataset.go)<active)retreat();else advance();});
stage.addEventListener('touchstart',e=>{touch=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null},{passive:true});
stage.addEventListener('touchend',e=>{if(!touch||!e.changedTouches.length)return;const t=e.changedTouches[0],dx=t.clientX-touch.x,dy=t.clientY-touch.y;touch=null;if(Math.max(Math.abs(dx),Math.abs(dy))<48)return;suppress=performance.now()+450;if(isBusy())return;(Math.abs(dy)>=Math.abs(dx)?dy<0:dx<0)?advance():retreat();},{passive:true});
stage.addEventListener('touchcancel',()=>{touch=null},{passive:true});
stage.addEventListener('wheel',e=>{e.preventDefault();clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>{wheelLocked=false},900);if(isBusy()||wheelLocked||Math.abs(e.deltaY)<25)return;wheelLocked=true;e.deltaY>0?advance():retreat();},{passive:false});
addEventListener('keydown',e=>{if(e.repeat||isBusy()||e.target instanceof Element&&e.target.closest('.bubble,.retained-story'))return;if(['ArrowRight','ArrowUp'].includes(e.key)){e.preventDefault();advance();}if(['ArrowLeft','ArrowDown'].includes(e.key)){e.preventDefault();retreat();}});
addEventListener('resize',()=>{if(!isBusy())layout();});memory();layout();
window.__draft={get chapters(){return DATA.length},get stops(){return stops.length},go,update:layout};

})();