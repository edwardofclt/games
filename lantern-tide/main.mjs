import * as T from './vendor/three.module.js';
import {createWorld,makeWater,makeCharacter,orb,box,cylinder,material} from './art.mjs';
import {SAVE_KEY,newProgress,readProgress,objective,canEnterGarden,collectSpark,insidePolygon,SPARKS} from './rules.mjs';

const $=id=>document.getElementById(id),canvas=$('world');
const show=(id,visible=true)=>$(id).classList.toggle('hidden',!visible);
let renderer;
try{renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(e){show('loading',false);show('error');throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.outputColorSpace=T.SRGBColorSpace;
const scene=new T.Scene();scene.background=new T.Color(0x76b4b4);scene.fog=new T.FogExp2(0x93bbb1,.0065);
scene.add(new T.HemisphereLight(0xfff0dc,0x5f8580,1.3));scene.add(new T.AmbientLight(0xfff3df,.12));
const sun=new T.DirectionalLight(0xffe3b0,2.8);sun.position.set(-15,27,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-33;sun.shadow.camera.right=33;sun.shadow.camera.top=33;sun.shadow.camera.bottom=-33;sun.shadow.camera.near=.5;sun.shadow.camera.far=85;sun.shadow.bias=-.00035;sun.shadow.normalBias=.055;sun.shadow.radius=3;scene.add(sun);scene.add(sun.target);
const fill=new T.DirectionalLight(0xc2e5ef,.65);fill.position.set(18,12,-18);scene.add(fill);
// A locally generated studio environment gives the rounded props soft highlights.
const envCanvas=document.createElement('canvas');envCanvas.width=512;envCanvas.height=256;const ec=envCanvas.getContext('2d');const gradient=ec.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#a2c9cd');gradient.addColorStop(.45,'#f8edcf');gradient.addColorStop(.65,'#c1cdb0');gradient.addColorStop(1,'#789782');ec.fillStyle=gradient;ec.fillRect(0,0,512,256);ec.fillStyle='#fff4da';ec.fillRect(60,40,80,60);const env=new T.CanvasTexture(envCanvas);env.mapping=T.EquirectangularReflectionMapping;env.colorSpace=T.SRGBColorSpace;const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromEquirectangular(env).texture;scene.environmentIntensity=.32;env.dispose();pmrem.dispose();
const camera=new T.PerspectiveCamera(35,1,.1,250);const cameraLook=new T.Vector3(0,0,1),cameraOffset=new T.Vector3(13,20,23);
const world=createWorld(scene),water=makeWater(scene);
const hero=makeCharacter(scene);hero.root.position.set(0,0,4);
const mira=makeCharacter(world.harbor,{coat:0xd6bc86,hair:0x854d36,scarf:0x4d8d8b,npc:true});mira.root.position.set(2.2,0,3.2);mira.root.rotation.y=-.45;
const fisherman=makeCharacter(world.harbor,{coat:0x688e8d,hair:0xd1c7ad,scarf:0xb68351,npc:true});fisherman.root.position.set(-10,0,7.4);fisherman.root.rotation.y=.8;
// Soft contact shadows anchor the characters even between directional-shadow texels.
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=64;shadowCanvas.height=64;const sc=shadowCanvas.getContext('2d'),sg=sc.createRadialGradient(32,32,0,32,32,32);sg.addColorStop(0,'rgba(35,53,38,.35)');sg.addColorStop(1,'rgba(35,53,38,0)');sc.fillStyle=sg;sc.fillRect(0,0,64,64);const shadowMat=new T.MeshBasicMaterial({map:new T.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false});for(const person of [hero,mira,fisherman]){const shadow=new T.Mesh(new T.PlaneGeometry(1.6,1.3),shadowMat);shadow.rotation.x=-Math.PI/2;shadow.position.y=.12;person.root.add(shadow);}
const blade=new T.Group();box(blade,.11,.88,.07,0xd8e5d4,0,-.75,.05,.025);box(blade,.43,.1,.13,0xd8b16c,0,-.29,.05,.02);box(blade,.1,.24,.1,0x7b6042,0,-.13,.05,.02);blade.rotation.x=-.25;hero.arms[0].add(blade);blade.visible=false;
const slashMat=new T.MeshBasicMaterial({color:0xffedb1,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false});const slash=new T.Mesh(new T.RingGeometry(.9,1.35,24,1,-.4,2.3),slashMat);slash.rotation.x=-Math.PI/2;scene.add(slash);
const clickRing=new T.Mesh(new T.RingGeometry(.18,.23,24),new T.MeshBasicMaterial({color:0xffefbf,transparent:true,opacity:.65,depthWrite:false}));clickRing.rotation.x=-Math.PI/2;clickRing.position.y=.13;scene.add(clickRing);clickRing.visible=false;
const particleGeo=new T.BufferGeometry(),particlePositions=new Float32Array(90*3),particleSeeds=[];for(let i=0;i<90;i++){particleSeeds.push(Math.random());particlePositions[i*3]=(Math.random()-.5)*45;particlePositions[i*3+1]=.7+Math.random()*5;particlePositions[i*3+2]=(Math.random()-.5)*35;}particleGeo.setAttribute('position',new T.BufferAttribute(particlePositions,3));const particles=new T.Points(particleGeo,new T.PointsMaterial({color:0xffe6a1,size:.065,transparent:true,opacity:.62,depthWrite:false}));scene.add(particles);

// A restrained tilt-shift pass softens only the far edges of the miniature.
const target=new T.WebGLRenderTarget(1,1,{samples:4,depthBuffer:true});
const postScene=new T.Scene(),postCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);
const postMat=new T.ShaderMaterial({uniforms:{image:{value:target.texture},resolution:{value:new T.Vector2(1,1)},blur:{value:.65}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`
varying vec2 vUv;
uniform sampler2D image;
uniform vec2 resolution;
uniform float blur;
void main(){
  float edge=smoothstep(.16,.50,abs(vUv.y-.49));
  vec2 d=vec2(1.)/resolution*edge*blur*2.4;
  vec3 c=texture2D(image,vUv).rgb*.28;
  c+=(texture2D(image,vUv+vec2(d.x,0.)).rgb+texture2D(image,vUv-vec2(d.x,0.)).rgb)*.15;
  c+=(texture2D(image,vUv+vec2(0.,d.y)).rgb+texture2D(image,vUv-vec2(0.,d.y)).rgb)*.15;
  c+=(texture2D(image,vUv+d).rgb+texture2D(image,vUv-d).rgb)*.06;
  float vignette=smoothstep(.28,.83,distance(vUv,vec2(.5,.48)));
  c*=1.-vignette*.14;
  float luma=dot(c,vec3(.2126,.7152,.0722));
  c=mix(vec3(luma),c,1.1);
  gl_FragColor=vec4(c,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`});postScene.add(new T.Mesh(new T.PlaneGeometry(2,2),postMat));

let progress=newProgress(),saved=null;try{saved=localStorage.getItem(SAVE_KEY);}catch{}if(saved)show('continue');
let started=false,paused=false,dialogue=null,time=0,last=performance.now(),walk=0,attackTime=0,rollTime=0,rollCooldown=0,hurtTime=0,hearts=5,toastUntil=0,destination=null,pendingClick=false,questFinal=false;
let bossHealth=4,bossPhase='sleep',bossClock=0,bossDirection=new T.Vector2(),bossHitCooldown=0;
const keys=new Set(),touchKeys=new Set();const right=new T.Vector3(28,0,-16).normalize(),forward=new T.Vector3(-16,0,-28).normalize();const currentPosition=()=>({x:hero.root.position.x-(progress.area==='garden'?80:0),z:hero.root.position.z});
const sound={enabled:false,context:null,gain:null,nextNote:0};
const melody=[0,7,12,9,4,7,2,9,12,7,4,2,0,7,11,14];
function audioInit(){if(!sound.context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;sound.context=new Audio();sound.gain=sound.context.createGain();sound.gain.gain.value=.18;sound.gain.connect(sound.context.destination);}sound.context.resume();return true;}
function note(freq,duration=.4,volume=.15,type='sine',delay=0){if(!sound.enabled||!sound.context)return;const ctx=sound.context,o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+delay;o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(sound.gain);o.start(t);o.stop(t+duration+.05);}
function chime(){[523.25,659.25,783.99].forEach((f,i)=>note(f,.85,.22,'sine',i*.1));}
function toggleSound(){if(!audioInit()){toast('Audio is not available in this browser.');return;}sound.enabled=!sound.enabled;sound.gain.gain.value=sound.enabled?.18:0;$('sound').setAttribute('aria-label',sound.enabled?'Turn sound off':'Turn sound on');$('sound').querySelector('.off-dot').classList.toggle('hidden',sound.enabled);}
function save(){const p=currentPosition();progress.position=p;try{localStorage.setItem(SAVE_KEY,JSON.stringify(progress));}catch{}}
function refresh(){
  $('quest-text').textContent=objective(progress);$('spark-count').textContent=`${progress.sparks.length} / 3`;$('shell-count').textContent=progress.shells.length+(progress.bellReturned?5:0);blade.visible=progress.sword;
  for(const s of world.sparks)s.root.visible=!progress.sparks.includes(s.id);for(const s of world.shells)s.root.visible=!progress.shells.includes(s.id);world.bell.visible=!progress.bell;
  world.gateSeal.visible=!progress.gate;world.lid.rotation.x=progress.sword?-.9:0;world.lid.position.z=progress.sword?-.17:0;
  for(const r of world.runes)r.fire.visible=progress.runes.includes(r.id);world.guardian.visible=!progress.guardian;world.beaconFire.visible=progress.beacon;
  $('hearts').textContent=Array.from({length:5},(_,i)=>i<hearts?'♥':'♡').join(' ');$('hearts').setAttribute('aria-label',`${hearts} of 5 hearts`);
}
function toast(message){$('toast').textContent=message;show('toast');toastUntil=time+3.8;}
function say(speaker,lines,onFinish){dialogue={speaker,lines,index:0,onFinish};$('speaker').textContent=speaker;$('portrait').textContent=speaker[0];$('dialogue-text').textContent=lines[0];show('dialogue');show('prompt',false);destination=null;keys.clear();touchKeys.clear();$('dialogue-next').focus({preventScroll:true});}
function nextDialogue(){if(!dialogue)return;dialogue.index++;if(dialogue.index<dialogue.lines.length){$('dialogue-text').textContent=dialogue.lines[dialogue.index];note(550,.1,.1);}else{const done=dialogue.onFinish;dialogue=null;show('dialogue',false);done?.();canvas.focus();}}
function setArea(area,position){progress.area=area;world.harbor.visible=area==='harbor';world.garden.visible=area==='garden';const offset=area==='garden'?80:0;hero.root.position.set(offset+position.x,.14,position.z);destination=null;clickRing.visible=false;cameraLook.copy(hero.root.position);sun.position.set(offset-15,27,9);sun.target.position.set(offset,0,0);particles.position.x=offset;water.foam.visible=area==='harbor';mira.root.visible=area==='harbor';fisherman.root.visible=area==='harbor';$('location-name').textContent=area==='harbor'?'Brindle Harbor':'Rootbound Garden';$('region-label').textContent=area==='harbor'?'VESPER ISLAND':'THE FIRST SANCTUARY';$('location-subtitle').textContent=area==='harbor'?'Where the sunset stays.':'Even stone remembers the light.';refresh();save();}
function begin(continuing=false){progress=continuing?readProgress(saved):newProgress();hearts=5;started=true;paused=false;show('title-screen',false);for(const id of ['hud','quest','location','keyboard-help','touch'])show(id);setArea(progress.area,progress.position);bossHealth=4;bossPhase=progress.runes.length===3?'stalk':'sleep';canvas.tabIndex=0;canvas.focus();if(!continuing)say('WICK',['You made it. Another moment and the tide would have taken your name.','Mira found your satchel. She’s by the path to the pier. Oh—and that light in your hand? Try not to lose it.']);else toast('Your little light is right where you left it.');}
function modal({eyebrow='TAKE A BREATH',title='The tide can wait.',body='',buttons=[]}){paused=true;keys.clear();touchKeys.clear();destination=null;$('modal-eyebrow').textContent=eyebrow;$('modal-title').textContent=title;$('modal-body').innerHTML=body;$('modal-actions').replaceChildren();for(const [label,fn,secondary]of buttons){const b=document.createElement('button');b.className=secondary?'secondary-button':'primary-button';b.textContent=label;b.addEventListener('click',fn);$('modal-actions').append(b);}show('modal-shade');$('modal-actions').querySelector('button')?.focus();}
function closeModal(){show('modal-shade',false);paused=false;canvas.focus();}
function pause(){if(!started||dialogue)return;if(paused){closeModal();return;}save();modal({body:'<p>Your progress is saved in this browser.</p><p><kbd>WASD / ↑ ↓ ← →</kbd> Move &nbsp; <kbd>E</kbd> Talk / use<br><kbd>Space</kbd> Sword &nbsp; <kbd>Shift</kbd> Roll<br>Click or tap the ground to walk there.</p>',buttons:[['Return to the island',closeModal],['Start a new journey',()=>modal({title:'A fresh beginning?',body:'<p>This replaces your saved progress for this prototype.</p>',buttons:[['Keep my journey',closeModal],['Start again',()=>{closeModal();begin(false);},true]]}),true]]});}
function journal(){if(!started||dialogue)return;if(paused){closeModal();return;}modal({eyebrow:'AREN’S FIELD NOTES',title:'A little light.',body:`<p><b>${objective(progress)}</b></p><p>Mira marked three places: the orchard west of the well, the old well’s northern path, and the shore beside the pier.</p><p>A courier’s blade rests in the workshop chest east of the village. The garden gate is northeast, below the lighthouse’s distant glow.</p><p><b>The fisherman’s bell</b><br>${progress.bellReturned?'Returned. Some things deserve to be remembered.':progress.bell?'You found a little brass bell. The fisherman southwest of Mira might recognize it.':'A little brass bell was lost near the western shore. Its owner waits southwest of Mira.'}</p><p><b>In your satchel</b><br>${progress.sparks.length} lantern sparks · ${progress.shells.length} shells${progress.sword?' · courier’s blade':''}</p><p>This playable opening is a visual prototype of the larger Vesper Island story.</p>`,buttons:[['Back to the adventure',closeModal]]});}
function nearby(){const p=currentPosition(),items=[];const add=(id,x,z,label,r=2)=>{const d=Math.hypot(p.x-x,p.z-z);if(d<r)items.push({id,x,z,label,d});};
  if(progress.area==='harbor'){
    add('mira',2.2,3.2,'Talk to Mira');add('fisherman',-10,7.4,'Talk to the fisherman');if(!progress.sword)add('chest',7.8,-1.5,'Open the courier’s chest');
    for(const s of SPARKS)if(!progress.sparks.includes(s.id))add(`spark:${s.id}`,s.x,s.z,progress.metMira?'Gather lantern spark':'Examine the little light',1.7);
    add('gate',10.5,-8.4,progress.gate?'Enter the garden':'Examine the garden seal',2.3);if(!progress.bell)add('bell',-15.9,3.1,'Pick up the brass bell',1.6);
  }else{
    add('exit',0,8.6,'Return to Brindle Harbor',2);for(const r of world.runes)if(!progress.runes.includes(r.id))add(`rune:${r.id}`,r.x,r.z,'Light the brazier',1.9);
    if(progress.guardian)add('beacon',0,-7.3,progress.beacon?'Rest at the beacon':'Restore the garden beacon',2.2);
  }return items.sort((a,b)=>a.d-b.d)[0];
}
function interact(){if(!started||paused)return;if(dialogue){nextDialogue();return;}const item=nearby();if(!item){toast('Follow the paths. There is always someone—or something—to find.');return;}
  if(item.id==='mira'){
    if(progress.beacon){say('MIRA',['Look at that. For the first time in my life, the lighthouse has company.','A garden beacon today. A way beyond the tide tomorrow. Stay a little longer, Aren. We have boats to build.'],()=>{if(!questFinal){questFinal=true;modal({eyebrow:'THE FIRST LIGHT',title:'A beginning, beautifully small.',body:'<p>You restored the Rootbound Garden and brought a little hope back to Brindle Harbor.</p><p>This is the end of the playable slice. The harbor remains yours to explore. Find the fisherman’s bell, gather shells, or just spend a moment by the water.</p>',buttons:[['Stay a little longer',closeModal]]});}});}
    else if(!progress.metMira){progress.metMira=true;say('MIRA',['You’re awake! I was beginning to think the sea had kept the better half of you.','That lantern belonged to the old keepers. Its sparks drifted toward the orchard, the well, and the shore by my pier.','Gather all three, then try the garden gate to the northeast. And take your blade from the chest by my workshop. Even the flowers have teeth these days.']);refresh();save();}
    else{hearts=5;refresh();say('MIRA',[progress.sparks.length<3?'The orchard, the old well, and the shore by the pier. Look for little pieces of sunlight.':progress.gate?'The garden lies just beyond that stone arch. Don’t forget the blade by my workshop.':'Three sparks! Take them to the stone arch in the northeast. I’ll keep the harbor light burning for you.']);}
  }else if(item.id==='fisherman'){
    if(progress.bell&&!progress.bellReturned){progress.bellReturned=true;chime();say('ORIN',['My bell. I tied it to her boat so I’d hear her coming home.','I’d forgotten the sound. Somehow, I’d almost forgotten her. Thank you for bringing a little of her back.'],()=>toast('Side quest complete · The Fisherman’s Bell · +5 shells'));refresh();save();}
    else say('ORIN',[progress.bellReturned?'I can hear it now, even over the water. Funny how a little thing can carry so much.':'Lost a little brass bell west of here, near the old trees. If you hear it, would you bring it back?']);
  }else if(item.id==='chest'){progress.sword=true;chime();say('WICK',['Your courier’s blade. A little weathered. Still wonderfully sharp.','Press Space to swing. Shift lets you roll away from trouble. The garden’s old guardian will wake when all three braziers are lit.']);refresh();save();}
  else if(item.id.startsWith('spark:')){if(!progress.metMira){say('WICK',['A little piece of dawn. Let’s ask Mira what became of the others.']);return;}if(collectSpark(progress,item.id.split(':')[1])){chime();toast(progress.sparks.length===3?'Three sparks gathered · The garden seal is ready.':`A lantern spark found · ${progress.sparks.length} of 3`);refresh();save();}}
  else if(item.id==='gate'){
    if(progress.gate){setArea('garden',{x:0,z:7.5});toast('Rootbound Garden · Light the three braziers.');}
    else if(canEnterGarden(progress)){progress.gate=true;chime();refresh();save();say('WICK',['The stone remembers you, Dawnmarked. Or perhaps it remembers someone with a hand just like yours.','The seal is open. Inside, three cold braziers are waiting for your lantern.']);}
    else say('WICK',['Three scattered sparks will open this seal. Mira knows where the light wandered.']);
  }else if(item.id==='bell'){progress.bell=true;chime();toast('A little brass bell · Someone must be missing this.');refresh();save();}
  else if(item.id==='exit'){setArea('harbor',{x:10.5,z:-7.5});}
  else if(item.id.startsWith('rune:')){if(!progress.sword){say('WICK',['Something is stirring here. Find your blade in Mira’s workshop chest before waking the guardian.']);return;}const id=Number(item.id.split(':')[1]);progress.runes.push(id);chime();refresh();save();if(progress.runes.length===3){bossPhase='stalk';bossClock=0;toast('The guardian wakes · Roll aside when its eyes turn red.');}else toast(`Brazier lit · ${progress.runes.length} of 3`);}
  else if(item.id==='beacon'){if(progress.beacon){hearts=5;refresh();toast('A warm place to rest.');}else{progress.beacon=true;hearts=5;chime();refresh();save();say('WICK',['There. A little morning, after all this time.','Mira should see this. Let’s go back to the harbor.']);}}
}
function attack(){if(!started||paused)return;if(dialogue){nextDialogue();return;}if(!progress.sword){toast('Your blade is in the chest east of Mira’s workshop.');return;}if(attackTime>0||rollTime>0)return;attackTime=.37;note(170,.15,.12,'triangle');
  if(progress.area==='garden'&&!progress.guardian&&progress.runes.length===3&&bossHitCooldown<=0){const p=currentPosition(),g=world.guardian.position;if(Math.hypot(p.x-g.x,p.z-g.z)<2.55&&bossPhase==='rest'){bossHealth--;bossHitCooldown=.45;world.core.material.emissiveIntensity=3;chime();if(bossHealth<=0){progress.guardian=true;bossPhase='dead';refresh();save();toast('The roots loosen their hold · Light the beacon.');}else toast(`The guardian falters · ${bossHealth} strikes remain`);}}
}
function roll(){if(!started||paused||dialogue||rollCooldown>0)return;rollTime=.42;rollCooldown=.95;note(260,.15,.08,'triangle');}
function blocked(x,z){const offset=progress.area==='garden'?80:0,lx=x-offset;const cs=progress.area==='garden'?world.gardenColliders:world.colliders;if(progress.area==='garden'){if(lx< -7.7||lx>7.7||z< -9||z>9.3)return true;}else{const onPier=lx>8.45&&lx<11.15&&z>8.8&&z<16.45;if(!insidePolygon(lx,z)&&!onPier)return true;}
  return cs.some(c=>c.r?Math.hypot(lx-c.x,z-c.z)<c.r+.3:Math.abs(lx-c.x)<c.w/2+.28&&Math.abs(z-c.z)<c.d/2+.28);
}
function damage(){if(hurtTime>0||rollTime>0)return;hearts--;hurtTime=1.5;note(110,.23,.2,'triangle');if(hearts<=0){hearts=5;setArea('garden',{x:0,z:7.7});bossHealth=4;bossPhase=progress.runes.length===3?'stalk':'sleep';world.guardian.position.set(0,0,-.6);toast('The lantern brings you back · Wait for the guardian to tire before striking.');}refresh();}
function updateBoss(dt){if(progress.area!=='garden'||progress.guardian||progress.runes.length<3)return;bossClock+=dt;bossHitCooldown=Math.max(0,bossHitCooldown-dt);const g=world.guardian,p=currentPosition(),dx=p.x-g.position.x,dz=p.z-g.position.z,dist=Math.hypot(dx,dz);g.rotation.y=Math.atan2(dx,dz);world.core.material.emissiveIntensity=T.MathUtils.lerp(world.core.material.emissiveIntensity,.5,dt*4);
  if(bossPhase==='stalk'){if(dist>2.3){g.position.x+=dx/dist*dt*1.1;g.position.z+=dz/dist*dt*1.1;}if(bossClock>2.3){bossPhase='warn';bossClock=0;bossDirection.set(dx,dz).normalize();}}
  else if(bossPhase==='warn'){world.core.material.color.setHex(0xe3885b);g.scale.setScalar(1+Math.sin(bossClock*25)*.025);if(bossClock>.9){bossPhase='charge';bossClock=0;g.scale.setScalar(1);}}
  else if(bossPhase==='charge'){g.position.x=T.MathUtils.clamp(g.position.x+bossDirection.x*dt*8,-6.8,6.8);g.position.z=T.MathUtils.clamp(g.position.z+bossDirection.y*dt*8,-7,7);if(bossClock>.65){bossPhase='rest';bossClock=0;world.core.material.color.setHex(0x8ce3bc);toast('Its light is exposed · Move close and strike!');}}
  else if(bossPhase==='rest'){g.rotation.z=Math.sin(time*5)*.04;if(bossClock>3.4){bossPhase='stalk';bossClock=0;g.rotation.z=0;world.core.material.color.setHex(0x5bc1ad);}}
  if(dist<1.65&&bossPhase!=='rest')damage();
}
function update(dt){
  time+=dt;water.uniforms.time.value=time;water.foam.scale.setScalar(1+Math.sin(time*.8)*.003);for(const a of world.animated){a.root.position.y=a.baseY+Math.sin(time*1.5)*.055;a.root.rotation.z=Math.sin(time*.8)*.028;}
  for(const s of world.sparks){s.root.position.y=.75+Math.sin(time*2+s.x)*.12;s.root.rotation.y=time*.65;}world.bell.rotation.y=Math.sin(time)*.15;
  for(const r of world.runes)r.fire.scale.set(.7*(1+Math.sin(time*8+r.id)*.08),.7*(1+Math.sin(time*11)*.09),.7);world.beaconFire.scale.y=1.2*(1+Math.sin(time*9)*.08);
  mira.head.rotation.y=Math.sin(time*.5)*.08;fisherman.head.rotation.x=Math.sin(time*.7)*.04;
  const pp=particleGeo.attributes.position;for(let i=0;i<90;i++){pp.array[i*3+1]+=(.03+particleSeeds[i]*.06)*dt;if(pp.array[i*3+1]>6)pp.array[i*3+1]=.6;}pp.needsUpdate=true;
  if(toastUntil&&time>toastUntil){show('toast',false);toastUntil=0;}
  if(sound.enabled&&sound.context&&started&&!paused&&time>sound.nextNote){sound.nextNote=time+.66;const n=melody[Math.floor(time/.66)%melody.length];note(261.63*2**(n/12),1.7,.12);if(Math.floor(time/.66)%4===0)note(130.81,2,.07);}
  if(!started){const t=time*.035;cameraLook.set(1.2,0,-.2);camera.position.set(29+Math.sin(t)*2,29,34+Math.cos(t)*2);camera.lookAt(cameraLook);return;}
  if(!paused&&!dialogue){
    hurtTime=Math.max(0,hurtTime-dt);rollCooldown=Math.max(0,rollCooldown-dt);rollTime=Math.max(0,rollTime-dt);attackTime=Math.max(0,attackTime-dt);
    let mx=0,mz=0;const has=k=>keys.has(k)||touchKeys.has(k);if(has('w')||has('arrowup'))mz++;if(has('s')||has('arrowdown'))mz--;if(has('d')||has('arrowright'))mx++;if(has('a')||has('arrowleft'))mx--;
    const movement=new T.Vector3().addScaledVector(right,mx).addScaledVector(forward,mz);if(destination&&!mx&&!mz){movement.copy(destination).sub(hero.root.position);movement.y=0;if(movement.length()<.35){destination=null;clickRing.visible=false;if(pendingClick){pendingClick=false;interact();}movement.set(0,0,0);}}
    const moving=movement.lengthSq()>.005;let speed=5.1;if(rollTime>0){speed=10;if(!moving)movement.set(Math.sin(hero.root.rotation.y),0,Math.cos(hero.root.rotation.y));}
    if(movement.lengthSq()>0){movement.normalize();if(attackTime<=0){hero.root.rotation.y=angleLerp(hero.root.rotation.y,Math.atan2(movement.x,movement.z),Math.min(1,dt*15));const dx=movement.x*speed*dt,dz=movement.z*speed*dt;let moved=false;if(!blocked(hero.root.position.x+dx,hero.root.position.z)){hero.root.position.x+=dx;moved=true;}if(!blocked(hero.root.position.x,hero.root.position.z+dz)){hero.root.position.z+=dz;moved=true;}if(!moved&&destination){destination=null;clickRing.visible=false;}}}
    walk+=dt*(moving?12:2);hero.body.position.y=moving?Math.abs(Math.sin(walk))*.07:Math.sin(walk)*.018;hero.root.position.y=.14+(rollTime>0?Math.sin(rollTime/.42*Math.PI)*.27:0);hero.legs.forEach((leg,i)=>leg.rotation.x=moving?Math.sin(walk+i*Math.PI)*.55:0);hero.arms.forEach((arm,i)=>arm.rotation.x=moving?Math.sin(walk+(i+1)*Math.PI)*.3:0);hero.scarf.rotation.x=moving?-.3+Math.sin(walk)*.1:0;
    if(attackTime>0){const t=1-attackTime/.37;hero.arms[0].rotation.x=-1.2;hero.arms[0].rotation.z=Math.sin(t*Math.PI)*-1.8;slash.position.copy(hero.root.position);slash.position.y=.7;slash.rotation.z=-hero.root.rotation.y+Math.PI*.3;slashMat.opacity=Math.sin(t*Math.PI)*.6;}else{hero.arms[0].rotation.z=0;slashMat.opacity=0;}
    hero.root.visible=hurtTime<=0||Math.sin(time*35)>-.25;
    if(progress.area==='harbor'){const p=currentPosition();for(const s of world.shells)if(!progress.shells.includes(s.id)&&Math.hypot(p.x-s.x,p.z-s.z)<.65){progress.shells.push(s.id);note(880,.25,.15);refresh();save();}}
    updateBoss(dt);const n=nearby();if(n){$('prompt').querySelector('span').textContent=n.label;show('prompt');}else show('prompt',false);
  }else{show('prompt',false);hero.root.visible=true;}
  const desired=hero.root.position.clone();desired.y=.4;cameraLook.lerp(desired,1-Math.exp(-dt*4));const aspect=innerWidth/innerHeight;const scale=aspect<.85?1.28:1;camera.position.copy(cameraLook).addScaledVector(cameraOffset,scale);camera.lookAt(cameraLook);
}
function angleLerp(a,b,t){let d=(b-a+Math.PI)%(Math.PI*2)-Math.PI;if(d< -Math.PI)d+=Math.PI*2;return a+d*t;}
function resize(){const width=innerWidth,height=innerHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();const pr=renderer.getPixelRatio();target.setSize(width*pr,height*pr);postMat.uniforms.resolution.value.set(width*pr,height*pr);postMat.uniforms.blur.value=matchMedia('(prefers-reduced-motion: reduce)').matches?.35:.65;}
resize();addEventListener('resize',resize);
const raycaster=new T.Raycaster(),floor=new T.Plane(new T.Vector3(0,1,0),0);
canvas.addEventListener('pointerdown',e=>{if(!started||paused||dialogue)return;const rect=canvas.getBoundingClientRect(),ndc=new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(ndc,camera);const p=new T.Vector3();if(raycaster.ray.intersectPlane(floor,p)&&!blocked(p.x,p.z)){destination=p;clickRing.position.set(p.x,.14,p.z);clickRing.visible=true;pendingClick=true;}});
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright','tab'].includes(k)&&started&&k!=='tab')e.preventDefault();if(e.repeat){if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k))keys.add(k);return;}if(k==='escape'){if(dialogue)nextDialogue();else pause();}else if(k==='q')journal();else if(k==='e')interact();else if(k===' '||k==='j')attack();else if(k==='shift'||k==='k')roll();else if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){keys.add(k);destination=null;clickRing.visible=false;}});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function releaseInputs(){keys.clear();touchKeys.clear();for(const b of document.querySelectorAll('.pressed'))b.classList.remove('pressed');}
addEventListener('blur',()=>{releaseInputs();if(started&&!paused&&!dialogue)pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){releaseInputs();if(started)save();if(started&&!paused&&!dialogue)pause();if(sound.context)sound.context.suspend();}else if(sound.enabled)sound.context?.resume();});
for(const b of document.querySelectorAll('[data-move]')){const k={up:'w',down:'s',left:'a',right:'d'}[b.dataset.move];b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);touchKeys.add(k);b.classList.add('pressed');destination=null;});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>{touchKeys.delete(k);b.classList.remove('pressed');});}
for(const [id,fn]of [['touch-interact',interact],['touch-sword',attack],['touch-roll',roll]]){$(id).addEventListener('pointerdown',e=>{e.preventDefault();fn();});}
$('begin').addEventListener('click',()=>{if(saved)modal({title:'Begin again?',body:'<p>A journey is already saved in this browser. Starting again replaces it.</p>',buttons:[['Continue my journey',()=>{closeModal();begin(true);}],['Begin a new journey',()=>{closeModal();begin(false);},true]]});else begin(false);});
$('continue').addEventListener('click',()=>begin(true));$('sound').addEventListener('click',toggleSound);$('pause-button').addEventListener('click',pause);$('journal-button').addEventListener('click',journal);$('dialogue-next').addEventListener('click',nextDialogue);$('prompt').addEventListener('click',interact);
let saveTimer=0;function frame(now){const dt=Math.min((now-last)/1000,.045);last=now;update(dt);saveTimer+=dt;if(started&&!paused&&saveTimer>3){saveTimer=0;save();}renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(postScene,postCamera);requestAnimationFrame(frame);}
// The opt-in harness provides deterministic inspection without affecting normal play.
if(new URLSearchParams(location.search).has('test'))window.__lantern={get state(){return {progress:structuredClone(progress),position:currentPosition(),hearts,bossHealth,bossPhase,bossClock,guardianPosition:{x:world.guardian.position.x,z:world.guardian.position.z},dialogue:!!dialogue,started,paused,drawCalls:renderer.info.render.calls};},teleport(x,z){hero.root.position.set(x+(progress.area==='garden'?80:0),.14,z);destination=null;},interact,attack,roll,closeDialogue(){while(dialogue)nextDialogue();},step(seconds){for(let t=0;t<seconds;t+=1/60)update(1/60);},blocked,begin,refresh,save,setArea};
refresh();update(0);requestAnimationFrame(frame);show('loading',false);show('title-screen');
