import test from 'node:test';
import assert from 'node:assert/strict';
import {makeGame,tick,act,useItem} from '../engine.mjs';
import {ROOMS} from '../world.mjs';

const advance=(g,s,input={})=>{for(let t=0;t<s;t+=1/120)tick(g,input,1/120);};
const closeDialogue=g=>{while(g.dialogue.length)act(g);};
function face(g,direction){tick(g,{[direction]:true},.00001);}
function attackNearby(g){
 const enemy=(g.enemies[g.room]??[]).find(e=>e.hp>0&&Math.hypot(e.x-g.player.x,e.y-g.player.y)<22);
 if(!enemy)return;
 const dx=enemy.x-g.player.x,dy=enemy.y-g.player.y;
 face(g,Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));act(g);
}
function walk(g,tx,ty,{fight=true}={}){
 const room=g.room,map=ROOMS[room],sx=Math.floor(g.player.x/16),sy=Math.floor(g.player.y/16);
 const queue=[[sx,sy]],parents=new Map([[`${sx},${sy}`,null]]);
 const pass=(x,y)=>{
  const tile=map.rows[y]?.[x];
  if(!tile||'#TH~K_'.includes(tile)||(tile==='G'&&!g.flags.trial))return false;
  const exit=map.exits.find(e=>e.x===x&&e.y===y);return !exit?.gate||g.flags[exit.gate];
 };
 let found=false;
 for(let i=0;i<queue.length;i++){
  const [x,y]=queue[i];if(x===tx&&y===ty){found=true;break;}
  for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){
   const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;
   if(!parents.has(key)&&pass(nx,ny)){parents.set(key,[x,y]);queue.push([nx,ny]);}
  }
 }
 assert.ok(found,`Walkable route in ${room} to ${tx},${ty}`);
 const path=[];let point=[tx,ty];while(point){path.unshift(point);point=parents.get(point.join(','));}
 for(const [x,y] of path){
  const target={x:x*16+8,y:y*16+8};let steps=0;
  while(g.room===room&&Math.hypot(g.player.x-target.x,g.player.y-target.y)>.5){
   assert.equal(g.mode,'play',`Alive while walking through ${room}`);
   const dx=target.x-g.player.x,dy=target.y-g.player.y;
   if(fight)attackNearby(g);
   const direction=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
   tick(g,{[direction]:true},1/120);
   assert.ok(++steps<2000,`Movement reached ${x},${y} in ${room}`);
  }
  if(g.room!==room)return;
 }
}
test('a fresh hero can play every required room and finish the first watchfire',()=>{
 const g=makeGame();walk(g,3,4);face(g,'up');act(g);closeDialogue(g);assert.ok(g.flags.blade);
 walk(g,9,4);assert.equal(g.room,'greenway');
 walk(g,9,4);assert.equal(g.room,'courtyard');
 walk(g,5,0);assert.equal(g.room,'entry');
 walk(g,5,0);assert.equal(g.room,'trial');
 walk(g,4,4);for(let i=0;i<12&&!g.flags.trial;i++){attackNearby(g);advance(g,.32);}
 assert.equal(g.flags.trial,true);walk(g,5,0);assert.equal(g.room,'treasure');
 walk(g,3,6);face(g,'up');act(g);closeDialogue(g);assert.equal(g.flags.boots,true);
 walk(g,5,4);face(g,'up');useItem(g);advance(g,.21);walk(g,9,2);assert.equal(g.room,'bridge');
 walk(g,4,4);face(g,'right');useItem(g);advance(g,.21);walk(g,9,4);assert.equal(g.room,'boss');
 advance(g,1.21);advance(g,.55,{down:true});advance(g,1.35);
 assert.equal(g.enemies.boss[0].phase,'stunned');walk(g,1,5,{fight:false});face(g,'up');
 for(let i=0;i<5&&!g.flags.boss;i++){act(g);advance(g,.32);}
 assert.equal(g.flags.boss,true);walk(g,7,2);face(g,'right');act(g);
 assert.equal(g.mode,'complete');assert.equal(g.flags.fire,true);
});
