import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame, tick, act, useItem, equip, hitPlayer, enterRoom, retry, toSave, fromSave } from '../engine.mjs';
import { ROOMS, tileAt } from '../world.mjs';

const advance=(g,seconds,input={})=>{for(let t=0;t<seconds;t+=1/120)tick(g,input,1/120);};
const armed=()=>{const g=makeGame();g.flags.blade=true;return g;};
const boots=()=>{const g=armed();g.flags.trial=true;g.flags.boots=true;g.equipped='boots';return g;};

test('facing keeper grants equipment once and dialogue advances without swinging',()=>{
 const g=makeGame();g.player.x=56;g.player.y=72;g.player.face='up';act(g);
 assert.equal(g.flags.blade,true);assert.ok(g.dialogue.length);assert.equal(g.swing,null);
 while(g.dialogue.length)act(g);assert.equal(g.mode,'play');
});
test('shield blocks the facing side but a rear hit damages and grants invulnerability',()=>{
 const g=armed();g.player.face='right';tick(g,{item:true},.01);
 assert.equal(hitPlayer(g,{x:g.player.x+10,y:g.player.y}),false);assert.equal(g.player.hp,3);
 assert.equal(hitPlayer(g,{x:g.player.x-10,y:g.player.y}),true);assert.equal(g.player.hp,2);
 assert.equal(hitPlayer(g,{x:g.player.x-10,y:g.player.y}),false);assert.equal(g.player.hp,2);
});
test('switching away from shield cancels its held state',()=>{
 const g=boots();g.equipped='shield';tick(g,{item:true},.01);assert.equal(g.player.guarding,true);
 equip(g);assert.equal(g.equipped,'boots');assert.equal(g.player.guarding,false);
});
test('one sword swing damages a given enemy only once',()=>{
 const g=armed();enterRoom(g,'trial',{x:64,y:72});const e=g.enemies.trial[0];
 e.x=64;e.y=56;e.hp=2;g.player.face='up';act(g);advance(g,.12);
 assert.equal(e.hp,1);
});
test('boots cross the bridge pit while ordinary walking falls and returns safely',()=>{
 const g=boots();enterRoom(g,'bridge',{x:72,y:72});g.player.face='right';useItem(g);advance(g,.23);
 assert.ok(g.player.x>100);assert.equal(g.player.hp,3);
 const h=armed();enterRoom(h,'bridge',{x:72,y:72});advance(h,.27,{right:true});
 assert.equal(h.player.hp,2);assert.ok(h.player.x<80);
});
test('dash uses swept collision and cannot pass through a wall',()=>{
 const g=boots();enterRoom(g,'entry',{x:24,y:72});g.player.face='left';useItem(g);advance(g,.25);
 assert.ok(g.player.x>=20);assert.equal(g.player.hp,3);
});
test('trial clear and boots persist through death and reload',()=>{
 const g=boots();g.checkpoint='treasure';enterRoom(g,'boss');g.player.hp=1;
 hitPlayer(g,{x:g.player.x+10,y:g.player.y,unblockable:true});assert.equal(g.mode,'dead');
 retry(g);assert.equal(g.flags.trial,true);assert.equal(g.flags.boots,true);assert.equal(g.player.hp,3);
 const loaded=fromSave(JSON.stringify(toSave(g)));assert.equal(loaded.flags.boots,true);assert.equal(loaded.flags.trial,true);
});
test('invalid or corrupt saves cannot strand a hero beyond a required item gate',()=>{
 assert.equal(fromSave('{no').room,'village');assert.equal(fromSave('null').room,'village');
 const g=armed();const saved=toSave(g);saved.checkpoint='bridge';saved.flags.boots=false;
 assert.equal(fromSave(JSON.stringify(saved)).room,'village');
});
test('guardian armor rejects swords until a charge exposes its core',()=>{
 const g=boots();enterRoom(g,'boss',{x:96,y:64});const b=g.enemies.boss[0];
 b.x=112;b.y=64;b.phase='watch';b.timer=10;g.player.face='right';act(g);advance(g,.1);
 assert.equal(b.hp,4);
 advance(g,.3);g.player.x=96;g.player.y=64;b.x=112;b.y=64;b.phase='stunned';b.timer=3;act(g);advance(g,.05);
 assert.equal(b.hp,3);
});
test('defeated guardian remains defeated after reload and watchfire ends the chapter',()=>{
 const g=boots();g.flags.boss=true;g.checkpoint='boss';const loaded=fromSave(JSON.stringify(toSave(g)));
 assert.equal(loaded.enemies.boss.length,0);loaded.player.x=120;loaded.player.y=40;loaded.player.face='right';act(loaded);
 assert.equal(loaded.flags.fire,true);assert.equal(loaded.mode,'complete');
 assert.equal(fromSave(JSON.stringify(toSave(loaded))).mode,'complete');
});
test('every spawn and exit arrival has room for the full player collision box',()=>{
 for(const [key,room] of Object.entries(ROOMS)){
  const check=(target,point,label)=>{for(const [dx,dy] of [[-4,-4],[-4,4],[4,-4],[4,4]])assert.ok(!'#TH~K_'.includes(tileAt(target,point.x+dx,point.y+dy)),label);};
  check(key,room.spawn,`${key} spawn`);
  for(const exit of room.exits)check(exit.to,exit.arrival,`${key} -> ${exit.to} arrival`);
 }
});
test('boots shortcut works in both directions without a trapped arrival',()=>{
 const g=boots();enterRoom(g,'village',{x:120,y:108});advance(g,.12,{down:true});
 assert.equal(g.room,'courtyard');const y=g.player.y;advance(g,.1,{up:true});assert.ok(g.player.y<y);
 enterRoom(g,'courtyard',{x:40,y:88});g.player.face='down';useItem(g);advance(g,.22);
 assert.equal(g.room,'village');assert.equal(g.player.hp,3);
});
test('swept dash stops before a living spitter or guardian body',()=>{
 const g=boots();enterRoom(g,'greenway',{x:112,y:56});g.player.face='up';useItem(g);advance(g,.22);
 assert.ok(g.player.y>=50,'spitter blocks the dash');
 const h=boots();enterRoom(h,'boss',{x:72,y:72});h.enemies.boss[0].timer=10;h.player.face='right';useItem(h);advance(h,.22);
 assert.ok(h.player.x<=105.5,'guardian blocks the dash');
});
