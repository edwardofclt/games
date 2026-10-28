import { WORLD as W, gateSpeed, gapCenter, hitsGate } from './rules.js';
const canvas=document.querySelector('canvas'), ctx=canvas.getContext('2d');
const scoreEl=document.querySelector('#score'), bestEl=document.querySelector('#best'), pauseButton=document.querySelector('#pause');
const overlay=document.querySelector('#overlay'), hint=document.querySelector('#hint'), action=document.querySelector('#action');
let best=0;
try {best=Math.max(0,Number(localStorage.getItem('gap-dash-best'))||0);} catch {}
bestEl.textContent=best;
let state='ready', score=0, phase=-.48, x=W.left, from=W.left, to=W.right, flight=0, accumulator=0, last=0, flash=0, particles=[];
let beforePause='ready';
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function announce(text){document.querySelector('#announcement').textContent=text;}
function reset(){score=0;phase=-.48;x=W.left;from=W.left;to=W.right;flight=0;particles=[];flash=0;scoreEl.textContent=0;state='ready';overlay.hidden=true;hint.hidden=false;pauseButton.disabled=false;last=0;accumulator=0;announce('New route. Tap or press Space to cross.');}
function launch(){if(state==='ready'||state==='waiting'){from=x;to=x===W.left?W.right:W.left;flight=0;state='flying';hint.hidden=true;}}
function setOverlay(eyebrow,title,message,label){document.querySelector('#eyebrow').textContent=eyebrow;document.querySelector('#title').textContent=title;document.querySelector('#message').textContent=message;action.innerHTML=label+' <span>→</span>';overlay.hidden=false;}
function pause(){if(state==='paused'||state==='dead')return;beforePause=state;state='paused';setOverlay('ROUTE PAUSED','Take a breather.','Zip will wait right here.','Resume route');announce('Paused');}
function resume(){if(document.hidden)return;state=beforePause;overlay.hidden=true;last=0;accumulator=0;announce('Route resumed');}
function fail(){state='dead';pauseButton.disabled=true;for(let i=0;i<12;i++){const a=i*Math.PI/6;particles.push({x,y:W.y,vx:Math.cos(a)*90,vy:Math.sin(a)*90,life:1});}setOverlay('SIGNAL MISSED','Bump. Try again.',`${score} ${score===1?'crossing':'crossings'} delivered · Best ${best}. Watch where the gap is heading.`,'Try again');announce(`Run ended. ${score} crossings. Best ${best}. Try again.`);}
function update(dt){if(state==='dead'){for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt*2;}return;}if(state==='paused')return;phase=(phase+gateSpeed(score)*dt)%(Math.PI*2);flash=Math.max(0,flash-dt*3);if(state!=='flying')return;flight+=dt;const t=Math.min(1,flight/W.duration);x=from+(to-from)*t;if(hitsGate(x,gapCenter(phase))){fail();return;}if(t===1){state='waiting';score++;scoreEl.textContent=score;flash=1;if(score>best){best=score;bestEl.textContent=best;try{localStorage.setItem('gap-dash-best',String(best));}catch{}}announce(`${score} crossings`);}}
function round(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function draw(){const box=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,3),pw=Math.round(box.width*dpr),ph=Math.round(box.height*dpr);if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}ctx.setTransform(pw/W.width,0,0,ph/W.height,0,0);ctx.clearRect(0,0,W.width,W.height);const c=gapCenter(phase),top=c-W.gap/2,bottom=c+W.gap/2;
// Rails and landing pads frame the only route Zip can take.
round(-10,120,26,460,13,'#273445');round(384,120,26,460,13,'#273445');
ctx.strokeStyle='#cdd1cd';ctx.lineWidth=2.5;ctx.setLineDash([7,10]);ctx.beginPath();ctx.moveTo(54,W.y);ctx.lineTo(346,W.y);ctx.stroke();ctx.setLineDash([]);
round(x===W.left?376:16,W.y-31,8,62,4,'#5be4ba');
round(W.gateX-W.gateWidth/2,144,W.gateWidth,top-144,13,'#ff6565');round(W.gateX-W.gateWidth/2,bottom,W.gateWidth,570-bottom,13,'#ff6565');
round(W.gateX-W.gateWidth/2+4,153,3,Math.max(0,top-166),2,'#ff9390');round(W.gateX-W.gateWidth/2+4,bottom+9,3,Math.max(0,555-bottom),2,'#ff9390');
// A quiet chevron reveals direction without predicting the winning tap.
const gy=c+Math.sign(Math.cos(phase))*13;ctx.strokeStyle='#acb6b7';ctx.lineWidth=2.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(231,gy-5*Math.sign(Math.cos(phase)));ctx.lineTo(236,gy);ctx.lineTo(241,gy-5*Math.sign(Math.cos(phase)));ctx.stroke();
if(flash>0&&!reduced){ctx.globalAlpha=flash*.6;ctx.strokeStyle='#5be4ba';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,W.y,18+(1-flash)*26,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
if(state!=='dead'){if(state==='flying'&&!reduced){const dir=Math.sign(to-from);for(let i=4;i>0;i--){ctx.globalAlpha=(1-i/5)*.2;round(x-dir*i*9-10,W.y-9,20,18,9,'#158cf2');}ctx.globalAlpha=1;}ctx.shadowColor='#096abb33';ctx.shadowBlur=10;ctx.shadowOffsetY=5;ctx.fillStyle='#158cf2';ctx.beginPath();ctx.ellipse(x,W.y,state==='flying'&&!reduced?17:13,13,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.fillStyle='#66b9ff';ctx.beginPath();ctx.arc(x-3,W.y-4,5,Math.PI,Math.PI*1.8);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x+(x<200?4:-4),W.y-2,2.4,0,Math.PI*2);ctx.fill();}
for(const p of particles){if(p.life>0&&!reduced){ctx.globalAlpha=Math.max(0,p.life);round(p.x-3,p.y-3,6,6,3,'#158cf2');}}ctx.globalAlpha=1;
}
function frame(now){if(!last)last=now;const elapsed=Math.min((now-last)/1000,.1);last=now;accumulator+=elapsed;while(accumulator>=1/240){update(1/240);accumulator-=1/240;}draw();requestAnimationFrame(frame);}
canvas.addEventListener('pointerdown',e=>{e.preventDefault();launch();});
pauseButton.addEventListener('click',()=>{if(state==='paused')resume();else pause();});
action.addEventListener('click',()=>{if(state==='paused')resume();else reset();});
window.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();if(e.repeat)return;if(state==='paused')resume();else if(state==='dead')reset();else launch();}if(e.code==='KeyP'&&!e.repeat){if(state==='paused')resume();else pause();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
window.addEventListener('blur',pause);
window.addEventListener('resize',()=>{if(state==='flying')pause();});
requestAnimationFrame(frame);
