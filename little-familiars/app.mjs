import { CATALOG, ACTIONS, createGame, restore, advance, care, adopt, purchase, stage, petCompanion } from './game.mjs';
const $=selector=>document.querySelector(selector);
const KEY='little-familiars.v1';
const icon=name=>`<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let storageAvailable=true;
let game;
try { game=restore(localStorage.getItem(KEY)); } catch {game=createGame();storageAvailable=false;}
let currentView='room', shopFilter='all', toastTimer, speechTimer, reactionTimer, playing=false, caught=0, purchaseId=null, audio;
const pet=()=>game.pets[game.active];
const item=()=>CATALOG.find(p=>p.id===game.active);
const artClass=p=>`pet-art kind-${p.kind}${p.variation?' variation-'+p.id:''}`;
const needMeta={food:{name:'Well-fed',icon:'food'},water:{name:'Hydrated',icon:'water'},clean:{name:'Fresh & fluffy',icon:'clean'},play:{name:'Happiness',icon:'play'}};
function save() {
 try {localStorage.setItem(KEY,JSON.stringify(game));storageAvailable=true;}catch{storageAvailable=false;}
 $('#save-status').innerHTML=`<i></i> ${storageAvailable?'Progress saved':'Session only'}`;
 $('#save-status').title=storageAvailable?'Saved in this browser':'Browser storage is unavailable. Progress will last for this session only.';
}
function toast(message) {clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,4500);}
function sound(high=false) {
 if(!game.sound)return;
 try {audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});const osc=audio.createOscillator(),gain=audio.createGain();osc.connect(gain);gain.connect(audio.destination);osc.type='sine';osc.frequency.setValueAtTime(high?660:440,audio.currentTime);osc.frequency.exponentialRampToValueAtTime(high?990:660,audio.currentTime+.12);gain.gain.setValueAtTime(.045,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.35);osc.start();osc.stop(audio.currentTime+.36);}catch{}
}
function defaultSpeech() {
 const p=pet();const lowest=ACTIONS.reduce((a,b)=>p.needs[a]<p.needs[b]?a:b);
 if(p.needs[lowest]<40)return {food:'A little snack would be lovely. ♡',water:'Could we share a fresh sip? ♡',clean:'A few bubbles would make my day. ♡',play:'Shall we catch a little starlight? ✧'}[lowest];
 return p.bond>=60?'My favorite place is wherever you are. ♡':p.bond>=20?'This is starting to feel like home. ♡':'You’re here. My favorite part of the day. ♡';
}
function speak(message) {clearTimeout(speechTimer);$('#pet-speech').textContent=message;speechTimer=setTimeout(()=>$('#pet-speech').textContent=defaultSpeech(),5500);}
function reaction(symbol='♡') {
 clearTimeout(reactionTimer);$('#pet-button').classList.remove('reacting');$('#care-particles').classList.remove('pop');void $('#pet-button').offsetWidth;$('#pet-button').classList.add('reacting');$('#care-particles').textContent=symbol;$('#care-particles').classList.add('pop');reactionTimer=setTimeout(()=>$('#pet-button').classList.remove('reacting'),1200);
}
function updateStats() {
 const p=pet(), species=item(), s=stage(p);
 $('#pet-name').textContent=p.name;$('#pet-description').textContent=`${species.species} · ${species.tag.toLowerCase()}`;
 $('#pet-button').setAttribute('aria-label',`Pet ${p.name}`);
 $('#hero-pet').className=artClass(species);
 $('#pet-button').style.setProperty('--pet-scale',p.xp>=180?'1.06':p.xp>=60?'.94':'.82');
 $('#stage-badge').textContent=s;
 $('#bond-value').textContent=`${Math.floor(p.bond)} / 100`;
 $('#bond-bar').style.width=`${p.bond}%`;
 $('#bond-caption').textContent=p.bond>=100?'A lifelong bond. You are their whole world.':p.bond>=60?'A trusted friend, through every little moment.':p.bond>=20?'Little by little, you’re becoming their person.':'The beginning of something lovely.';
 for(const key of ACTIONS){const n=Math.round(p.needs[key]);$(`#need-value-${key}`).textContent=`${n}%`;$(`#need-bar-${key}`).style.width=`${n}%`;$(`#need-meter-${key}`).setAttribute('aria-valuenow',n);}
 const goal=p.xp<60?60:p.xp<180?180:180;
 $('#growth-value').textContent=p.xp>=180?'Fully grown':`${p.xp} / ${goal}`;
 $('#growth-bar').style.width=`${Math.min(100,p.xp/goal*100)}%`;
 $('#growth-from').textContent=p.xp>=60?'Youngster':'Baby';$('#growth-to').textContent=p.xp>=180?'Grown companion ♡':p.xp>=60?'Grown companion ✧':'Youngster ✧';
 $('#growth-tip').textContent=p.xp>=180?'All grown up. There’s always more love to give.':'Good care helps little paws take big steps.';
 $('#round-count').textContent=`${p.round.length}/4`;
 $('#round-text').textContent=p.round.length?`${4-p.round.length} more kind${p.round.length===3?'':'s'} of care for a growth bonus.`:'Try all 4 care activities for a growth bonus.';
 $('#room-mood').textContent=p.bond>=60?'Right where I belong':p.bond>=20?'Feeling loved':'Happy you’re here';
 $('#needs-note').textContent=ACTIONS.some(a=>p.needs[a]<40)?'A little care, please':'Made better by you';
 $('#owned-count').textContent=game.owned.length;
 $('#sound-button').setAttribute('aria-pressed',String(game.sound));$('#sound-button').setAttribute('aria-label',game.sound?'Turn sound off':'Turn sound on');
}
function renderStarters() {
 $('#starter-cards').innerHTML=CATALOG.filter(p=>p.free).map(p=>`<button class="starter-card${game.active===p.id?' selected':''}" data-select="${p.id}" aria-label="Spend time with ${escapeHTML(game.pets[p.id].name)}" aria-pressed="${game.active===p.id}"><span class="starter-art ${artClass(p)}"></span><span class="starter-copy"><span class="card-tag">${p.tag}</span><h3>${escapeHTML(game.pets[p.id].name)}</h3><p>${p.species} · ${stage(game.pets[p.id])}</p></span>${game.active===p.id?`<span class="selected-mark">${icon('check')}</span>`:'<span class="card-arrow">↗</span>'}</button>`).join('');
}
function renderCollection() {
 $('#collection-grid').innerHTML=CATALOG.filter(p=>game.owned.includes(p.id)).map(p=>{const saved=game.pets[p.id],active=p.id===game.active;return `<article class="collection-card"><div class="card-picture"><span class="card-rarity">${p.free?'STARTER FRIEND':p.variation?'COAT VARIATION':'MAGICAL FRIEND'}</span><div class="${artClass(p)}"></div></div><div class="card-details"><h2>${escapeHTML(saved.name)}</h2><p class="pet-species">${p.species} · ${stage(saved)}</p><p>${p.description}</p><div class="meter"><span style="width:${saved.bond}%"></span></div><div class="card-progress"><span>♡ Bond ${Math.floor(saved.bond)} / 100</span><span>${saved.xp} growth</span></div><button class="primary-button${active?' current':''}" data-select="${p.id}">${active?'Together right now':'Spend time together'} <span>${active?'♡':'↗'}</span></button></div></article>`;}).join('');
}
function renderShop() {
 $('#shop-grid').innerHTML=CATALOG.filter(p=>!p.free&&(shopFilter==='all'||(shopFilter==='variation'?p.variation:!p.variation))).map(p=>{const owned=game.owned.includes(p.id);return `<article class="collection-card"><div class="card-picture"><span class="card-rarity">${p.variation?'COAT VARIATION':'MAGICAL FRIEND'}</span><div class="${artClass(p)}"></div></div><div class="card-details"><h2>${p.species}</h2><p class="pet-species">${p.tag.toLowerCase()}</p><p>${p.description}</p><div class="shop-price"><b>${p.price}</b><span>Simulated purchase</span></div><button class="primary-button${owned?' current':''}" ${owned?'data-select':'data-buy'}="${p.id}">${owned?'Visit your companion':'Meet your new friend'} <span>${owned?'♡':'↗'}</span></button></div></article>`;}).join('');
}
function render() {updateStats();renderStarters();if(currentView==='companions')renderCollection();if(currentView==='shop')renderShop();}
function setView(view) {
 if(!['room','companions','shop'].includes(view))return;
 stopPlay(false);currentView=view;
 for(const name of ['room','companions','shop'])$(`#${name}-view`).hidden=name!==view;
 document.querySelectorAll('.nav-item[data-view]').forEach(b=>{const selected=b.dataset.view===view;b.classList.toggle('active',selected);if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 $('#breadcrumb-current').textContent={room:'My room',companions:'Companions',shop:'Little market'}[view];
 render();window.scrollTo({top:0,behavior:'instant'});
}
function select(id) {
 if(!adopt(game,id))return;
 clearTimeout(speechTimer);save();setView('room');$('#pet-speech').textContent=defaultSpeech();reaction();sound();toast(`${pet().name} is happy to see you.`);
}
function performCare(action) {
 if(playing)return;
 advance(game);
 if(action==='play'&&pet().needs.play<92){startPlay();return;}
 finishCare(action);
}
function finishCare(action) {
 const result=care(game,action);
 if(!result.ok){if(result.full){speak({food:'My tummy is full. Let’s try something else! ♡',water:'All refreshed. Thank you! ♡',clean:'Already squeaky clean! ♡',play:'Let’s take a little breather. ♡'}[action]);toast('All topped up! Try another kind of care.');}save();render();return;}
 const messages={food:'That was delicious. You know me so well. ♡',water:'Aah, a fresh little sip. Thank you! ♡',clean:'Fresh, fluffy, and ready for cuddles. ✧',play:'Five little stars. One lovely memory. ✦'};
 speak(messages[action]);reaction({food:'♡',water:'◌',clean:'✧',play:'✦'}[action]);sound(result.grew);save();render();
 if(result.grew){speak(`Look at me grow! ${stage(pet())}, same big heart. ♡`);toast(`${pet().name} grew into a ${stage(pet()).toLowerCase()}! +${result.gain} growth · +4 bond`);}
 else toast(`${result.balanced?'A beautifully balanced care round! ':''}+${result.gain} growth · +4 bond with ${pet().name}`);
}
function startPlay() {
 playing=true;caught=0;$('#play-score').textContent='0 / 5';$('#play-overlay').hidden=false;
 $('#catch-star').style.left='43%';$('#catch-star').style.top='44%';$('#catch-star').focus({preventScroll:true});
 document.querySelectorAll('[data-action]').forEach(b=>b.disabled=true);
}
function stopPlay(returnFocus=true) {
 if(!playing)return;
 playing=false;$('#play-overlay').hidden=true;document.querySelectorAll('[data-action]').forEach(b=>b.disabled=false);
 if(returnFocus)$('[data-action="play"]').focus({preventScroll:true});
}
$('#catch-star').addEventListener('click',()=>{
 if(!playing)return;caught++;sound();$('#play-score').textContent=`${caught} / 5`;
 if(caught===5){stopPlay();finishCare('play');return;}
 const positions=[[20,56],[68,32],[30,29],[62,59]];
 $('#catch-star').style.left=`${positions[caught-1][0]}%`;$('#catch-star').style.top=`${positions[caught-1][1]}%`;
});
$('#cancel-play').addEventListener('click',()=>{stopPlay();toast('We can catch more starlight another time.');});
$('#pet-button').addEventListener('click',()=>{
 advance(game);const gained=petCompanion(game);reaction();sound();speak(pet().bond>=60?'You’re my person. Always. ♡':'Oh, that’s the spot. More little moments like this. ♡');
 if(gained)toast(`A little hello, a little closer. +2 bond with ${pet().name}`);
 else toast('So many cuddles. More bond in a little while. ♡');
 save();render();
});
function openModal(html) {stopPlay(false);$('#modal-content').innerHTML=html;$('#modal').showModal();}
$('#modal .dialog-close').addEventListener('click',()=>$('#modal').close());
$('#modal').addEventListener('close',()=>{purchaseId=null;});
$('#modal').addEventListener('click',event=>{if(event.target===$('#modal')){const r=$('#modal').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$('#modal').close();}});
function showPurchase(id) {
 const p=CATALOG.find(p=>p.id===id);if(!p||game.owned.includes(id))return;
 purchaseId=id;
 openModal(`<div class="dialog-art ${artClass(p)}"></div><div class="eyebrow">A NEW LITTLE BEGINNING</div><h2>Make room for ${p.name}?</h2><p>${p.description} Your new ${p.species.toLowerCase()} will have their own care, growth, and bond.</p><div class="purchase-note"><b>Simulated purchase · ${p.price}</b><br>No real payment. No charge. Browser-local unlock only.</div><div class="dialog-buttons"><button class="secondary-button" data-close>Maybe later</button><button class="primary-button" id="confirm-purchase">Simulate purchase</button></div>`);
}
$('#rename-button').addEventListener('click',()=>{
 openModal(`<div class="eyebrow">A NAME THAT FEELS LIKE HOME</div><h2>What’s their little name?</h2><p>Something sweet, something silly, something theirs.</p><form id="rename-form"><label for="pet-nickname">Your familiar’s name</label><input id="pet-nickname" name="nickname" maxlength="20" required autocomplete="off" value="${escapeHTML(pet().name)}"><div class="dialog-buttons"><button class="secondary-button" type="button" data-close>Keep their name</button><button class="primary-button" type="submit">Save name ♡</button></div></form>`);
 $('#pet-nickname').focus();$('#pet-nickname').select();
});
$('#modal').addEventListener('submit',event=>{
 if(event.target.id!=='rename-form')return;event.preventDefault();const name=$('#pet-nickname').value.trim();if(!name){$('#pet-nickname').setCustomValidity('Give your familiar a little name.');$('#pet-nickname').reportValidity();return;}
 pet().name=name.slice(0,20);save();render();$('#modal').close();toast(`A lovely little name. Hello, ${pet().name}.`);
});
$('#modal').addEventListener('input',event=>{if(event.target.id==='pet-nickname')event.target.setCustomValidity('');});
$('#journal-button').addEventListener('click',()=>{
 const p=pet();const milestones=[['♡','The first little hello','Spend a moment with your familiar.',p.interactions>0],['✦','Little paws, bigger steps','Grow from baby to youngster.',p.xp>=60],['❀','Becoming their person','Build a bond of 25.',p.bond>=25],['☾','Right where you belong','Build a bond of 60.',p.bond>=60],['✧','All grown, all loved','Reach 180 growth points.',p.xp>=180],['∞','A lifelong little bond','Build a bond of 100.',p.bond>=100]];
 openModal(`<div class="eyebrow">YOUR STORY, ONE MOMENT AT A TIME</div><h2>You & ${escapeHTML(p.name)}.</h2><p>Every little kindness becomes part of your story.</p>${milestones.map(([symbol,title,desc,done])=>`<div class="milestone${done?' done':''}"><span>${symbol}</span><div><b>${title}</b><p>${desc}</p></div><small>${done?'Reached ♡':'Still to come'}</small></div>`).join('')}`);
});
$('#help-button').addEventListener('click',()=>openModal(`<div class="eyebrow">WELCOME TO YOUR LITTLE WORLD</div><h2>A little guidance.</h2><p>There’s no rush. Just you, your familiar, and a few kind moments.</p><div class="help-row"><b>Care, in four little ways.</b><br>Feed, water, clean, and play. A useful action earns growth and bond. Full meters mean your pet has had enough for now.</div><div class="help-row"><b>Find a little balance.</b><br>Try all four care types for a 20-point growth bonus. Youngster at 60 points, grown companion at 180. A full care round reaches the first milestone.</div><div class="help-row"><b>Make a little memory.</b><br>Play by catching five stars. Tap your pet for affection; bond rewards refresh every 30 seconds. Keys 1–4 activate care on the room screen.</div><div class="help-row"><b>A gentle place to return to.</b><br>Needs decline slowly, with a capped loss while you’re away. Pets never die. Each companion keeps their own progress.</div><div class="help-row"><b>Your progress lives here.</b><br>Saved in this browser when storage is available. Clearing browser data removes saves. Market purchases are simulated and never charge money.</div>`));
$('#sound-button').addEventListener('click',()=>{game.sound=!game.sound;save();updateStats();sound();toast(game.sound?'A little sound, switched on.':'Quiet moments. Sound switched off.');});
document.body.addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button)return;
 if(button.dataset.view)setView(button.dataset.view);
 if(button.dataset.action)performCare(button.dataset.action);
 if(button.dataset.select)select(button.dataset.select);
 if(button.dataset.buy)showPurchase(button.dataset.buy);
 if(button.hasAttribute('data-close'))$('#modal').close();
 if(button.dataset.filter){shopFilter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b===button));renderShop();}
 if(button.id==='confirm-purchase'){
  const id=purchaseId;if(purchase(game,id,true)){save();$('#modal').close();select(id);toast(`${pet().name} is home. Simulated purchase complete — no charge.`);}
 }
});
document.addEventListener('keydown',event=>{
 if(event.repeat||event.ctrlKey||event.metaKey||event.altKey||$('#modal').open||['INPUT','TEXTAREA'].includes(event.target.tagName))return;
 if(event.key==='Escape'&&playing){stopPlay();return;}
 if(currentView==='room'&&!playing&&['1','2','3','4'].includes(event.key)){event.preventDefault();performCare(ACTIONS[Number(event.key)-1]);}
});
$('#needs-list').innerHTML=ACTIONS.map(key=>`<div class="need-row need-${key}">${icon(needMeta[key].icon)}<div><div class="need-label"><span>${needMeta[key].name}</span><b id="need-value-${key}"></b></div><div class="meter" id="need-meter-${key}" role="progressbar" aria-label="${needMeta[key].name}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="need-bar-${key}"></span></div></div></div>`).join('');
render();$('#pet-speech').textContent=defaultSpeech();save();
setInterval(()=>{if(document.hidden)return;advance(game);updateStats();save();},10000);
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopPlay(false);save();}else{advance(game);render();save();}});
window.addEventListener('pagehide',save);
