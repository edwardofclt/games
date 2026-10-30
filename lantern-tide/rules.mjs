// Shared game rules stay independent of rendering so quest/save behavior is testable.
export const SAVE_KEY = 'lantern-tide.brindle.v1';
export const SPARKS = [{id:'orchard',x:-9,z:-7},{id:'shore',x:10,z:6.5},{id:'well',x:0,z:-7.5}];
export const SHORE = [[-23,3],[-21,8],[-18,11],[-12,12],[-9,14],[-5,14],[-2,12],[3,12],[5,10],[11,10],[15,7],[18,6],[20,2],[18,-2],[20,-8],[16,-13],[11,-15],[6,-14],[1,-17],[-5,-16],[-9,-18],[-14,-15],[-17,-10],[-21,-7],[-20,-1]];
export function insidePolygon(x,z,polygon=SHORE){let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const [a,b]=polygon[i],[c,d]=polygon[j];if(((b>z)!==(d>z))&&(x<(c-a)*(z-b)/(d-b)+a))inside=!inside;}return inside;}
export function newProgress(){return {version:1,metMira:false,sparks:[],sword:false,gate:false,runes:[],guardian:false,beacon:false,bell:false,bellReturned:false,shells:[],area:'harbor',position:{x:0,z:4}};}
export function readProgress(raw){
  const base=newProgress();
  try{const s=typeof raw==='string'?JSON.parse(raw):raw;if(!s||s.version!==1)return base;
    for(const k of ['metMira','sword','gate','guardian','beacon','bell','bellReturned'])base[k]=s[k]===true;
    base.sparks=[...new Set(Array.isArray(s.sparks)?s.sparks.filter(x=>SPARKS.some(v=>v.id===x)):[])];
    base.runes=[...new Set(Array.isArray(s.runes)?s.runes.filter(x=>Number.isInteger(x)&&x>=0&&x<3):[])];
    base.shells=[...new Set(Array.isArray(s.shells)?s.shells.filter(x=>Number.isInteger(x)&&x>=0&&x<12):[])];
    // Later milestones imply their prerequisites, even for an interrupted save.
    if(base.beacon)base.guardian=true;
    if(base.guardian){base.runes=[0,1,2];base.sword=true;}
    if(base.gate||base.runes.length||base.guardian){base.gate=true;base.metMira=true;base.sparks=SPARKS.map(x=>x.id);}
    if(base.bellReturned)base.bell=true;
    if(s.area==='garden'&&base.gate)base.area='garden';
    const p=s.position;if(p&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&((base.area==='harbor'&&insidePolygon(p.x,p.z))||(base.area==='garden'&&p.x>=-8&&p.x<=8&&p.z>=-9&&p.z<=9)))base.position={x:p.x,z:p.z};
    else base.position=base.area==='garden'?{x:0,z:7}:{x:0,z:4};
  }catch{/* Blocked or malformed storage starts a safe, playable journey. */}return base;
}
export function objective(p){if(p.beacon)return 'The garden is alight. Return to Mira.';if(p.guardian)return 'Light the garden beacon.';if(p.area==='garden'){if(!p.sword)return 'Find the courier’s blade in the harbor.';if(p.runes.length<3)return `Light the three garden braziers. ${p.runes.length} / 3`;return 'Defeat the Rootbound Guardian.';}if(p.gate)return 'Enter the Rootbound Garden to the northeast.';if(!p.metMira)return 'Find Mira beside the harbor.';if(p.sparks.length<3)return `Find three lost lantern sparks. ${p.sparks.length} / 3`;return 'Bring the light to the garden gate.';}
export function canEnterGarden(p){return p.metMira&&p.sparks.length===3;}
export function collectSpark(p,id){if(!p.metMira||!SPARKS.some(s=>s.id===id)||p.sparks.includes(id))return false;p.sparks.push(id);return true;}
