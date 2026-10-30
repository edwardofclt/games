const {chromium}=require(process.env.PLAYWRIGHT_PATH||'/Users/eherbert/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const ROOT=path.resolve(__dirname,'../..'),OUT=path.join(__dirname,'screenshots');
fs.mkdirSync(OUT,{recursive:true});
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/edwardofclt-gamestudio(?=\/)/,'');let file=path.resolve(ROOT,'.'+pathname);if(!file.startsWith(ROOT+path.sep)&&file!==ROOT){res.writeHead(403);return res.end();}try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end('Not found');}});
const errors=[],failures=[];let checks=0;
function check(condition,message){assert.ok(condition,message);checks++;}
async function state(p){return p.evaluate(()=>window.__lantern.state);}
async function go(p,x,z){await p.evaluate(([x,z])=>window.__lantern.teleport(x,z),[x,z]);}
async function act(p){await p.keyboard.press('e');await p.evaluate(()=>window.__lantern.closeDialogue());}
async function frame(p){await p.waitForTimeout(180);}
function observe(p){p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)failures.push(`${r.status()} ${r.url()}`);});}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const BASE=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const p=await browser.newPage({viewport:{width:1440,height:960}});observe(p);
  await p.goto(`${BASE}/`);const links=await p.locator('.games a').evaluateAll(a=>a.map(v=>v.getAttribute('href')));check(links.includes('./lantern-tide/index.html'),'studio lists the new adventure');
  for(const prefix of ['', '/edwardofclt-gamestudio']){const root=await fetch(BASE+prefix+'/');check(root.status===200,'root index loads '+prefix);for(const href of links){const r=await fetch(new URL(href,BASE+prefix+'/'));check(r.status===200,'studio game link loads '+prefix+href);}}
  await p.goto(`${BASE}/lantern-tide/?test=1`);await p.waitForFunction(()=>window.__lantern);await frame(p);check(await p.locator('#title-screen').isVisible(),'title screen renders');await p.screenshot({path:path.join(OUT,'title.png')});
  await p.click('#begin');await p.evaluate(()=>window.__lantern.closeDialogue());await frame(p);
  const before=(await state(p)).position;await p.keyboard.down('d');await p.evaluate(()=>window.__lantern.step(.6));await p.keyboard.up('d');check((await state(p)).position.x>before.x+.3,'keyboard moves the hero');
  await go(p,10.5,-8.4);await act(p);check(!(await state(p)).progress.gate,'garden cannot open before quest');
  await go(p,2.2,4.3);await act(p);check((await state(p)).progress.metMira,'Mira starts the quest');
  await go(p,7.8,-.3);await act(p);check((await state(p)).progress.sword,'chest grants sword');
  for(const [x,z]of [[-9,-7],[10,6.5],[0,-7.5]]){await go(p,x,z);await act(p);}check((await state(p)).progress.sparks.length===3,'all three sparks are collected');
  await go(p,-15.9,3.1);await act(p);await go(p,-10,7.4);await act(p);check((await state(p)).progress.bellReturned,'optional fisherman bell quest resolves');
  await go(p,0,4);await p.evaluate(()=>window.__lantern.step(1.4));await p.screenshot({path:path.join(OUT,'harbor.png')});
  await go(p,10.5,-8.4);await act(p);check((await state(p)).progress.gate,'three sparks unlock the seal');await act(p);check((await state(p)).progress.area==='garden','gate enters the garden');
  for(const [x,z]of [[-5.7,5],[5.7,5],[0,-6.4]]){await go(p,x,z);await act(p);}check((await state(p)).progress.runes.length===3,'three braziers awaken guardian');
  await go(p,0,6.7);await p.evaluate(()=>window.__lantern.step(.6));await p.screenshot({path:path.join(OUT,'garden.png')});
  // A real player must wait for the exposed core. Invulnerable phases reject hits.
  let s=await state(p);const hp=s.bossHealth;await go(p,0,-.6);await p.keyboard.press('Space');check((await state(p)).bossHealth===hp,'guardian rejects attacks before the exposed phase');
  // Wait out one telegraphed charge from a safe distance. A player may land
  // multiple sword hits in the same opening; do not idle inside the next charge.
  await go(p,6.8,8.7);
  await p.evaluate(()=>{for(let i=0;i<600&&window.__lantern.state.bossPhase!=='rest';i++)window.__lantern.step(.02);});
  s=await state(p);check(s.bossPhase==='rest','guardian exposes its core');
  await go(p,s.guardianPosition.x,Math.min(8.7,s.guardianPosition.z+1.3));
  await p.evaluate(()=>window.__lantern.step(.5));await p.keyboard.press('Space');
  check((await state(p)).bossHealth===3,'a timed close-range sword hit damages guardian');
  const hits=await p.evaluate(()=>{const result=[];for(let i=0;i<3;i++){window.__lantern.step(.5);window.__lantern.attack();result.push(window.__lantern.state.bossHealth);}return result;});
  check(JSON.stringify(hits)===JSON.stringify([2,1,0]),'successive timed sword hits defeat guardian');
  check((await state(p)).progress.guardian,'guardian is defeated');await go(p,0,-7.3);await act(p);check((await state(p)).progress.beacon,'beacon is restored');
  await go(p,0,8.6);await act(p);check((await state(p)).progress.area==='harbor','garden exit returns to harbor');await go(p,2.2,4);await act(p);check(await p.locator('#modal-title').textContent()==='A beginning, beautifully small.','Mira completes the playable chapter');await p.getByRole('button',{name:'Stay a little longer'}).click();
  await p.evaluate(()=>window.__lantern.save());await p.reload();await p.waitForFunction(()=>window.__lantern);await p.click('#continue');check((await state(p)).progress.beacon,'save restores campaign completion');check((await state(p)).progress.bellReturned,'save restores side quest');
  await p.click('#journal-button');check(await p.locator('#modal-title').textContent()==='A little light.','journal opens');await p.getByRole('button',{name:'Back to the adventure'}).click();
  await p.click('#pause-button');const pausedPosition=(await state(p)).position;await p.keyboard.down('w');await p.waitForTimeout(250);await p.keyboard.up('w');check(JSON.stringify((await state(p)).position)===JSON.stringify(pausedPosition),'pause stops movement');await p.getByRole('button',{name:'Return to the island'}).click();
  check(await p.evaluate(()=>window.__lantern.blocked(40,0)),'water boundary blocks traversal');check(await p.evaluate(()=>window.__lantern.blocked(-8,-.8)),'building collision blocks traversal');
  console.log('Main quest, side quest, combat, save/reload and collisions passed.');
  // Release the first software WebGL context before the responsive pass.
  await p.close();
  const touch=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1});const phone=await touch.newPage();observe(phone);await phone.goto(`${BASE}/edwardofclt-gamestudio/lantern-tide/?test=1`,{waitUntil:'domcontentloaded',timeout:60000});await phone.waitForFunction(()=>window.__lantern,{timeout:60000});await phone.click('#begin');await phone.evaluate(()=>window.__lantern.closeDialogue());await frame(phone);
  for(const [name,width,height]of [['phone',390,844],['narrow',320,568],['landscape',844,390],['tablet',820,1180]]){await phone.setViewportSize({width,height});await frame(phone);check(!await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth),'no horizontal overflow '+name);for(const selector of ['#touch-interact','[data-move="left"]','#pause-button']){const b=await phone.locator(selector).boundingBox();check(b&&b.x>=0&&b.y>=0&&b.x+b.width<=width+1&&b.y+b.height<=height+1,'touch control fits '+name+selector);}await phone.screenshot({path:path.join(OUT,`${name}.png`)});}
  await phone.setViewportSize({width:390,height:844});const b=await phone.locator('[data-move="right"]').boundingBox();const cd=await touch.newCDPSession(phone);const start=(await state(phone)).position;await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2,id:1}]});await phone.evaluate(()=>window.__lantern.step(.6));await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});check((await state(phone)).position.x>start.x+.1,'touch d-pad moves the hero');
  check(errors.length===0,'no browser or WebGL shader errors: '+errors.join('\n'));check(failures.length===0,'no failed runtime asset requests: '+failures.join('\n'));
  console.log(`PASS: ${checks} browser checks. Main quest, side quest, combat timing, save/reload, root/prefix deployment, desktop and four touch layouts. Screenshots: ${OUT}`);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
