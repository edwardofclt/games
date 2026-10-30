import * as T from './vendor/three.module.js';
import {RoundedBoxGeometry} from './vendor/RoundedBoxGeometry.js';
import {SHORE,SPARKS,insidePolygon} from './rules.mjs';

const palette={grass:0x83af59,grassLight:0xa4bd69,sand:0xe3c58f,earth:0xbb9873,wood:0x9f7150,woodDark:0x665044,cream:0xffebbf,stone:0xaaa998,leaf:0x3d8256,leafLight:0x63964e,teal:0x3c7675,orange:0xcf794c,gold:0xf5c67c};
const materials=new Map(),geometries=new Map();
export function material(color,roughness=.72,metalness=0){const k=[color,roughness,metalness].join();if(!materials.has(k))materials.set(k,new T.MeshStandardMaterial({color,roughness,metalness}));return materials.get(k);}
const sphereGeo=new T.SphereGeometry(1,16,12),cylinderGeo=new T.CylinderGeometry(1,1,1,16),grassGeo=new T.ConeGeometry(1,1,3),stoneGeo=new T.DodecahedronGeometry(1,0);
function rounded(w,h,d,r=.08){const key=[w,h,d,r].join();if(!geometries.has(key))geometries.set(key,new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)));return geometries.get(key);}
export function mesh(parent,geometry,mat,x=0,y=0,z=0){const m=new T.Mesh(geometry,typeof mat==='number'?material(mat):mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
export function box(parent,w,h,d,color,x=0,y=0,z=0,r=.07){return mesh(parent,rounded(w,h,d,r),color,x,y,z);}
export function orb(parent,x,y,z,sx,sy,sz,color){const m=mesh(parent,sphereGeo,color,x,y,z);m.scale.set(sx,sy,sz);return m;}
export function cylinder(parent,r,h,color,x=0,y=0,z=0){const m=mesh(parent,cylinderGeo,color,x,y,z);m.scale.set(r,h,r);return m;}
function group(parent,x=0,y=0,z=0,dynamic=false){const g=new T.Group();g.position.set(x,y,z);g.userData.dynamic=dynamic;parent.add(g);return g;}
function seeded(seed=73){return()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};}
const rand=seeded();
function tube(parent,points,r,color){return mesh(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),16,r,6,false),color);}
function path(parent,points,width,color=0xdcc08b){const curve=new T.CatmullRomCurve3(points.map(([x,z])=>new T.Vector3(x,.12,z)));const samples=curve.getPoints(70);const vertices=[],indices=[];for(let i=0;i<samples.length;i++){const tangent=curve.getTangent(i/(samples.length-1));const n=new T.Vector3(-tangent.z,0,tangent.x).multiplyScalar(width/2);const p=samples[i];vertices.push(p.x+n.x,.122,p.z+n.z,p.x-n.x,.122,p.z-n.z);if(i<samples.length-1){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();const m=mesh(parent,geo,material(color));m.receiveShadow=true;return m;}
function stone(parent,x,z,s=.35){const m=mesh(parent,stoneGeo,material([0xa4aaa1,0xb7b3a0,0xc4bd9e][Math.floor(rand()*3)]),x,s*.3,z);m.scale.set(s,s*.6,s*.9);m.rotation.set(rand(),rand()*6,rand()*.4);return m;}
function flower(parent,x,z,color=0xffecc0,scale=1){const g=group(parent,x,0,z);const stem=cylinder(g,.022,.29,0x4f7b43,0,.15);stem.rotation.z=.15;orb(g,.08,.13,0,.1,.025,.045,0x60914d);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;orb(g,Math.cos(a)*.085,.32,Math.sin(a)*.085,.078,.04,.078,color);}orb(g,0,.34,0,.055,.04,.055,0xe3ac49);g.scale.setScalar(scale);}
function grass(parent,x,z,scale=1){const g=group(parent,x,0,z);for(let i=0;i<3;i++){const m=mesh(g,grassGeo,material([0x668d45,0x95b961,0x739c4b][i]),(i-1)*.065,.21,0);m.scale.set(.055,.28+rand()*.16,.055);m.rotation.z=(i-1)*-.22;}g.rotation.y=rand()*6;g.scale.setScalar(scale);}
function fence(parent,x,z,length,axis='x'){const g=group(parent,x,0,z);if(axis==='z')g.rotation.y=Math.PI/2;for(let i=0;i<=length;i++){const p=box(g,.13,.78,.15,0xe7d5a8,i,.4,0,.03);box(g,.19,.07,.2,0xf5e3b8,i,.82,0,.02);}for(const y of [.32,.65])box(g,length,.105,.1,0xc8b286,length/2,y,0,.025);}
function tree(parent,x,z,scale=1,variant=0){const g=group(parent,x,0,z);g.scale.setScalar(scale);cylinder(g,.24,1.8,0x86654b,0,.8);const branch=cylinder(g,.1,.9,0x927253,.25,1.4);branch.rotation.z=-.65;const colors=variant?[0x729755,0x86a45c,0x638b50]:[0x4f8d58,0x5e9b59,0x44844f];orb(g,0,2.3,0,1.15,1.15,1.05,colors[0]);orb(g,-.73,2.2,.25,.82,.8,.83,colors[1]);orb(g,.7,2.1,.32,.83,.82,.85,colors[2]);orb(g,.2,2.65,-.44,.85,.86,.85,colors[1]);orb(g,-.25,1.9,.65,.85,.65,.7,colors[0]);for(let i=0;i<6;i++){const a=i*2.4;orb(g,Math.sin(a)*.9,2.35+rand()*.6,Math.cos(a)*.8,.18,.12,.2,colors[1]);}return g;}
function bush(parent,x,z,s=.8){orb(parent,x,.4*s,z,.7*s,.55*s,.6*s,0x638b4e);orb(parent,x+.4*s,.3*s,z+.08,.45*s,.38*s,.4*s,0x82a45c);}
function barrel(parent,x,z,s=1){const g=group(parent,x,0,z);g.scale.setScalar(s);cylinder(g,.31,.65,0xaf8052,0,.35);for(const y of [.15,.55]){const tor=mesh(g,new T.TorusGeometry(.31,.027,5,20),material(0x5f6962,.5,.3),0,y);tor.rotation.x=Math.PI/2;}cylinder(g,.28,.04,0xc49c68,0,.7);for(let i=0;i<6;i++){const a=i*Math.PI/3;box(g,.015,.55,.018,0x855d3e,Math.sin(a)*.31,.35,Math.cos(a)*.31,.002);}return g;}
function crate(parent,x,z,s=.8){const g=group(parent,x,0,z);box(g,s,s,s,0xbb9564,0,s/2,0);for(const y of [.12,s-.12])box(g,s+.025,.09,s+.025,0x927147,0,y,0,.01);for(const x of [-s/2+.1,s/2-.1])box(g,.1,s,s+.03,0xa68050,x,s/2,0,.01);return g;}
function lamp(parent,x,z){const g=group(parent,x,0,z);cylinder(g,.06,2,0x6d6752,0,1);tube(g,[[0,1.8,0],[.05,2.1,0],[.35,2.15,0],[.45,1.95,0]],.055,0x6d6752);box(g,.3,.38,.3,0x6d6650,.45,1.7,0);box(g,.23,.28,.32,new T.MeshStandardMaterial({color:0xffd78a,emissive:0xffaa48,emissiveIntensity:.65}),.45,1.7,0,.025);box(g,.4,.09,.4,0x66726a,.45,1.93,0);}
function sign(parent,x,z){const g=group(parent,x,0,z);cylinder(g,.07,.9,0x8a704d,0,.45);box(g,.85,.42,.12,0xc8a76b,0,.95,0);for(const y of [.88,1.0])box(g,.38,.025,.015,0x7d7052,-.09,y,.068,.004);}
function house(parent,x,z,roof=0xc0744f,rotation=0,scale=1){
  const g=group(parent,x,0,z);g.rotation.y=rotation;g.scale.setScalar(scale);
  box(g,4.55,.35,3.8,0xa79a7b,0,.2,0,.15);box(g,4.3,2.45,3.5,0xf1ddaf,0,1.55,0,.13);
  // Timber, inset windows, individual clay roof tiles and projecting eaves.
  for(const xx of [-2.03,2.03])box(g,.15,2.5,3.53,0x927358,xx,1.55,0,.025);
  for(const zz of [-1.76,1.76])box(g,4.2,.14,.1,0xa68b65,0,.8,zz,.02);
  box(g,.91,1.73,.15,0x8a6d4f,.35,1.14,1.8,.08);box(g,1.14,.14,.32,0xbea176,.35,2.05,1.83,.03);box(g,1.25,.15,.6,0xd3bb8f,.35,.29,1.93);
  for(let i=0;i<5;i++)box(g,.018,1.6,.025,0x705a44,.02+i*.16,1.13,1.9,.004);orb(g,.66,1.13,1.94,.045,.045,.04,0xd9b66e);
  for(const xx of [-1.23,1.44]){box(g,.76,.95,.17,0x987b54,xx,1.66,1.81);box(g,.57,.74,.07,new T.MeshStandardMaterial({color:0x7ba3a0,roughness:.3,metalness:.15}),xx,1.68,1.92);box(g,.045,.75,.045,0xe8cfa0,xx,1.68,1.97,.008);box(g,.6,.045,.045,0xe8cfa0,xx,1.68,1.97,.008);box(g,.9,.1,.35,0xc5a16b,xx,1.17,1.88,.03);for(let i=0;i<3;i++)flower(g,xx-.24+i*.24,1.89,0xffd995,.6);}
  const roofSlope=.58;
  for(const side of [-1,1]){const backing=box(g,2.9,.18,4.3,roof,side*1.2,3.27,0);backing.rotation.z=side*-roofSlope;for(let row=0;row<6;row++)for(let col=0;col<10;col++){const px=side*(.23+row*.43);const tile=box(g,.59,.14,.46,material([roof,roof+0x080500,roof-0x080300][(col+row)%3]),px,3.95-row*.28,-2.02+col*.45,.065);tile.rotation.z=side*-roofSlope;}}
  for(let i=0;i<11;i++)cylinder(g,.15,.43,roof,0,4.04,-2.17+i*.43).rotation.x=Math.PI/2;
  box(g,.62,1.6,.62,0xb69578,-1.15,3.7,-.8,.09);box(g,.81,.16,.8,0xcfb397,-1.15,4.53,-.8,.04);
  return g;
}
function boat(parent,x,z,rotation=0,scale=1){const g=group(parent,x,-.45,z);g.rotation.y=rotation;g.scale.setScalar(scale);const shape=new T.Shape();shape.moveTo(0,-1.6);shape.bezierCurveTo(-.6,-1,-.7,.8,-.42,1.25);shape.quadraticCurveTo(0,1.65,.42,1.25);shape.bezierCurveTo(.7,.8,.6,-1,0,-1.6);const hull=mesh(g,new T.ExtrudeGeometry(shape,{depth:.35,bevelEnabled:true,bevelSize:.09,bevelThickness:.1,bevelSegments:2}),material(0x9c7054));hull.rotation.x=-Math.PI/2;box(g,.74,.12,2.15,0x624f3f,0,.4,0);for(const zz of [-.65,.4])box(g,.95,.12,.22,0xceac75,0,.5,zz);const oar=box(g,.07,.07,2.3,0xc9ac7c,.8,.55,0);oar.rotation.y=-.3;box(g,.22,.07,.5,0xbd9769,1.1,.55,.9).rotation.y=-.3;return g;}
function well(parent,x,z){const g=group(parent,x,0,z);for(let row=0;row<3;row++)for(let i=0;i<12;i++){const a=(i+row*.5)*Math.PI/6;const b=box(g,.39,.25,.3,0xb6b5a1,Math.sin(a)*.69,.16+row*.24,Math.cos(a)*.69,.065);b.rotation.y=a;}cylinder(g,.52,.03,0x416b6c,0,.1);for(const xx of [-.9,.9])box(g,.14,2,.16,0x9e7c54,xx,1.1,0);const axle=cylinder(g,.09,1.9,0x775b3d,0,1.5);axle.rotation.z=Math.PI/2;box(g,.035,1.2,.035,0xcfb685,0,1);for(const side of [-1,1]){const roof=box(g,1.1,.16,1.65,0x5e8580,side*.44,2.2,0);roof.rotation.z=-side*.36;}return g;}
function shell(parent,x,z,color=0xffe3b2){const g=group(parent,x,.15,z,true);for(let i=0;i<5;i++){const m=orb(g,(i-2)*.057,0,0,.045,.09,.14,color);m.rotation.z=(i-2)*-.21;}return g;}
function flame(parent,y,scale){const root=group(parent,0,y,0,true);const profile=[[0,0],[.13,.04],[.24,.2],[.2,.4],[.11,.6],[.04,.8],[0,1]].map(p=>new T.Vector2(...p));const geo=new T.LatheGeometry(profile,16);mesh(root,geo,new T.MeshStandardMaterial({color:0xffb83e,emissive:0xff8e20,emissiveIntensity:1.2}));const inner=mesh(root,geo,new T.MeshStandardMaterial({color:0xffefb1,emissive:0xffdf84,emissiveIntensity:1.6}),0,.01,.035);inner.scale.set(.55,.65,.55);root.scale.setScalar(scale);return root;}
export function makeCharacter(parent,{coat=0x3c8890,hair=0x684435,scarf=0xe89950,npc=false}={}){
  const g=group(parent,0,0,0,true),body=group(g);const legs=[];for(const s of [-1,1]){const leg=group(body,s*.15,.28,0);box(leg,.23,.36,.25,0x596969,0,0,0,.08);box(leg,.27,.17,.4,0x795a42,0,-.15,.06,.07);legs.push(leg);}
  orb(body,0,.77,0,.39,.43,.27,coat);box(body,.65,.15,.46,coat,0,.49,0,.07);box(body,.64,.09,.48,0x6c5640,0,.6,0,.025);box(body,.12,.12,.035,0xe7c17b,0,.6,.255,.015);
  const head=group(body,0,1.32,0);orb(head,0,0,0,.43,.42,.38,0xf0c494);for(const s of [-1,1])orb(head,s*.43,0,0,.08,.12,.09,0xe9b98a);
  orb(head,0,.19,-.055,.44,.29,.37,hair);for(let i=0;i<5;i++){const fringe=orb(head,-.3+i*.14,.2,.25,.13,.16,.12,hair);fringe.rotation.z=-.3;}
  for(const s of [-1,1]){orb(head,s*.155,.01,.346,.047,.073,.033,0x273f3d);orb(head,s*.155-.012,.038,.37,.014,.023,.012,0xfff3d8);orb(head,s*.25,-.1,.31,.07,.035,.014,0xe8a083);}orb(head,0,-.045,.38,.06,.045,.06,0xe4aa7e);
  const scarfMesh=box(body,.5,.13,.53,scarf,0,1.02,0,.06);const tail=box(body,.16,.35,.08,scarf,-.23,.84,-.32,.04);tail.rotation.z=.2;
  const arms=[];for(const s of [-1,1]){const arm=group(body,s*.4,.88,0);orb(arm,0,-.13,0,.13,.26,.13,coat);orb(arm,0,-.35,.015,.105,.12,.1,0xf0c494);arms.push(arm);}
  if(!npc){box(body,.5,.54,.22,0xb2895d,0,.77,-.32,.09);for(const s of [-1,1])box(body,.055,.46,.035,0xd9b98b,s*.18,.8,.25,.01);const lantern=group(arms[1],0,-.48,.05);cylinder(lantern,.14,.26,0xe6ad58,0,-.1);cylinder(lantern,.17,.05,0x897547,0,-.23);cylinder(lantern,.17,.06,0x897547,0,.04);orb(lantern,0,-.08,0,.11,.13,.11,new T.MeshStandardMaterial({color:0xffe8a7,emissive:0xffb744,emissiveIntensity:2}));}
  else{box(body,.38,.35,.13,0xe3c294,0,.52,.27,.04);}
  return {root:g,body,head,legs,arms,scarf:tail};
}
function bakeStatic(root){root.updateMatrixWorld(true);const batches=new Map();function visit(obj,inherited=false){const dynamic=inherited||obj.userData.dynamic;if(obj.isMesh&&!dynamic){const key=obj.geometry.uuid+obj.material.uuid;let b=batches.get(key);if(!b)batches.set(key,b={geometry:obj.geometry,material:obj.material,matrices:[],nodes:[]});b.matrices.push(obj.matrixWorld.clone());b.nodes.push(obj);}for(const c of obj.children)visit(c,dynamic);}visit(root);const inverse=root.matrixWorld.clone().invert();for(const b of batches.values()){const inst=new T.InstancedMesh(b.geometry,b.material,b.matrices.length);b.matrices.forEach((m,i)=>inst.setMatrixAt(i,m.premultiply(inverse)));inst.castShadow=true;inst.receiveShadow=true;root.add(inst);for(const n of b.nodes)n.removeFromParent();}}

export function createWorld(scene){
  const harbor=group(scene),garden=group(scene,80,0,0);const colliders=[],gardenColliders=[],animated=[],sparks=[],shells=[],runes=[];
  const block=(x,z,w,d)=>colliders.push({x,z,w,d});
  // A beveled, layered shoreline makes the land read as a handmade miniature.
  const outline=new T.Shape();SHORE.forEach(([x,z],i)=>i?outline.lineTo(x,-z):outline.moveTo(x,-z));outline.closePath();
  for(const [y,depth,color,bevel]of [[-2.0,1.2,0xb88e68,.3],[-.95,.65,0xe4c896,.55],[-.3,.25,0x7aaa4c,.22]]){const geo=new T.ExtrudeGeometry(outline,{depth,bevelEnabled:true,bevelSize:bevel,bevelThickness:.15,bevelSegments:3,steps:1});geo.rotateX(-Math.PI/2);mesh(harbor,geo,material(color),0,y);}
  path(harbor,[[-19,6],[-12,5],[-6,3],[0,3],[5,1],[10,-3],[11,-9]],2.05);
  path(harbor,[[-6,3],[-7,-1],[-9,-5],[-10,-10]],1.6);
  path(harbor,[[0,3],[-.3,-2],[0,-7.5],[4,-10],[11,-9]],1.4);
  path(harbor,[[5,1],[8,4],[10,7],[10,10]],1.55);
  path(harbor,[[-12,5],[-11,8],[-9,10]],1.2);
  // Worn stepping stones and planted beds keep the routes legible at game scale.
  for(let i=0;i<12;i++){const x=-4.5+i*.84,z=3+Math.sin(i*.53)*.13;const slab=box(harbor,.53,.06,.39,0xc6bd91,x,.16,z,.1);slab.rotation.y=Math.sin(i*2.2)*.35;}
  for(const [cx,cz]of [[-11,1.5],[-15,-3.5],[3,-2.8]]){box(harbor,1.6,.14,.65,0xa98b59,cx,.18,cz,.1);for(let i=0;i<7;i++)flower(harbor,cx-.64+i*.21,cz, i%2?0xf1a58b:0xffe6a0,.9);}
  // Storybook houses: plaster walls, terracotta/slate roofs, tiny window boxes.
  house(harbor,-8,-.8,0xc4774f,.08);block(-8,-.8,4.8,4);
  house(harbor,-14,-7,0x578d8b,-.12,.85);block(-14,-7,4.1,3.8);
  house(harbor,5,-4.8,0xc59054,-.13,.78);block(5,-4.8,3.8,3.6);
  fence(harbor,-10.5,1.65,2);fence(harbor,-5.5,-3,4,'z');fence(harbor,-17,-4.5,3);fence(harbor,3,-7.1,4);
  barrel(harbor,-5.4,-.2);crate(harbor,-5.4,.65,.65);barrel(harbor,7,-4,.8);crate(harbor,7.6,-3.5,.6);crate(harbor,8.15,-3.6,.5);
  well(harbor,0,-5.7);block(0,-5.7,2.1,1.8);sign(harbor,5.7,1.9);lamp(harbor,-4.7,2);lamp(harbor,7.1,3.9);lamp(harbor,9.2,-6.4);
  // Pier, mooring posts, ropes and boats at the southern shore.
  for(let i=0;i<22;i++)box(harbor,2.3,.18,.32,material(i%3===0?0xae8b62:0xb99a70),9.8,-.07,9.3+i*.34,.035);
  for(const x of [8.65,10.95])for(const z of [9.6,12.6,15.8]){cylinder(harbor,.12,1.25,0x8c7658,x,-.22,z);cylinder(harbor,.16,.08,0xc6b58a,x,.43,z);for(let i=0;i<3;i++)mesh(harbor,new T.TorusGeometry(.13,.024,4,12),material(0xd8c591),x,.25+i*.05,z).rotation.x=Math.PI/2;}
  tube(harbor,[[8.65,.28,9.6],[8.65,.12,11.1],[8.65,.28,12.6]],.025,0xd8c591);
  const littleBoat=boat(harbor,12.1,12,.1,1.15);littleBoat.userData.dynamic=true;animated.push({type:'boat',root:littleBoat,baseY:littleBoat.position.y});
  boat(harbor,-16,9.5,.5,.9);barrel(harbor,9.3,10.2,.8);crate(harbor,10.3,10.4,.6);
  // A white lighthouse on the far headland, always visible above the tree line.
  const lighthouse=group(harbor,-7,0,-14);cylinder(lighthouse,1.65,.4,0xb3ab8e,0,.25);const tower=mesh(lighthouse,new T.CylinderGeometry(.72,1.13,6.4,24),material(0xf1e2bb),0,3.5);for(const y of [1.6,4.4])cylinder(lighthouse,y===1.6?1.05:.83,.35,0xb77355,0,y);cylinder(lighthouse,1.24,.18,0xc5bca0,0,6.7);cylinder(lighthouse,.83,1.05,0x638b86,0,7.3);for(let i=0;i<8;i++){const a=i*Math.PI/4;cylinder(lighthouse,.045,1.1,0xe4d5ae,Math.sin(a)*.82,7.3,Math.cos(a)*.82);}mesh(lighthouse,new T.ConeGeometry(1.24,.8,16),material(0x5c8179),0,8.2);orb(lighthouse,0,7.3,0,.45,.43,.45,new T.MeshStandardMaterial({color:0xffe29b,emissive:0xffb45d,emissiveIntensity:2}));box(lighthouse,.55,1,.13,0x785d45,0,.85,1.08,.15);block(-7,-14,2.8,2.8);
  const treePositions=[[-19,-5,1.2],[-18,-9,1],[-17,-12,1.1],[-13,-12,1],[-11,-11,1.3],[-4,-13,1.1],[-1,-13,1.1],[2,-14,1.25],[5,-12,1],[8,-14,.95],[13,-12,1.2],[16,-10,1.2],[17,-6,1.1],[17,-2,1.05],[17,2,1],[14,3,.8],[-20,0,1.1],[-18,3,.85],[-15,1,1],[-12,9,.9],[-5,10,1.15],[-2,10,.8],[3,9,1],[3,6,.7],[-11,-5,.8],[-3,-8,.8],[6,-8,.8]];
  for(const [x,z,s]of treePositions){tree(harbor,x,z,s,rand()>.7?1:0);colliders.push({x,z,r:.5*s});}
  for(let i=0;i<35;i++){const x=-20+rand()*39,z=-15+rand()*27;if(insidePolygon(x,z)&&!isPath(x,z)&&!colliders.some(c=>Math.hypot(c.x-x,c.z-z)<2.8)){bush(harbor,x,z,.5+rand()*.6);}}
  for(let i=0;i<1000;i++){const x=-21+rand()*41,z=-16+rand()*29;if(!insidePolygon(x,z)||isPath(x,z)||colliders.some(c=>Math.abs(c.x-x)<(c.w||1)/2+.35&&Math.abs(c.z-z)<(c.d||1)/2+.35))continue;if(i%4===0)flower(harbor,x,z,[0xffedbf,0xf2b8a7,0xc9dbe5,0xf9d370][Math.floor(i/4)%4],.6+rand()*.5);else grass(harbor,x,z,.6+rand()*.65);}
  for(let i=0;i<70;i++){const t=rand()*SHORE.length,j=Math.floor(t),a=SHORE[j],b=SHORE[(j+1)%SHORE.length];const x=T.MathUtils.lerp(a[0],b[0],t-j)*.98,z=T.MathUtils.lerp(a[1],b[1],t-j)*.98;stone(harbor,x,z,.13+rand()*.35);}
  for(let i=0;i<28;i++){const x=-17+rand()*33,z=-11+rand()*21;if(insidePolygon(x,z)&&!colliders.some(c=>Math.hypot(c.x-x,c.z-z)<2))stone(harbor,x,z,.09+rand()*.13);}
  // Three lantern sparks and optional shell collectibles are deliberately unbatched.
  for(const def of SPARKS){const root=group(harbor,def.x,.7,def.z,true);const glow=orb(root,0,0,0,.15,.22,.15,new T.MeshStandardMaterial({color:0xffe8a3,emissive:0xffb44b,emissiveIntensity:2.7}));const ring=mesh(root,new T.TorusGeometry(.28,.018,6,24),material(0xffe1a1,.3,.2));ring.rotation.x=Math.PI/2;for(let i=0;i<5;i++){const a=i*1.256;orb(root,Math.sin(a)*.37,Math.cos(a)*.2,Math.cos(a)*.37,.025,.025,.025,0xfff1c0);}sparks.push({...def,root});}
  const shellPositions=[[-3,7],[-15,7],[-18,1],[-16,-10],[-6,-9],[2,-10],[14,-6],[15,2],[7,8],[-6,12],[-11,5],[4,3]];
  shellPositions.forEach(([x,z],id)=>shells.push({id,x,z,root:shell(harbor,x,z)}));
  // Sealed garden arch. Its opening leads to a compact playable dungeon.
  const gate=group(harbor,10.5,0,-9.8,true);for(const xx of [-1.1,1.1]){box(gate,.65,2.9,.7,0xaeb399,xx,1.45,0,.12);box(gate,.85,.2,.88,0xd3d3b1,xx,2.9,0,.06);}box(gate,2.9,.6,.8,0xbcc4a1,0,3.05,0,.18);for(let i=0;i<3;i++)orb(gate,(i-1)*.5,3.1,.43,.1,.1,.05,0xe5d09a);const gateSeal=box(gate,1.6,2.4,.18,new T.MeshStandardMaterial({color:0x659a8a,emissive:0x4f896e,emissiveIntensity:.2,transparent:true,opacity:.8}),0,1.4,0,.1);for(let i=0;i<4;i++)bush(harbor,8.2+i*1.6,-11.3,.7);
  // Small chest beside the boatbuilder's workshop.
  const chest=group(harbor,7.8,0,-1.5,true);box(chest,.88,.55,.62,0x9d7048,0,.3,0);const lid=box(chest,.94,.25,.67,0xc29962,0,.64,0,.08);for(const xx of [-.3,.3])box(chest,.08,.72,.68,0x677665,xx,.4,0,.02);box(chest,.14,.18,.035,0xe9bd69,0,.44,.36,.02);
  const bell=group(harbor,-15.9,.25,3.1,true);mesh(bell,new T.CylinderGeometry(.08,.17,.22,16),material(0xe4be72,.35,.5),0,.05);orb(bell,0,-.07,0,.08,.04,.08,0x8b7746);mesh(bell,new T.TorusGeometry(.06,.019,5,12),material(0xc69d52,.4,.4),0,.22).rotation.y=Math.PI/2;
  // Garden: a sunken, open-roof sanctuary, readable from the same camera.
  box(garden,18,.7,21,0x938e75,0,-.4,0,.4);box(garden,17.3,.22,20.3,0xb2b397,0,-.02,0,.3);
  for(let x=-8;x<=8;x+=1.35)for(let z=-9;z<=9;z+=1.35){const tile=box(garden,1.29,.12,1.29,material((Math.round(x+z)*3)%2===0?0xc9c8a9:0xbfc3a4),x,.1,z,.07);}
  for(const x of [-8.5,8.5]){box(garden,.75,1.25,20.5,0x89997d,x,.6,0);for(const z of [-9,-5,-1,3,7]){box(garden,1.05,2.7,1.05,0xa8b093,x,1.35,z,.12);box(garden,1.25,.2,1.25,0xd0d0ac,x,2.75,z,.07);bush(garden,x,.7+z,.7);}}
  box(garden,17.4,1.6,.7,0x95a087,0,.8,-10);for(const x of [-6,-3,3,6]){box(garden,.7,3,.7,0xabb198,x,1.5,-9.5);orb(garden,x,3.2,-9.5,.55,.35,.55,0x70905e);}
  for(const [x,z]of [[-4,2],[4,2],[-3,-4],[3,-4]]){box(garden,1.45,.9,1.45,0x8e9c81,x,.5,z,.12);box(garden,1.65,.18,1.65,0xb9c2a0,x,1,z,.05);gardenColliders.push({x,z,w:1.8,d:1.8});const planting=group(garden,x,1.05,z);bush(planting,0,0,.65);for(let i=0;i<3;i++)flower(planting,(i-1)*.25,.25,0xffd49e,.65);}
  for(const side of [-1,1]){for(let i=0;i<8;i++){const z=-10+i*2.8;tree(garden,side*(10.5+rand()*1.2),z,1.1+rand()*.6,i%2);bush(garden,side*9,z+1,1.1);}tube(garden,[[side*8.05,.4,7],[side*7.9,1.3,3],[side*8.1,1,-1],[side*7.9,1.8,-6]],.11,0x68845c);}
  const runePositions=[[-5.7,5],[5.7,5],[0,-6.4]];for(let id=0;id<3;id++){const [x,z]=runePositions[id];const root=group(garden,x,0,z,true);cylinder(root,.55,.24,0x8b9b7d,0,.3);cylinder(root,.35,.7,0xa6ac88,0,.7);cylinder(root,.52,.12,0xc6c79c,0,1.08);const fire=flame(root,1.15,.7);fire.visible=false;runes.push({id,x,z,root,fire});}
  const guardian=group(garden,0,0,-.6,true);for(const s of [-1,1]){box(guardian,.55,.6,.7,0x7b8a71,s*.65,.34,0,.16);orb(guardian,s*1.1,1.4,0,.37,.6,.4,0x96a481);}box(guardian,1.8,1.65,1.2,0x929f80,0,1.4,0,.25);orb(guardian,0,2.3,0,.63,.59,.55,0xa5b08f);for(const s of [-1,1])box(guardian,.22,.13,.06,new T.MeshStandardMaterial({color:0xe8b968,emissive:0xe8983e,emissiveIntensity:.8}),s*.25,2.34,.55,.04);const core=orb(guardian,0,1.5,.63,.24,.3,.1,new T.MeshStandardMaterial({color:0x5bc1ad,emissive:0x298e79,emissiveIntensity:.5}));for(let i=0;i<6;i++)orb(guardian,Math.sin(i)*.6,2.7+rand()*.2,Math.cos(i)*.35,.25,.25,.25,0x65884d);
  const beacon=group(garden,0,0,-8.4,true);cylinder(beacon,.9,.3,0x9f9e7f,0,.3);cylinder(beacon,.55,1.2,0xa8aa8b,0,.8);cylinder(beacon,.75,.2,0xe0c58b,0,1.4);const beaconFire=flame(beacon,1.5,1.2);beaconFire.visible=false;
  // Static props are batched by geometry and material, keeping draw calls modest.
  bakeStatic(harbor);bakeStatic(garden);garden.visible=false;
  return {harbor,garden,colliders,gardenColliders,animated,sparks,shells,gate,gateSeal,chest,lid,bell,runes,guardian,core,beaconFire};
}
function isPath(x,z){return Math.abs(z-3)<1.65&&x<6||Math.abs(x)<1.1&&z>-9||Math.abs(x-10)<1.5&&z>-11||Math.hypot(x+7,z+1)<4||Math.hypot(x+14,z+7)<3.5||Math.hypot(x-5,z+5)<3;}

export function makeWater(scene){
  const uniforms={time:{value:0},colorDeep:{value:new T.Color(0x277b88)},colorShallow:{value:new T.Color(0x74b8ac)}};
  const mat=new T.ShaderMaterial({uniforms,vertexShader:`varying vec3 vWorld; void main(){vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`,fragmentShader:`varying vec3 vWorld;uniform float time;uniform vec3 colorDeep;uniform vec3 colorShallow;void main(){vec2 p=vWorld.xz;float w=sin(p.x*.95+time*.65)*sin(p.y*1.2-time*.4);float r=pow(max(0.,sin(p.x*2.2+p.y*.8+sin(p.y*1.7-time*.8)*.8+time*.7)),18.);float s=sin(p.x*.25+p.y*.2)*.5+.5;vec3 c=mix(colorDeep,colorShallow,.22+s*.16+w*.035);c+=vec3(.2,.28,.25)*r*.19;float glitter=pow(max(0.,sin(p.x*8.+time)*cos(p.y*7.-time*.6)),38.);c+=glitter*.22;gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`});
  const water=new T.Mesh(new T.PlaneGeometry(800,800),mat);water.rotation.x=-Math.PI/2;water.position.y=-.72;scene.add(water);
  const foam=new T.Group();scene.add(foam);const foamMat=new T.MeshBasicMaterial({color:0xd4e3c0,transparent:true,opacity:.38,depthWrite:false});for(let i=0;i<SHORE.length;i++){const a=SHORE[i],b=SHORE[(i+1)%SHORE.length];const pts=[];for(let j=0;j<=12;j++){const t=j/12;pts.push(new T.Vector3(T.MathUtils.lerp(a[0],b[0],t)*1.035,-.69,T.MathUtils.lerp(a[1],b[1],t)*1.035));}const m=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),12,.055,4,false),foamMat);foam.add(m);}
  return {uniforms,foam};
}
