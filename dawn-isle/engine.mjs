import {ROOMS,DIRECTIONS,CHECKPOINTS,tileAt} from './world.mjs';

const R=4, SPEED=43;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const pointInFront=(p,o,range)=>{
 const d=DIRECTIONS[p.face],dx=o.x-p.x,dy=o.y-p.y;
 return Math.hypot(dx,dy)<=range&&(dx*d.x+dy*d.y)>3;
};
export function makeGame(){
 const g={room:'village',checkpoint:'village',mode:'play',time:0,revision:0,event:0,sound:'',
  flags:{blade:false,trial:false,boots:false,boss:false,fire:false},equipped:'shield',dialogue:[],enemies:{},projectiles:[],
  player:{...ROOMS.village.spawn,face:'up',hp:3,invuln:0,guarding:false,dash:0,hurt:0,walk:0},
  safe:{...ROOMS.village.spawn},swing:null,cooldown:0,notice:'',noticeTime:0,particles:[]};
 enterRoom(g,'village');return g;
}
function sound(g,name){g.sound=name;g.event++;}
function notice(g,text){g.notice=text;g.noticeTime=2.8;}
function dialogue(g,...lines){g.dialogue=lines;g.mode='dialogue';g.player.guarding=false;sound(g,'talk');}
function flag(g,key){if(!g.flags[key]){g.flags[key]=true;g.revision++;}}
function solid(g,x,y){
 const tile=tileAt(g.room,x,y);
 if('#TH~K'.includes(tile))return true;
 if(tile==='G'&&!g.flags.trial)return true;
 const exit=ROOMS[g.room].exits.find(e=>e.x===Math.floor(x/16)&&e.y===Math.floor(y/16));
 if(exit?.gate&&!g.flags[exit.gate])return true;
 return false;
}
function clearBox(g,x,y){return [[-R,-R],[R,-R],[-R,R],[R,R]].every(([a,b])=>!solid(g,x+a,y+b));}
function safeFloor(g,x,y){return [[-R,-R],[R,-R],[-R,R],[R,R]].every(([a,b])=>tileAt(g.room,x+a,y+b)!=='_');}
function clearDashBody(g,x,y){
 if(g.player.dash<=0)return true;
 return !(g.enemies[g.room]??[]).some(e=>{
  const radius=e.kind==='boss'?11:6;
  return e.hp>0&&Math.abs(x-e.x)<R+radius&&Math.abs(y-e.y)<R+radius;
 });
}
function move(g,dx,dy){
 const p=g.player,n=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/2));let blocked=false;
 for(let i=0;i<n;i++){
  if(clearBox(g,p.x+dx/n,p.y)&&clearDashBody(g,p.x+dx/n,p.y))p.x+=dx/n;else blocked=true;
  if(clearBox(g,p.x,p.y+dy/n)&&clearDashBody(g,p.x,p.y+dy/n))p.y+=dy/n;else blocked=true;
 }
 return blocked;
}
export function enterRoom(g,key,point){
 if(!ROOMS[key])return false;
 g.room=key;Object.assign(g.player,point??ROOMS[key].spawn,{dash:0,guarding:false,hurt:0,invuln:0});
 g.safe={x:g.player.x,y:g.player.y};g.swing=null;g.projectiles=[];
 if(!g.enemies[key])g.enemies[key]=ROOMS[key].enemies.map(e=>({...e,homeX:e.x,homeY:e.y,timer:e.kind==='boss'?1.2:1.5,phase:'watch',hit:0,direction:{x:1,y:0}}));
 if((key==='trial'&&g.flags.trial)||(key==='boss'&&g.flags.boss))g.enemies[key]=[];
 if(CHECKPOINTS.includes(key)&&g.checkpoint!==key){g.checkpoint=key;g.player.hp=3;g.revision++;}
 notice(g,ROOMS[key].name);return true;
}
export function equip(g){
 if(g.mode!=='play'||!g.flags.boots)return;
 g.equipped=g.equipped==='shield'?'boots':'shield';g.player.guarding=false;
 notice(g,g.equipped==='boots'?'Gust Boots equipped':'Shield equipped');sound(g,'equip');
}
export function useItem(g){
 if(g.mode!=='play'||g.equipped!=='boots'||!g.flags.boots||g.player.dash>0||g.player.hurt>0)return;
 g.player.dash=.2;g.player.guarding=false;sound(g,'dash');
}
export function act(g){
 if(g.mode==='dialogue'){g.dialogue.shift();if(!g.dialogue.length)g.mode='play';return;}
 if(g.mode!=='play'||g.player.dash>0)return;
 const p=g.player;
 const object=ROOMS[g.room].objects.find(o=>pointInFront(p,o,22)&&(o.kind!=='fire'||g.flags.boss));
 if(object){
  if(object.kind==='keeper'){
   if(!g.flags.blade){flag(g,'blade');p.hp=3;dialogue(g,'The shrine chose you. Take its blade and this shield.','Relight the watchtower fire. Its guardian guards the path.','A swings your sword. Hold B to raise your shield.');sound(g,'item');}
   else dialogue(g,g.flags.fire?'The first watchfire shines! Dawn Isle has hope again.':g.flags.boots?'Use the boots to dodge the guardian. Strike its glowing core.':'Follow Fernway east. The old watchtower waits beyond the ruins.');
   return;
  }
  if(object.kind==='villager'){dialogue(g,'The shore south of Fernway has a healing heart.','There is a shortcut across the old courtyard. I cannot jump that gap.');return;}
  if(object.kind==='house'){dialogue(g,'The villagers are sheltering inside. Bring back the watchfire.');return;}
  if(object.kind==='sign'){dialogue(g,g.room==='entry'?'Defeat the trial guardian to open the north door.':'OLD WATCHTOWER. The broken path south leads back to the village.');return;}
  if(object.kind==='chest'){
   if(!g.flags.boots){flag(g,'boots');g.equipped='boots';p.hp=3;dialogue(g,'You found the Gust Boots!','B dashes in the direction you face. Cross narrow pits in one burst.','Tap the item slot, or press I, to swap boots and shield.');sound(g,'item');}
   else dialogue(g,'The chest is empty. The Gust Boots are yours.');return;
  }
  if(object.kind==='fire'){
   flag(g,'fire');g.mode='complete';p.guarding=false;g.revision++;sound(g,'win');return;
  }
 }
 if(!g.flags.blade){dialogue(g,'Speak to the keeper beside the shrine. Face them and press A.');return;}
 if(g.cooldown>0)return;
 g.swing={timer:.18,hits:new Set(),face:p.face};g.cooldown=.31;sound(g,'swing');
 strike(g);
}
function strike(g){
 if(!g.swing)return;
 for(const e of g.enemies[g.room]??[]){
  if(e.hp<=0||g.swing.hits.has(e.id)||!pointInFront({...g.player,face:g.swing.face},e,e.kind==='boss'?24:22))continue;
  g.swing.hits.add(e.id);
  if(e.kind==='boss'&&e.phase!=='stunned'){sound(g,'block');continue;}
  e.hp--;e.hit=.16;sound(g,'hit');
  if(e.hp<=0){
   for(let i=0;i<7;i++)g.particles.push({x:e.x,y:e.y,vx:Math.cos(i)*20,vy:Math.sin(i)*20,life:.4});
   if(e.kind==='boss'){flag(g,'boss');g.player.hp=3;notice(g,'Guardian defeated! Light the watchfire.');sound(g,'item');}
  }
 }
 if(g.room==='trial'&&!g.flags.trial&&(g.enemies.trial??[]).every(e=>e.hp<=0)){
  flag(g,'trial');notice(g,'The north door opens!');sound(g,'item');
 }
}
export function hitPlayer(g,source){
 const p=g.player;if(g.mode!=='play'||p.invuln>0||p.dash>0)return false;
 if(!source.unblockable&&p.guarding&&g.equipped==='shield'&&pointInFront(p,source,1000)){sound(g,'block');return false;}
 p.hp--;p.invuln=1.15;p.hurt=.15;p.guarding=false;sound(g,'hurt');
 const len=distance(p,source)||1;move(g,(p.x-source.x)/len*5,(p.y-source.y)/len*5);
 if(p.hp<=0){g.mode='dead';p.dash=0;g.swing=null;}
 return true;
}
export function retry(g){
 const flags={...g.flags},checkpoint=g.checkpoint,equipped=g.equipped,revision=g.revision;
 Object.assign(g,makeGame());g.flags=flags;g.equipped=equipped;g.checkpoint=checkpoint;
 enterRoom(g,checkpoint);g.mode=flags.fire?'complete':'play';g.player.hp=3;g.revision=revision+1;
}
function fall(g){
 const p=g.player;p.x=g.safe.x;p.y=g.safe.y;p.dash=0;
 if(p.invuln<=0){p.hp--;p.invuln=1.15;sound(g,'hurt');}
 p.hurt=.2;notice(g,'A narrow gap? Face it and press B with boots.');
 if(p.hp<=0)g.mode='dead';
}
function updateEnemies(g,dt){
 const p=g.player;
 for(const e of g.enemies[g.room]??[]){
  if(e.hp<=0)continue;e.hit=Math.max(0,e.hit-dt);e.timer-=dt;
  if(e.kind==='boss'){
   if(e.phase==='watch'&&e.timer<=0){const dx=p.x-e.x,dy=p.y-e.y;e.direction=Math.abs(dx)>Math.abs(dy)?{x:Math.sign(dx)||1,y:0}:{x:0,y:Math.sign(dy)||1};e.phase='warn';e.timer=.75;sound(g,'warn');}
   else if(e.phase==='warn'&&e.timer<=0){e.phase='charge';e.timer=2;}
   else if(e.phase==='charge'){
    const nx=e.x+e.direction.x*105*dt,ny=e.y+e.direction.y*105*dt;
    if(nx<25||nx>135||ny<25||ny>103||e.timer<=0){e.x=Math.max(25,Math.min(135,nx));e.y=Math.max(25,Math.min(103,ny));e.phase='stunned';e.timer=2.6;sound(g,'block');}
    else {e.x=nx;e.y=ny;}
   }else if(e.phase==='stunned'&&e.timer<=0){e.phase='watch';e.timer=1.1;}
   if(distance(e,p)<13&&e.phase!=='stunned')hitPlayer(g,{...e,unblockable:e.phase==='charge'});
  }else if(e.kind==='spitter'){
   if(e.timer<=0){const dx=p.x-e.x,dy=p.y-e.y,len=Math.hypot(dx,dy)||1;g.projectiles.push({x:e.x,y:e.y,vx:dx/len*31,vy:dy/len*31,life:4});e.timer=2.1;}
   if(distance(e,p)<11)hitPlayer(g,e);
  }else{
   const dx=p.x-e.x,dy=p.y-e.y,len=Math.hypot(dx,dy)||1;
   if(len<67&&len>8){const nx=e.x+dx/len*12*dt,ny=e.y+dy/len*12*dt;
    if(!solid(g,nx,ny)&&tileAt(g.room,nx,ny)!=='_'){e.x=nx;e.y=ny;}}
   if(distance(e,p)<10)hitPlayer(g,e);
  }
 }
 for(const b of g.projectiles){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
  if(solid(g,b.x,b.y))b.life=0;
  if(b.life>0&&distance(b,p)<7){hitPlayer(g,b);b.life=0;}}
 g.projectiles=g.projectiles.filter(b=>b.life>0);
}
function step(g,input,dt){
 if(g.mode!=='play')return;
 const p=g.player;g.time+=dt;g.cooldown=Math.max(0,g.cooldown-dt);p.invuln=Math.max(0,p.invuln-dt);p.hurt=Math.max(0,p.hurt-dt);
 g.noticeTime=Math.max(0,g.noticeTime-dt);g.particles.forEach(a=>{a.x+=a.vx*dt;a.y+=a.vy*dt;a.life-=dt;});g.particles=g.particles.filter(a=>a.life>0);
 p.guarding=!!input.item&&g.flags.blade&&g.equipped==='shield'&&p.dash<=0&&p.hurt<=0;
 let dx=Number(!!input.right)-Number(!!input.left),dy=Number(!!input.down)-Number(!!input.up);
 if(p.dash>0){const v=DIRECTIONS[p.face];const blocked=move(g,v.x*210*dt,v.y*210*dt);p.dash=Math.max(0,p.dash-dt);if(blocked)p.dash=0;}
 else if(p.hurt<=0){
  if(dx||dy){if(Math.abs(dx)>=Math.abs(dy)&&dx)p.face=dx>0?'right':'left';else p.face=dy>0?'down':'up';
   const len=Math.hypot(dx,dy),speed=p.guarding?18:SPEED;move(g,dx/len*speed*dt,dy/len*speed*dt);p.walk+=dt;}
 }
 if(p.dash<=0&&tileAt(g.room,p.x,p.y)==='_')fall(g);
 else if(p.dash<=0&&safeFloor(g,p.x,p.y))g.safe={x:p.x,y:p.y};
 if(g.swing){strike(g);g.swing.timer-=dt;if(g.swing.timer<=0)g.swing=null;}
 if(g.mode!=='play')return;
 updateEnemies(g,dt);
 const heart=ROOMS[g.room].objects.find(o=>o.kind==='heart'&&distance(o,p)<9);
 if(heart&&p.hp<3){p.hp=3;notice(g,'Hearts restored.');sound(g,'item');}
 const exit=ROOMS[g.room].exits.find(e=>Math.floor(p.x/16)===e.x&&Math.floor(p.y/16)===e.y);
 if(exit&&(!exit.gate||g.flags[exit.gate]))enterRoom(g,exit.to,exit.arrival);
}
export function tick(g,input={},dt=1/60){
 let left=Math.max(0,Math.min(Number.isFinite(dt)?dt:0,.1));
 while(left>1e-7){const stepTime=Math.min(left,1/120);step(g,input,stepTime);left-=stepTime;}
}
export function objective(g){
 if(g.flags.fire)return 'First watchfire restored';
 if(!g.flags.blade)return 'Speak to the keeper by the shrine';
 if(g.flags.boss)return 'Light the watchfire';
 if(g.flags.boots)return 'Dodge the guardian. Strike its core.';
 if(g.flags.trial)return 'Find the watchtower treasure';
 if(['entry','trial'].includes(g.room))return 'Defeat the trial guardian';
 return 'Follow Fernway to the old watchtower';
}
export function toSave(g){return {version:1,flags:{...g.flags},checkpoint:g.checkpoint};}
export function fromSave(raw){
 const g=makeGame();let s;
 try{s=typeof raw==='string'?JSON.parse(raw):raw;}catch{return g;}
 if(!s||s.version!==1||!s.flags||!CHECKPOINTS.includes(s.checkpoint))return g;
 const keys=Object.keys(g.flags);if(keys.some(k=>typeof s.flags[k]!=='boolean'))return g;
 const f=s.flags;
 if((f.trial&&!f.blade)||(f.boots&&!f.trial)||(f.boss&&!f.boots)||(f.fire&&!f.boss)||(s.checkpoint!=='village'&&!f.blade)||(['bridge','boss'].includes(s.checkpoint)&&!f.boots))return g;
 g.flags=Object.fromEntries(keys.map(k=>[k,f[k]]));g.checkpoint=s.checkpoint;g.equipped=f.boots?'boots':'shield';
 enterRoom(g,s.checkpoint);g.mode=f.fire?'complete':'play';return g;
}
