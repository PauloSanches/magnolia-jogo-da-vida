(()=>{'use strict';const DATA=[{"title": "Jogo da Vida versão Magnólia", "text": "Hoje eu faço 58 anos. E resolveram transformar minha vida num jogo! Quero ver quem conhece essa história tão bem quanto eu. Vem comigo: dessa vez, sou eu quem vai contar.", "detail": "", "quiet": false, "x": 180, "y": 4650, "avatar": "assets/mag.webp", "id": "casa-01", "photo": ""}, {"title": "Tudo começou em Alagoas.", "text": "Nasci em Alagoas, filha de Olívia e Agnaldo. Cresci entre Porto da Rua, Tatuamunha e Porto de Pedras.", "detail": "", "quiet": false, "x": 300, "y": 4300, "avatar": "assets/littlemag.webp", "id": "casa-02", "photo": "https://paulosanches.github.io/magnolia-jogo-da-vida/assets/alagoas.webp"}, {"title": "A terceira da turma", "text": "Somos cinco irmãos: Rico, Monquinha, eu, Najila e Chuchu. Fui a terceira a chegar. Bem no meio da turma, com dois mais velhos e dois mais novos. Ficou fácil me achar na fila!", "detail": "", "quiet": false, "x": 180, "y": 3950, "avatar": "assets/littlemag.webp", "id": "casa-03", "photo": "https://paulosanches.github.io/magnolia-jogo-da-vida/assets/irmaos-placeholder.jpg"}, {"title": "Recife, lá fui eu!", "text": "Ainda adolescente, me mudei com a família para Recife, em busca de uma vida melhor. Saí de Alagoas e fui conhecer outro lugar para chamar de casa. Recife ia ganhar bastante espaço na minha história.", "detail": "", "quiet": false, "x": 300, "y": 3600, "avatar": "assets/magzinha.webp", "id": "casa-04", "photo": "https://paulosanches.github.io/magnolia-jogo-da-vida/assets/recife.webp"}, {"title": "Meu paquera da escola", "text": "Em Recife, teve escola e também teve um paquera que entrou na história. Sim, meninas, a mãe de vocês também teve seus namoricos! Não nasci sabendo dar conselho, não.", "detail": "", "quiet": false, "x": 180, "y": 3250, "avatar": "assets/character-casa-05-0bae1a184ab4.png", "id": "casa-05", "photo": ""}, {"title": "Meu casamento aos 17", "text": "Eu me casei aos 17 anos. Essa foi uma das primeiras grandes mudanças da minha vida. E ainda vinha tanta coisa pela frente!", "detail": "", "quiet": false, "x": 300, "y": 2900, "avatar": "assets/character-casa-06-0587f4c90056.png", "id": "casa-06", "photo": ""}, {"title": "Daniela me fez mãe", "text": "Primeiro veio Daniela. Foi com você, minha filha, que eu virei mãe. Até aqui, eu estava contando como filha e irmã. A partir da sua chegada, minha história passou a incluir a nossa.", "detail": "", "quiet": false, "x": 180, "y": 2550, "avatar": "assets/character-casa-07-8bbba10b678a.png", "id": "casa-07", "photo": ""}, {"title": "Três anos depois, Dedey", "text": "Três anos depois de Daniela, chegou Dedey. Minha segunda menina! Dedey, você tem uma casa só sua aqui, porque essa chegada merece ser contada direitinho. Agora eu era mãe de duas.", "detail": "", "quiet": false, "x": 300, "y": 2200, "avatar": "assets/character-casa-08-72daeb755f9f.png", "id": "casa-08", "photo": "https://paulosanches.github.io/magnolia-jogo-da-vida/assets/dedey-baby.webp"}, {"title": "Com a avó e o primo", "text": "Daniela e Dedey ficavam com minha mãe, Olívia, junto do primo Leo. Minhas meninas cresceram com a avó e o primo fazendo parte do dia a dia. Essa lembrança também merece um lugar aqui.", "detail": "", "quiet": false, "x": 180, "y": 1850, "avatar": "assets/mag.webp", "id": "casa-09", "photo": ""}, {"title": "Nós três no Arruda", "text": "Eu e minhas meninas fomos morar no Arruda. Daniela, Dedey e eu: nós três, em mais um endereço da nossa história. Filhas, essa parte também é de vocês.", "detail": "", "quiet": false, "x": 300, "y": 1500, "avatar": "assets/mag.webp", "id": "casa-10", "photo": ""}, {"title": "Nossa temporada no Curado", "text": "Depois, fomos para o Curado, morar com minha mãe e meu irmão Chuchu. Passamos alguns anos por lá. Quando falo do Curado, lembro dessa época em família, com as meninas crescendo perto da avó e do tio.", "detail": "", "quiet": false, "x": 180, "y": 1150, "avatar": "assets/mag.webp", "id": "casa-11", "photo": ""}, {"title": "Em 1996, eu e Ruston", "text": "Eu trabalhava no hospital, e Ruston era o advogado de lá. Em 1996, começamos a sair. E eu, que já tinha duas filhas, também tinha um namoro pra contar. Mãe também namora, minha gente!", "detail": "", "quiet": false, "x": 300, "y": 800, "avatar": "assets/mag.webp", "id": "casa-12", "photo": ""}, {"title": "Agora vem comemorar comigo!", "text": "Cheguei aos 58 e quero aproveitar meu aniversário com vocês. Tenho carinho por tanta gente que faz parte da minha vida, e ainda tenho planos, viu? Quero rir mais, fazer o que gosto e continuar juntando histórias com a minha família. Agora vem comemorar comigo!", "detail": "", "quiet": false, "x": 180, "y": 450, "avatar": "assets/mag.webp", "id": "casa-13", "photo": ""}, {"quiet": false, "avatar": "assets/mag.webp", "detail": "", "x": 180, "y": 450, "id": "casa14", "title": "Teste", "text": "Nova casa de teste", "photo": ""}],map=document.querySelector('.map'),avatar=document.getElementById('avatar'),bubble=document.querySelector('.bubble'),content=document.getElementById('memoryContent'),stage=document.querySelector('.stage'),reduce=matchMedia('(prefers-reduced-motion: reduce)');let active=0,moving=false,scale=1,left=0,baseline=0,currentMap='',currentAvatar='',moves=0,suppress=0,touch=null,wheelLocked=false,wheelTimer=0;const pawn=document.createElement('div');pawn.className='avatar-motion';avatar.before(pawn);pawn.append(avatar);
const avatarImages=new Map(),progressFill=document.querySelector('.timeline-progress-fill'),restartButton=document.getElementById('timeline-restart');
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
let contentSync=null,stops=[];
const initialRows=DATA.map((d,i)=>({id:d.id,ordem:i+1,titulo:d.title,texto:d.text,foto:d.photo}));
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
 route+=` L ${DATA.at(-1).x} 120`;
 routes.forEach(template=>{const path=template.cloneNode(true);path.setAttribute('d',route);svg.append(path)});
 DATA.forEach((d,i)=>{
  const template=sceneById.get(d.id)||defaultScene;
  if(template){const group=makeSVG('g',{transform:`translate(0 ${d.y-template.y})`});group.append(template.node.cloneNode(true));svg.append(group);}
  const stop=makeSVG('g',{class:'house-stop','data-go':i});
  stop.append(makeSVG('circle',{cx:d.x,cy:d.y,r:34,fill:'#fff9de'}),makeSVG('circle',{cx:d.x,cy:d.y,r:22,fill:'#f4b5a8',class:'stop-core'}));svg.append(stop);
 });
 stops=[...svg.querySelectorAll('.house-stop')];renderPhotos();
}
function applySheetRows(rows){
 const currentId=DATA[active].id,previousIndex=active,scrollTop=content.scrollTop;
 const next=rows.map(row=>({...visualById.get(row.id),id:row.id,title:row.titulo,text:row.texto,detail:'',photo:row.foto,avatar:visualById.get(row.id)?.avatar||'assets/mag.webp',quiet:false}));
 DATA.splice(0,DATA.length,...next);const kept=DATA.findIndex(d=>d.id===currentId);active=kept>=0?kept:Math.min(previousIndex,DATA.length-1);
 renderBoard();memory();layout();content.scrollTop=scrollTop;document.title=DATA[0].title;
}
renderBoard();
function layout(){state();scale=Math.min(innerWidth/480,1.65);left=(innerWidth-480*scale)/2;baseline=innerHeight*.40;map.style.left=left+'px';const d=DATA[active],aw=avatar.offsetWidth,ah=avatar.offsetHeight;currentMap=`translateY(${baseline-d.y*scale}px) scale(${scale})`;currentAvatar=`translate(${left+d.x*scale-aw/2}px,${baseline-ah}px)`;map.style.transform=currentMap;pawn.style.transform=currentAvatar;const top=baseline+35;bubble.style.top=top+'px';const max=document.querySelector('.timeline-navigation').getBoundingClientRect().top-top-20;content.style.maxHeight=Math.max(100,max-parseFloat(getComputedStyle(bubble).paddingTop)-parseFloat(getComputedStyle(bubble).paddingBottom))+'px';const bounds=bubble.getBoundingClientRect(),tail=Math.max(20,Math.min(bounds.width-40,left+d.x*scale-bounds.left-12));bubble.style.setProperty('--tail',tail+'px')}function state(){restartButton.hidden=active!==DATA.length-1;restartButton.disabled=moving||DATA.length===1;avatar.setAttribute('aria-disabled',String(moving||active===DATA.length-1));document.getElementById('timeline-prev').disabled=moving||active===0;document.getElementById('timeline-next').disabled=moving||active===DATA.length-1;window.__boardState={active,moving,waiting:!moving,renderer:'svg',moves,idleLoops:0};}function updateProgress(){
 const el=document.getElementById('timeline-progress'),remaining=DATA.length-active-1,fraction=DATA.length===1?1:active/(DATA.length-1),percent=Math.round(fraction*100);
 const label=remaining===0?'Concluído':remaining===1?'Falta 1 casa':`Faltam ${remaining} casas`;
 el.hidden=false;el.setAttribute('aria-valuenow',String(percent));el.setAttribute('aria-valuetext',`Casa ${active+1} de ${DATA.length}. ${label}.`);
 progressFill.style.transform=`scaleX(${fraction})`;
}
function memory(avatarReady=true){updateProgress();const d=DATA[active];if(avatarReady)avatar.src=d.avatar;avatar.alt='Personagem ilustrada de Magnolia';avatar.setAttribute('aria-label',active===DATA.length-1?'Última memória':'Mover para a próxima memória');bubble.classList.toggle('quiet',d.quiet);const title=document.createElement('h1'),text=document.createElement('p');title.textContent=d.title;text.textContent=d.text;content.replaceChildren(title,text);if(d.detail){const detail=document.createElement('p');detail.className='family-detail';detail.textContent=d.detail;content.append(detail)}content.scrollTop=0;stops.forEach((el,i)=>{el.classList.toggle('active',i===active);el.classList.toggle('next',i===active+1)});}
async function go(n){
 if(moving)return;n=Math.max(0,Math.min(DATA.length-1,n));if(n===active)return;
 moving=true;avatar.setAttribute('aria-disabled','true');document.body.classList.add('moving');state();
 const d=DATA[n],changed=avatar.getAttribute('src')!==d.avatar,animations=[];
 let ghost=null,avatarReady=true;
 try{
  if(changed&&!reduce.matches)avatarReady=await prepareAvatar(d.avatar);
  const aw=avatar.offsetWidth,ah=avatar.offsetHeight;
  const finalMap=`translateY(${baseline-d.y*scale}px) scale(${scale})`,finalAvatar=`translate(${left+d.x*scale-aw/2}px,${baseline-ah}px)`;
  const duration=reduce.matches?0:changed&&avatarReady?760:620;
  if(duration&&map.animate){
   const travel={duration,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'};
   animations.push(map.animate([{transform:currentMap},{transform:finalMap}],travel));
   animations.push(pawn.animate([{transform:currentAvatar},{transform:finalAvatar}],travel));
   animations.push(progressFill.animate([{transform:progressFill.style.transform||'scaleX(0)'},{transform:`scaleX(${DATA.length===1?1:n/(DATA.length-1)})`}],travel));
   if(changed&&avatarReady){
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
 }catch{
  // Unsupported or interrupted effects must never lock story navigation.
 }finally{
  animations.forEach(a=>a.cancel());if(ghost)ghost.remove();
  active=n;moves++;moving=false;avatar.setAttribute('aria-disabled','false');document.body.classList.remove('moving');memory(avatarReady);layout();if(contentSync)contentSync.flush();
 }
}

reduce.addEventListener('change',()=>{if(reduce.matches){map.getAnimations().forEach(a=>a.finish());pawn.getAnimations({subtree:true}).forEach(a=>a.finish());progressFill.getAnimations().forEach(a=>a.finish());}});
document.getElementById('timeline-prev').addEventListener('click',()=>go(active-1));document.getElementById('timeline-next').addEventListener('click',()=>go(active+1));
restartButton.addEventListener('click',()=>go(0));
const advance=()=>go(active+1);avatar.addEventListener('click',e=>{e.stopPropagation();if(performance.now()>suppress)advance()});avatar.addEventListener('keydown',e=>{if(!e.repeat&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.stopPropagation();advance()}});stage.addEventListener('click',e=>{if(moving||performance.now()<suppress||e.target===avatar)return;const hit=e.target.closest('[data-go]');if(hit){const n=Number(hit.dataset.go);n===active?advance():go(n)}else advance()});stage.addEventListener('touchstart',e=>{touch=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null},{passive:true});stage.addEventListener('touchend',e=>{if(!touch||!e.changedTouches.length)return;const t=e.changedTouches[0],dx=t.clientX-touch.x,dy=t.clientY-touch.y;touch=null;if(Math.max(Math.abs(dx),Math.abs(dy))<48)return;suppress=performance.now()+450;if(moving)return;(Math.abs(dy)>=Math.abs(dx)?dy<0:dx<0)?advance():go(active-1)},{passive:true});stage.addEventListener('touchcancel',()=>{touch=null},{passive:true});stage.addEventListener('wheel',e=>{e.preventDefault();clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>{wheelLocked=false},900);if(moving||wheelLocked||Math.abs(e.deltaY)<25)return;wheelLocked=true;e.deltaY>0?advance():go(active-1)},{passive:false});addEventListener('keydown',e=>{if(e.repeat||moving||e.target instanceof Element&&e.target.closest('.bubble'))return;if(['ArrowRight','ArrowUp'].includes(e.key)){e.preventDefault();advance()}if(['ArrowLeft','ArrowDown'].includes(e.key)){e.preventDefault();go(active-1)}});addEventListener('resize',()=>{if(!moving)layout()});memory();layout();window.__draft={get chapters(){return DATA.length},get stops(){return stops.length},go,update:layout};
if(window.MagnoliaSheetData&&window.MagnoliaSheetSync){
 contentSync=window.MagnoliaSheetSync.start({
  source:'https://docs.google.com/spreadsheets/d/e/2PACX-1vRACf3na_mfW8ZZ5-b5z8v2OAG8R1Wshaxl-Rjyc1T3FtEx804RHCcxAb9Fk6ebj3wjh9Sv-SvBEWcc/pub?gid=703861516&single=true&output=csv',
  allowedIds:null,baseUrl:'https://paulosanches.github.io/magnolia-jogo-da-vida/',initial:initialRows,onRows:applySheetRows,isMoving:()=>moving
 });
 window.__contentSync=contentSync;
}
})();