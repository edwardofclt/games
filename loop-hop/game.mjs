import {Game, STEP, SPIKE, SPIKE_ANGLE, TAU} from './physics.mjs';
const canvas=document.querySelector('canvas'), ctx=canvas.getContext('2d');
const score=document.querySelector('#score'),bestLabel=document.querySelector('#best');
const pause=document.querySelector('#pause'),action=document.querySelector('#action'),message=document.querySelector('#message');
let game=new Game(),state='ready',best=0,accumulator=0,last=0,deathAge=0,particles=[];
try{const n=Number(localStorage.getItem('loop-hop.best'));if(Number.isFinite(n)&&n>=0)best=Math.floor(n);}catch{}
bestLabel.textContent=best;
function setState(next){
 state=next;document.body.dataset.state=state;pause.disabled=state==='ready'||state==='dead';
 pause.textContent=state==='paused'?'▷':'Ⅱ';pause.setAttribute('aria-label',state==='paused'?'Resume game':'Pause game');
 const content={ready:['Meet Pip. Chase a lap.','One little spike. Endless second chances.','Tap to jump'],running:['One more lap.','Jump outward. Land. Do it again.','Tap to jump'],paused:['Taking a breather.','Your lap is waiting right here.','Tap to resume'],dead:['Pip goes again.','One little spike. Another shot at the record.','Tap to retry']}[state];
 message.innerHTML=`<h1>${content[0]}</h1><p>${content[1]}</p>`;action.innerHTML=`${content[2]} <span>↗</span>`;
 if(state==='dead'){message.querySelector('p').textContent=`${game.score} ${game.score===1?'lap':'laps'} · Best ${best}. Another shot?`;}
 accumulator=0;last=performance.now();
}
function input(){
 if(state==='paused'){setState('running');return;}
 if(state==='dead'&&deathAge<.25)return;
 if(state==='ready'||state==='dead'){game=new Game();score.textContent=0;particles=[];setState('running');}
 game.jump();
}
document.querySelector('main').addEventListener('pointerdown',e=>{if(e.target.closest('#pause'))return;e.preventDefault();input();});
// Keyboard and assistive activation of real buttons do not emit pointerdown.
action.addEventListener('click',e=>{if(e.detail===0)input();});
pause.addEventListener('click',()=>{if(state==='running')setState('paused');else if(state==='paused')setState('running');});
window.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();if(!e.repeat&&e.target!==pause)input();}else if(e.code==='KeyP'||e.code==='Escape'){if(state==='running')setState('paused');else if(state==='paused')setState('running');}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='running')setState('paused');});
window.addEventListener('blur',()=>{if(state==='running')setState('paused');});
function resize(){const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,3);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);}
new ResizeObserver(resize).observe(canvas);
function pip(a,height,alpha=1){ctx.save();ctx.rotate(a);ctx.translate(157+height,0);ctx.rotate(Math.PI/4+height*.012);ctx.globalAlpha=alpha;ctx.shadowColor='#ffe14c55';ctx.shadowBlur=16;ctx.fillStyle='#ffe14c';ctx.beginPath();ctx.roundRect(-11,-11,22,22,6);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#5b4d1f';ctx.beginPath();ctx.arc(4,-4,1.3,0,TAU);ctx.arc(4,3,1.3,0,TAU);ctx.fill();ctx.restore();}
function draw(){
 const rect=canvas.getBoundingClientRect(),dpr=canvas.width/rect.width;
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,rect.width,rect.height);
 const scale=Math.min(rect.width/440,rect.height/440);ctx.translate(rect.width/2,rect.height/2);ctx.scale(scale,scale);
 ctx.strokeStyle='#65f4c508';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,191,0,TAU);ctx.stroke();
 ctx.shadowColor='#65f4c530';ctx.shadowBlur=22;ctx.strokeStyle='#65f4c5';ctx.lineWidth=9;ctx.beginPath();ctx.arc(0,0,140,0,TAU);ctx.stroke();ctx.shadowBlur=0;
 if(game.pulse>0){ctx.globalAlpha=game.pulse;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,140+(1-game.pulse*2)*15,0,TAU);ctx.stroke();ctx.globalAlpha=1;}
 ctx.save();ctx.rotate(SPIKE_ANGLE);ctx.fillStyle='#ff6b70';ctx.shadowBlur=15;ctx.shadowColor='#ff6b7033';ctx.beginPath();SPIKE.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();ctx.restore();
 if(state==='ready'){ctx.strokeStyle='#a3b7d077';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.arc(0,0,118,2.75,2.3,true);ctx.stroke();ctx.beginPath();ctx.moveTo(-66,96);ctx.lineTo(-78,89);ctx.lineTo(-76,103);ctx.stroke();}
 if(game.airborne){ctx.globalAlpha=.2;pip(game.angle,0,.18);ctx.globalAlpha=1;}
 if(state!=='dead')pip(game.angle,game.height);else{
  for(const p of particles){const t=Math.min(deathAge,1);ctx.globalAlpha=Math.max(0,1-t);ctx.fillStyle='#ffe14c';ctx.beginPath();ctx.arc(p.x+p.vx*t,p.y+p.vy*t+70*t*t,3*(1-t),0,TAU);ctx.fill();}ctx.globalAlpha=1;
 }
 if(state==='paused'){ctx.fillStyle='#101f3b99';ctx.beginPath();ctx.arc(0,0,126,0,TAU);ctx.fill();ctx.fillStyle='#f4f8ff';ctx.textAlign='center';ctx.font='700 14px system-ui';ctx.fillText('PAUSED',0,5);}
}
function frame(now){
 const elapsed=Math.min(.1,Math.max(0,(now-last)/1000));last=now;
 if(state==='running'){
  accumulator+=elapsed;
  while(accumulator>=STEP){game.step(STEP);accumulator-=STEP;if(game.dead){
   if(game.score>best){best=game.score;bestLabel.textContent=best;try{localStorage.setItem('loop-hop.best',String(best));}catch{}}
   deathAge=0;const r=157+game.height;particles=Array.from({length:14},(_,i)=>({x:Math.cos(game.angle)*r,y:Math.sin(game.angle)*r,vx:Math.cos(i/14*TAU)*80,vy:Math.sin(i/14*TAU)*80}));setState('dead');break;
  }}
  score.textContent=game.score;
  if(game.score>best){best=game.score;bestLabel.textContent=best;try{localStorage.setItem('loop-hop.best',String(best));}catch{}}
 }
 if(state==='dead')deathAge+=elapsed;
 draw();requestAnimationFrame(frame);
}
setState('ready');resize();requestAnimationFrame(frame);
