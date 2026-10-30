import {makeGame,tick,act,useItem,equip,retry,fromSave,toSave,objective,enterRoom} from './engine.mjs';
import {ROOMS} from './world.mjs';
import {render} from './render.mjs';

const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
const SAVE_KEY='dawn-isle.chapter-one.v1';
let raw=null,storage=true;
try{raw=localStorage.getItem(SAVE_KEY);}catch{storage=false;}
let game=raw?fromSave(raw):makeGame(),started=false,paused=false,confirmReset=false,lastRevision=-1;
const holds=new Map();
function clearInput(){holds.clear();game.player.guarding=false;document.querySelectorAll('.pressed').forEach(b=>b.classList.remove('pressed'));}
function pause(){clearInput();if(started&&!['dead','complete'].includes(game.mode))paused=true;}
function command(name){
 if(!started||paused||confirmReset)return;
 if(name==='action')act(game);
 if(name==='item')useItem(game);
 updateUI();
}
function store(){
 if(game.revision===lastRevision)return;
 lastRevision=game.revision;
 try{localStorage.setItem(SAVE_KEY,JSON.stringify(toSave(game)));}catch{storage=false;}
}
function setText(id,text){const e=$(id);if(e.textContent!==text)e.textContent=text;}
function updateUI(){
 setText('room',ROOMS[game.room].name);
 setText('objective',game.noticeTime>0?game.notice:objective(game));
 setText('save-status',storage?'AUTOSAVE':'SESSION SAVE');
 setText('item-name',game.equipped==='boots'?'GUST BOOTS':'SHIELD');
 setText('item-action',game.equipped==='boots'?'PRESS TO DASH':'HOLD GUARD');
 $('equip').disabled=!game.flags.boots||!started||paused||game.mode!=='play';
 $('dialogue').hidden=!game.dialogue.length||paused||confirmReset||!started;
 setText('dialogue-text',game.dialogue[0]??'');
 const modal=!started||paused||confirmReset||game.mode==='dead'||game.mode==='complete';$('modal').hidden=!modal;
 $('secondary').hidden=!confirmReset;
 if(confirmReset){setText('modal-kicker','NEW JOURNEY');setText('modal-title','Start over?');setText('modal-text','This resets the first chapter, including your items and watchfire.');setText('primary','Start fresh');setText('modal-help','Your current journey stays saved until you confirm.');}
 else if(!started){setText('modal-kicker','CHAPTER ONE');setText('modal-title','Dawn Isle');setText('modal-text','The watchfires have gone dark. An ancient blade has chosen you to bring them back.');setText('primary',raw?'Continue journey':'Begin journey');setText('modal-help','Move with the D-pad. A talks and swings your sword. B uses your item.');}
 else if(paused){setText('modal-kicker','TAKE A BREATHER');setText('modal-title','Journey paused');setText('modal-text','Your place is safe. Resume when you are ready.');setText('primary','Resume journey');setText('modal-help','Keyboard: arrows / WASD, J / Space, K, and I to swap.');}
 else if(game.mode==='dead'){setText('modal-kicker','A HERO GETS BACK UP');setText('modal-title','Try again');setText('modal-text','Return to your safe checkpoint with full hearts. Your items and cleared rooms stay yours.');setText('primary','Retry checkpoint');setText('modal-help','Guard with the shield. Use the boots to dodge a charge.');}
 else if(game.mode==='complete'){setText('modal-kicker','CHAPTER COMPLETE');setText('modal-title','The first light');setText('modal-text','The watchfire burns again. Hearth Village can see its light. You have completed this playable chapter.');setText('primary','Visit the village');setText('modal-help','Two watchfires and the Night Warden await in future chapters.');}
 $('pause').disabled=!started||game.mode==='complete'||game.mode==='dead';
}
$('primary').addEventListener('click',()=>{
 clearInput();
 if(confirmReset){game=makeGame();raw=null;lastRevision=-1;confirmReset=false;started=true;paused=false;}
 else if(!started){started=true;}
 else if(paused){paused=false;}
 else if(game.mode==='dead'){retry(game);}
 else if(game.mode==='complete'){game.mode='play';enterRoom(game,'village');}
 store();updateUI();
});
$('secondary').addEventListener('click',()=>{confirmReset=false;updateUI();});
$('restart').addEventListener('click',()=>{clearInput();confirmReset=true;updateUI();});
$('pause').addEventListener('click',()=>{if(paused)paused=false;else pause();updateUI();});
$('equip').addEventListener('click',()=>{clearInput();equip(game);updateUI();});
$('next').addEventListener('click',()=>command('action'));
for(const button of document.querySelectorAll('[data-control]')){
 const name=button.dataset.control;
 button.addEventListener('pointerdown',e=>{
  e.preventDefault();if(!started||paused||confirmReset)return;
  button.setPointerCapture(e.pointerId);holds.set(e.pointerId,name);button.classList.add('pressed');command(name);
 });
 const release=e=>{holds.delete(e.pointerId);button.classList.remove('pressed');};
 button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
 button.addEventListener('click',e=>{if(e.detail===0)command(name);});
}
const keys={ArrowUp:'up',w:'up',ArrowDown:'down',s:'down',ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',' ':'action',j:'action',k:'item'};
window.addEventListener('keydown',e=>{
 const key=e.key.length===1?e.key.toLowerCase():e.key,name=keys[key];
 if(key==='Escape'){e.preventDefault();if(started){if(confirmReset)confirmReset=false;else if(paused)paused=false;else pause();updateUI();}return;}
 if(key==='i'&&!e.repeat){e.preventDefault();if(started&&!paused){clearInput();equip(game);updateUI();}return;}
 if(!name||e.metaKey||e.ctrlKey||e.altKey)return;e.preventDefault();
 if(!started||paused||confirmReset){if(!e.repeat&&(name==='action'))$('primary').click();return;}
 if(!e.repeat){holds.set(`key:${key}`,name);command(name);}
});
window.addEventListener('keyup',e=>{const key=e.key.length===1?e.key.toLowerCase():e.key;holds.delete(`key:${key}`);});
window.addEventListener('blur',()=>{pause();updateUI();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();store();updateUI();}});
window.addEventListener('resize',()=>{if(started){pause();updateUI();}});
let last=performance.now();
function frame(now){
 const dt=Math.min((now-last)/1000,.05);last=now;
 if(started&&!paused&&!confirmReset){const input={};for(const value of holds.values())input[value]=true;tick(game,input,dt);store();}
 render(ctx,game);updateUI();requestAnimationFrame(frame);
}
updateUI();requestAnimationFrame(frame);
