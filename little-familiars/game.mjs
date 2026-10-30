export const CATALOG = [
 {id:'cat',species:'Cat',name:'Mochi',kind:1,tag:'CURIOUS LITTLE SOUL',description:'A little moonbeam with a very big purr.',free:true,color:'#7bdacb'},
 {id:'dog',species:'Dog',name:'Biscuit',kind:0,tag:'YOUR LOYAL SIDEKICK',description:'Small paws. Unreasonably big love.',free:true,color:'#efc38b'},
 {id:'hamster',species:'Hamster',name:'Pebble',kind:2,tag:'POCKET-SIZED JOY',description:'A tiny friend with room for one more snack.',free:true,color:'#e9bb90'},
 {id:'bunny',species:'Moon Bunny',name:'Clover',kind:3,tag:'GENTLE DAYDREAMER',description:'Soft ears and a heart full of stardust.',price:'$1.99',color:'#c3a7f3'},
 {id:'fox',species:'Ember Fox',name:'Maple',kind:4,tag:'A SPARK OF MISCHIEF',description:'A woodland wanderer looking for a home.',price:'$2.99',color:'#edaa7c'},
 {id:'dragon',species:'Cloud Dragon',name:'Nimbus',kind:5,tag:'A LITTLE EXTRA MAGIC',description:'Big dreams, tiny wings, and warm cuddles.',price:'$3.99',color:'#bca4ed'},
 {id:'shiba',species:'Honey Dog',name:'Honey',kind:0,variation:true,tag:'GOLDEN-HOUR COMPANION',description:'Our loyal puppy in a warm honey coat.',price:'$0.99',color:'#e9b66f'},
 {id:'silvercat',species:'Twilight Cat',name:'Luna',kind:1,variation:true,tag:'A TWILIGHT TREASURE',description:'A dreamy violet variation of our little cat.',price:'$0.99',color:'#c3a5ed'},
 {id:'snowhamster',species:'Snow Hamster',name:'Snowdrop',kind:2,variation:true,tag:'A WINTER LITTLE WONDER',description:'A cool, pale coat for a tiny companion.',price:'$0.99',color:'#aedbe1'}
];
export const ACTIONS=['food','water','clean','play'];
const validId=id=>CATALOG.some(p=>p.id===id);
const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,n));
const freshPet=item=>({name:item.name,needs:{food:62,water:48,clean:73,play:55},xp:0,bond:0,round:[],lastPet:0,interactions:0});
export function createGame(now=Date.now()) {
 return {version:1,active:'cat',owned:CATALOG.filter(p=>p.free).map(p=>p.id),pets:Object.fromEntries(CATALOG.filter(p=>p.free).map(p=>[p.id,freshPet(p)])),updated:now,sound:false};
}
/** Growth pacing hook: action is a care key; completed is this round's care keys.
 * Returns growth points. A balanced round should feel better than repeating care.
 * TODO (optional tuning): replace these 5 lines to shape the game's growth pace.
 */
export function growthReward(action,completed) {
 const unique=new Set(completed);
 unique.add(action);
 const balanced=unique.size===4;
 const base=10;
 return base+(balanced?20:0);
}
export function stage(p) { return p.xp>=180?'Grown companion':p.xp>=60?'Youngster':'Baby'; }
export function care(g,action) {
 if(!ACTIONS.includes(action)) return {ok:false};
 const p=g.pets[g.active];
 if(p.needs[action]>=92) return {ok:false,full:true};
 const before=stage(p); const gain=growthReward(action,p.round);
 p.needs[action]=clamp(p.needs[action]+30);p.bond=clamp(p.bond+4);p.xp=Math.min(10000,p.xp+gain);p.interactions++;
 p.round=[...new Set([...p.round,action])];const balanced=p.round.length===4;
 if(balanced)p.round=[];
 return {ok:true,gain,balanced,grew:stage(p)!==before};
}
export function petCompanion(g,now=Date.now()) {
 const p=g.pets[g.active];
 if(p.lastPet&&now-p.lastPet<30000)return false;
 p.lastPet=now;p.bond=clamp(p.bond+2);p.interactions++;return true;
}
export function adopt(g,id) {
 if(!validId(id)||!g.owned.includes(id))return false;
 g.active=id;return true;
}
export function purchase(g,id,confirmed=false) {
 if(!confirmed||!validId(id)||g.owned.includes(id))return false;
 const item=CATALOG.find(p=>p.id===id);g.owned.push(id);g.pets[id]=freshPet(item);return true;
}
export function advance(g,now=Date.now()) {
 if(now<=g.updated)return;
 const minutes=Math.min((now-g.updated)/60000,20);
 for(const p of Object.values(g.pets)) for(const key of ACTIONS)p.needs[key]=clamp(p.needs[key]-minutes*1.5,20);
 g.updated=now;
}
export function restore(raw,now=Date.now()) {
 const fresh=createGame(now);
 try {
  const data=JSON.parse(raw);if(data?.version!==1)return fresh;
  for(const item of CATALOG) {
   if(!item.free&&!data.owned?.includes?.(item.id))continue;
   const p=data.pets?.[item.id];
   if(!p||!ACTIONS.every(key=>Number.isFinite(p.needs?.[key])&&p.needs[key]>=0&&p.needs[key]<=100)||!Number.isFinite(p.xp)||p.xp<0||!Number.isFinite(p.bond)||p.bond<0)continue;
   if(!fresh.owned.includes(item.id))fresh.owned.push(item.id);
   fresh.pets[item.id]={name:typeof p.name==='string'&&p.name.trim()?p.name.trim().slice(0,20):item.name,needs:{...p.needs},xp:clamp(p.xp,0,10000),bond:clamp(p.bond),round:Array.isArray(p.round)?[...new Set(p.round.filter(a=>ACTIONS.includes(a)))].slice(0,3):[],lastPet:Number.isFinite(p.lastPet)?Math.min(p.lastPet,now):0,interactions:Number.isFinite(p.interactions)?clamp(p.interactions,0,100000):0};
  }
  if(fresh.owned.includes(data.active))fresh.active=data.active;
  fresh.sound=data.sound===true;
  fresh.updated=Number.isFinite(data.updated)?Math.min(data.updated,now):now;
  advance(fresh,now);return fresh;
 }catch{return fresh;}
}
