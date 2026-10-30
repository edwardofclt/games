import {ROOMS,DIRECTIONS} from './world.mjs';
import {paintSprite,drawHero,KEEPER,VILLAGER,PALETTE,TREE,TREE_COLORS,BEETLE,BEETLE_COLORS,CHEST,CHEST_COLORS} from './art.mjs';

const INK='#202b3b',CREAM='#fff0bc';
const glyphs={A:[14,17,17,31,17,17,17],B:[30,17,17,30,17,17,30],C:[14,17,16,16,16,17,14],D:[30,17,17,17,17,17,30],E:[31,16,16,30,16,16,31],F:[31,16,16,30,16,16,16],G:[14,17,16,23,17,17,15],H:[17,17,17,31,17,17,17],I:[14,4,4,4,4,4,14],J:[7,2,2,2,18,18,12],K:[17,18,20,24,20,18,17],L:[16,16,16,16,16,16,31],M:[17,27,21,21,17,17,17],N:[17,25,21,19,17,17,17],O:[14,17,17,17,17,17,14],P:[30,17,17,30,16,16,16],Q:[14,17,17,17,21,18,13],R:[30,17,17,30,20,18,17],S:[15,16,16,14,1,1,30],T:[31,4,4,4,4,4,4],U:[17,17,17,17,17,17,14],V:[17,17,17,17,17,10,4],W:[17,17,17,21,21,21,10],X:[17,17,10,4,10,17,17],Y:[17,17,10,4,4,4,4],Z:[31,1,2,4,8,16,31],0:[14,17,19,21,25,17,14],1:[4,12,4,4,4,4,14],2:[14,17,1,2,4,8,31],3:[30,1,1,14,1,1,30],4:[2,6,10,18,31,2,2],5:[31,16,16,30,1,1,30],6:[14,16,16,30,17,17,14],7:[31,1,2,4,8,8,8],8:[14,17,17,14,17,17,14],9:[14,17,17,15,1,1,14],'.':[0,0,0,0,0,12,12],':':[0,12,12,0,12,12,0],'/':[1,2,2,4,8,8,16],'-':[0,0,0,31,0,0,0],'!':[4,4,4,4,4,0,4],'?':[14,17,1,2,4,0,4]};
export function pixelText(ctx,text,x,y,color=INK){
 ctx.fillStyle=color;for(const ch of String(text).toUpperCase()){
  const bits=glyphs[ch];if(bits)bits.forEach((row,j)=>{for(let i=0;i<5;i++)if(row&(1<<(4-i)))ctx.fillRect(x+i,y+j,1,1);});x+=6;
 }
}
function rect(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}
function heart(c,x,y,full=true){
 rect(c,INK,x+1,y,3,1);rect(c,INK,x+5,y,3,1);rect(c,INK,x,y+1,9,4);rect(c,INK,x+1,y+5,7,1);rect(c,INK,x+2,y+6,5,1);rect(c,INK,x+3,y+7,3,1);rect(c,INK,x+4,y+8,1,1);
 if(full){rect(c,'#db6354',x+1,y+1,3,4);rect(c,'#db6354',x+5,y+1,3,4);rect(c,'#db6354',x+2,y+4,5,2);rect(c,'#db6354',x+3,y+6,3,1);rect(c,'#db6354',x+4,y+7,1,1);rect(c,'#ffd59a',x+2,y+1,1,2);}
}
function shield(c,x,y){rect(c,INK,x+1,y,7,1);rect(c,INK,x,y+1,9,6);rect(c,INK,x+1,y+7,7,1);rect(c,INK,x+2,y+8,5,1);rect(c,INK,x+3,y+9,3,1);rect(c,'#70b8b4',x+1,y+1,7,5);rect(c,'#477f98',x+2,y+6,5,2);rect(c,'#e6dda2',x+4,y+2,1,6);rect(c,'#d3e4bc',x+2,y+2,5,1);}
function boots(c,x,y){rect(c,INK,x+2,y,5,9);rect(c,'#70bfc6',x+3,y+1,3,7);rect(c,INK,x,y+7,7,4);rect(c,'#b3e5cf',x+1,y+8,5,2);rect(c,'#fff0bc',x+7,y+1,3,1);rect(c,'#fff0bc',x+7,y+3,2,1);}
const paths={
 village:new Set('2,3 2,4 3,4 4,4 5,4 6,4 7,4 8,4 9,4 3,5 4,5 4,3 4,2 5,2 5,1 7,5 7,6 7,7'.split(' ')),
 greenway:new Set([...Array.from({length:10},(_,x)=>`${x},4`),'5,5','5,6','5,7']),
 courtyard:new Set('0,4 1,4 2,4 3,4 4,4 5,4 5,3 5,2 5,1 5,0 2,5 2,7'.split(' '))
};
function flower(c,x,y,color){rect(c,'#477543',x,y+2,1,3);rect(c,color,x-1,y,3,1);rect(c,color,x,y-1,1,3);rect(c,'#fff0b5',x,y,1,1);}
function tile(c,kind,x,y,theme,time,openGate,key){
 const dungeon=theme==='dungeon'||theme==='boss',sand=theme==='shore',ruin=theme==='ruin',tx=x/16,ty=y/16;
 const neighbor=(dx,dy)=>ROOMS[key].rows[ty+dy]?.[tx+dx];
 const pathAt=(dx,dy)=>paths[key]?.has(`${tx+dx},${ty+dy}`);
 const base=dungeon?'#859198':sand?'#efd59a':ruin?'#91a568':'#97bd5d';
 const seed=(tx*29+ty*47+key.length*13)%97;
 rect(c,base,x,y,16,16);
 if(dungeon){
  rect(c,'#76818e',x,y,16,1);rect(c,'#76818e',x,y,1,16);rect(c,'#a2a99f',x+1,y+1,14,1);
  if(seed%3===0){rect(c,'#74808b',x+9,y+9,3,1);rect(c,'#a4aba1',x+8,y+10,2,1);}
 }else if('DK.'.includes(kind)){
  if(pathAt(0,0)||sand){
   rect(c,'#e4cb91',x,y,16,16);rect(c,'#f0dba5',x+3+seed%5,y+5,2,1);
   if(!sand){
    if(!pathAt(0,-1)){rect(c,base,x,y,16,2);rect(c,'#799d50',x+2,y+2,12,1);}
    if(!pathAt(0,1)){rect(c,base,x,y+14,16,2);rect(c,'#c3b47a',x+2,y+13,12,1);}
    if(!pathAt(-1,0)){rect(c,base,x,y,2,16);rect(c,'#799d50',x+2,y+2,1,12);}
    if(!pathAt(1,0)){rect(c,base,x+14,y,2,16);rect(c,'#c3b47a',x+13,y+2,1,12);}
   }
  }else{
   if(seed%3===0){const px=x+3+seed%8;rect(c,'#6d9f4a',px,y+8,1,3);rect(c,'#6d9f4a',px-2,y+7,1,2);rect(c,'#c0d578',px+1,y+10,2,1);}
   if(seed%11===0)flower(c,x+7,y+7,seed%2?'#f4e8ae':'#e7a288');
  }
 }
 if(kind==='T'){
  paintSprite(c,TREE,TREE_COLORS,x,y,seed%2===0);
 }else if(kind==='#'){
  const edge=neighbor(0,1)!=='#';
  rect(c,dungeon?'#2d3c53':'#4d625c',x,y,16,16);
  rect(c,dungeon?'#6a7d8e':'#8d9a7b',x+1,y+1,14,5);rect(c,dungeon?'#9aa8aa':'#b8bc91',x+1,y+1,14,1);
  rect(c,dungeon?'#52677d':'#778b70',x+1,y+8,6,5);rect(c,dungeon?'#52677d':'#778b70',x+9,y+8,6,5);
  if(edge){rect(c,dungeon?'#27364a':'#485c52',x,y+13,16,3);rect(c,dungeon?'#879ba2':'#a5b085',x,y+12,16,1);}
  if(ruin&&seed%2===0){rect(c,'#4f7c4d',x+2,y+2,3,2);rect(c,'#719455',x+1,y+4,3,1);rect(c,'#719455',x+3,y+5,1,4);}
  if(dungeon&&ty===0&&(tx===3||tx===7)){rect(c,'#233244',x+4,y+8,8,7);rect(c,'#ba8a58',x+5,y+11,6,3);flame(c,x+8,y+9,time);}
 }else if(kind==='~'){
  rect(c,'#4d8daa',x,y,16,16);const shift=Math.floor(time*3)%3;
  rect(c,'#76b5bc',x+3+shift,y+6,5,1);rect(c,'#cae3c2',x+4+shift,y+5,2,1);rect(c,'#6ba5b1',x+8-shift,y+12,5,1);
  if(neighbor(0,-1)!=='~'){rect(c,'#d7c284',x,y,16,2);rect(c,'#eef0c2',x+2,y+2,12,1);}
  if(neighbor(0,1)!=='~'){rect(c,'#c5b77c',x,y+14,16,2);rect(c,'#8ac2c1',x+1,y+13,14,1);}
  if(neighbor(-1,0)!=='~'){rect(c,'#d7c284',x,y,2,16);rect(c,'#eef0c2',x+2,y+3,1,10);}
  if(neighbor(1,0)!=='~'){rect(c,'#c5b77c',x+14,y,2,16);rect(c,'#8ac2c1',x+13,y+3,1,10);}
 }else if(kind==='_'){
  rect(c,'#202e45',x,y,16,16);rect(c,'#172438',x+1,y+3,14,12);
  if(neighbor(0,-1)!=='_'){rect(c,'#bdbaa1',x,y,16,1);rect(c,'#5c6a78',x,y+1,16,3);}
  if(neighbor(0,1)!=='_'){rect(c,'#57677b',x,y+14,16,1);rect(c,'#b6b6a1',x,y+15,16,1);}
  if(neighbor(-1,0)!=='_')rect(c,'#596b7b',x,y,2,16);
  if(neighbor(1,0)!=='_')rect(c,'#596b7b',x+14,y,2,16);
 }else if(kind==='G'&&!openGate){
  rect(c,'#24364a',x,y,16,16);rect(c,'#d5bf83',x+1,y,14,2);for(let i=3;i<15;i+=4){rect(c,'#70694e',x+i,y+2,2,14);rect(c,'#c9b482',x+i,y+2,1,14);}
 }
}
function npc(c,o){
 const keeper=o.kind==='keeper';
 const colors=keeper?{...PALETTE,H:'#79847d',T:'#e5dbc0',p:'#658379',g:'#817b5d',w:'#efe8ca'}:{...PALETTE,H:'#bc7951',h:'#754932',T:'#b9d2bc',g:'#7b7197',G:'#b19bb8',p:'#596e80'};
 paintSprite(c,keeper?KEEPER:VILLAGER,colors,o.x-8,o.y-14);
}
function house(c){
 rect(c,'#566746',16,54,33,3);rect(c,'#594b3e',16,26,33,29);rect(c,'#dfc58d',18,31,29,22);
 rect(c,'#f5dfaa',19,34,27,15);rect(c,'#b09d73',18,51,29,3);
 for(let y=34;y<51;y+=5){rect(c,'#c3ad7d',19,y,3,1);rect(c,'#c3ad7d',44,y+2,2,1);}
 rect(c,'#503d37',30,42,10,13);rect(c,'#8c6948',32,44,6,10);rect(c,'#d2a965',36,49,1,1);rect(c,'#b9a073',28,54,14,2);
 rect(c,'#674d3c',20,38,7,8);rect(c,'#6da9b3',21,39,5,6);rect(c,'#e4e0ab',23,39,1,6);rect(c,'#e4e0ab',21,42,5,1);
 rect(c,'#735641',20,46,7,2);rect(c,'#5d8e4e',21,46,5,1);flower(c,22,45,'#e9997e');
 rect(c,'#574335',14,30,37,3);rect(c,'#8f4d3b',16,18,33,12);rect(c,'#bd6943',18,16,29,15);
 for(let row=0;row<4;row++){const y=17+row*4;rect(c,'#e29858',18,y,29,1);for(let x=19+(row%2)*3;x<47;x+=7){rect(c,'#8f4d3b',x,y+1,1,3);rect(c,'#d77f49',x+1,y+2,4,1);}}
 rect(c,'#f1be73',18,15,29,1);rect(c,'#594538',41,13,5,9);rect(c,'#9c8a6b',42,13,3,8);rect(c,'#c4b394',40,12,7,2);
}
function flame(c,x,y,time,large=false){
 const t=Math.floor(time*5)%2,s=large?2:1;
 rect(c,'#9e463e',x-3*s,y-4*s,6*s,7*s);rect(c,'#ed9451',x-2*s,y-7*s+t,4*s,9*s);rect(c,'#ffdc87',x-s,y-4*s-t,2*s,6*s);rect(c,'#fff0bc',x,y-2*s,1*s,3*s);
}
function boss(c,e,time){
 const x=Math.round(e.x),y=Math.round(e.y),stun=e.phase==='stunned';
 for(const side of [-1,1])for(const yy of [-6,1,7]){const leg=x+side*10;rect(c,INK,leg-2,y+yy,5,3);rect(c,'#aaad99',leg+(side>0?1:-2),y+yy+1,2,3);}
 rect(c,INK,x-8,y-11,16,23);rect(c,INK,x-11,y-7,22,16);
 rect(c,e.hit>0?'#fff0bc':'#687d87',x-8,y-9,16,18);rect(c,'#99aa9f',x-5,y-10,10,16);
 rect(c,'#bac1a4',x-4,y-9,7,2);rect(c,'#465e72',x-1,y-7,2,15);rect(c,'#465e72',x-9,y-3,18,2);
 rect(c,'#718c8c',x-9,y,5,6);rect(c,'#718c8c',x+4,y,5,6);rect(c,'#263e53',x-5,y+6,10,4);
 rect(c,'#ebbc73',x-4,y+7,2,2);rect(c,'#ebbc73',x+2,y+7,2,2);
 if(stun){rect(c,'#b77550',x-4,y-5,8,8);rect(c,'#f5cf88',x-3,y-4,6,6);rect(c,'#fff0bc',x-1,y-3,2,4);if(Math.floor(time*5)%2===0)pixelText(c,'!',x-2,y-20,'#fff0bc');}
 if(e.phase==='warn')pixelText(c,'!',x-2,y-21,'#f6b15d');
}
export function render(ctx,g){
 ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,160,144);ctx.save();
 const room=ROOMS[g.room];room.rows.forEach((row,j)=>[...row].forEach((v,i)=>tile(ctx,v,i*16,j*16,room.theme,g.time,g.flags.trial,g.room)));
 if(g.room==='village'){
  house(ctx);
  rect(ctx,'#59715d',78,32,20,2);rect(ctx,'#9aa786',80,27,16,5);rect(ctx,'#d0c9a2',81,25,14,4);
  rect(ctx,'#53696b',83,14,10,12);rect(ctx,'#a2b1a0',84,13,8,12);rect(ctx,'#ced4b1',85,12,6,1);
  rect(ctx,'#475c62',87,15,2,8);rect(ctx,'#f2d28b',87,15,2,6);rect(ctx,'#ceac6b',85,21,6,1);
  flower(ctx,72,31,'#e8aa8a');flower(ctx,101,29,'#f0e8b2');
  rect(ctx,'#788d55',17,64,13,1);for(let x=19;x<34;x+=7){rect(ctx,'#657445',x,61,2,6);rect(ctx,'#c5b37d',x,61,1,4);}
 }
 for(const o of room.objects){
  if(o.kind==='keeper'||o.kind==='villager'){npc(ctx,o);}
  if(o.kind==='sign'){rect(ctx,'#604e41',o.x-1,o.y-2,2,9);rect(ctx,INK,o.x-6,o.y-7,12,7);rect(ctx,'#c7b181',o.x-5,o.y-6,10,5);}
  if(o.kind==='chest'){
   paintSprite(ctx,CHEST,CHEST_COLORS,o.x-8,o.y-8);
   if(g.flags.boots){rect(ctx,'#3c3b3d',o.x-5,o.y-3,10,6);rect(ctx,'#a98452',o.x-6,o.y-7,12,2);rect(ctx,'#e4c17c',o.x-5,o.y-8,10,1);}
  }
  if(o.kind==='heart'&&g.player.hp<3)heart(ctx,o.x-4,o.y-5,true);
  if(o.kind==='fire'){
   rect(ctx,INK,o.x-8,o.y+1,16,5);rect(ctx,'#869194',o.x-6,o.y-1,12,5);rect(ctx,'#b2b39a',o.x-4,o.y-4,8,4);
   if(g.flags.boss)flame(ctx,o.x,o.y-5,g.time,g.flags.fire);
  }
  if(o.kind!=='house'&&o.kind!=='heart'&&(o.kind!=='fire'||g.flags.boss)&&Math.hypot(g.player.x-o.x,g.player.y-o.y)<25){
   rect(ctx,INK,o.x-4,o.y-25,9,10);pixelText(ctx,'A',o.x-2,o.y-23,CREAM);
  }
 }
 for(const e of g.enemies[g.room]??[]){
  if(e.hp<=0)continue;
  if(e.kind==='boss'){boss(ctx,e,g.time);continue;}
  const colors=e.hit>0?Object.fromEntries(Object.keys(BEETLE_COLORS).map(k=>[k,'#fff0bc'])):e.kind==='spitter'?{...BEETLE_COLORS,a:'#3f6b73',b:'#579390',c:'#8fb5a0',d:'#d9e3ab'}:BEETLE_COLORS;
  paintSprite(ctx,BEETLE,colors,e.x-8,e.y-6,Math.floor(g.time*5)%2===0);
 }
 for(const b of g.projectiles){rect(ctx,INK,b.x-3,b.y-3,6,6);rect(ctx,'#9bd7c6',b.x-2,b.y-2,4,4);rect(ctx,'#e4f1bf',b.x-1,b.y-2,1,2);}
 const p=g.player,d=DIRECTIONS[p.face];
 if(p.dash>0)for(let i=1;i<4;i++)rect(ctx,i%2?'#d0e6ba':'#71bcb0',p.x-d.x*i*5-1,p.y-d.y*i*5,3,2);
 if(p.invuln<=0||Math.floor(g.time*12)%2===0){
  drawHero(ctx,p,g.time);
  if(p.guarding)shield(ctx,p.x+d.x*8-4,p.y+d.y*7-6);
 }
 if(g.swing){
  const v=DIRECTIONS[g.swing.face],a=g.swing.timer/.18;
  ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y-3));ctx.rotate(({up:0,right:Math.PI/2,down:Math.PI,left:-Math.PI/2}[g.swing.face])+(a-.5)*1.5);
  rect(ctx,INK,-2,-20,4,15);rect(ctx,'#e9edc9',-1,-19,2,12);rect(ctx,'#e2ad64',-4,-8,8,2);ctx.restore();
 }
 for(const a of g.particles)rect(ctx,a.life>.2?'#fff0bc':'#e7ab65',a.x,a.y,2,2);
 ctx.restore();
 rect(ctx,'#e9dbad',0,128,160,16);rect(ctx,INK,0,128,160,1);rect(ctx,'#fff0c6',0,129,160,1);
 for(let i=0;i<3;i++)heart(ctx,4+i*12,132,g.player.hp>i);
 pixelText(ctx,'LIFE',43,133,'#5c6752');
 pixelText(ctx,'A',110,132);rect(ctx,INK,119,131,2,8);rect(ctx,'#d7e0bf',119,131,1,7);rect(ctx,'#b18a52',116,138,7,2);rect(ctx,INK,119,140,2,3);
 pixelText(ctx,'B',133,132);if(g.equipped==='boots')boots(ctx,144,131);else shield(ctx,144,131);
}
