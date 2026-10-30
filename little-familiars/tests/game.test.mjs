import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, care, adopt, purchase, restore, advance, stage, growthReward, petCompanion } from '../game.mjs';

test('a balanced care round grows the pet and strengthens its bond', () => {
 const g=createGame(1000); const p=g.pets.cat;
 for(const action of ['food','water','clean','play']) assert.equal(care(g,action).ok,true);
 assert.ok(p.xp>=60); assert.equal(stage(p),'Youngster'); assert.ok(p.bond>=12);
 assert.equal(p.round.length,0);
});
test('full meters and unknown actions do not create infinite rewards', () => {
 const g=createGame(0); g.pets.cat.needs.food=100;
 assert.equal(care(g,'food').ok,false); assert.equal(care(g,'bogus').ok,false);
 assert.equal(g.pets.cat.xp,0);
});
test('free adoption preserves independent pets; locked pets cannot be selected', () => {
 const g=createGame(0); care(g,'food'); const xp=g.pets.cat.xp;
 assert.equal(adopt(g,'dog'),true); assert.equal(g.pets.dog.xp,0);
 assert.equal(adopt(g,'dragon'),false); adopt(g,'cat'); assert.equal(g.pets.cat.xp,xp);
});
test('simulated purchases are explicit, idempotent and reject invalid items', () => {
 const g=createGame(0);
 assert.equal(purchase(g,'dragon',false),false); assert.equal(adopt(g,'dragon'),false);
 assert.equal(purchase(g,'dragon',true),true); assert.equal(adopt(g,'dragon'),true);
 assert.equal(purchase(g,'dragon',true),false); assert.equal(purchase(g,'unknown',true),false);
});
test('elapsed care loss is capped after a long absence and cannot run backwards', () => {
 const g=createGame(1000); advance(g,1000+1000*60*60*24*30);
 assert.ok(Object.values(g.pets.cat.needs).every(n=>n>=20&&n<=100));
 const before=JSON.stringify(g.pets.cat.needs);advance(g,500);assert.equal(JSON.stringify(g.pets.cat.needs),before);
});
test('save validation recovers malformed data and preserves valid progress', () => {
 assert.equal(restore('{bad',1000).active,'cat');
 assert.equal(restore(JSON.stringify({version:1,pets:{cat:{xp:-10}},active:'dragon'}),1000).active,'cat');
 const g=createGame(1000); care(g,'water'); purchase(g,'fox',true); adopt(g,'fox');g.pets.fox.name='<script>';
 const loaded=restore(JSON.stringify(g),1000);assert.equal(loaded.active,'fox');assert.equal(loaded.pets.cat.xp,g.pets.cat.xp);
 assert.equal(restore(JSON.stringify({...g,pets:{...g.pets,cat:{...g.pets.cat,needs:{food:NaN}}}}),1000).pets.cat.needs.food,62);
});
test('affection has a cooldown and variety gives a growth bonus', () => {
 const g=createGame(1000);assert.equal(petCompanion(g,1000),true);assert.equal(petCompanion(g,2000),false);
 assert.equal(petCompanion(g,32000),true);
 assert.ok(growthReward('food',['water','clean','play'])>growthReward('food',[]));
});
