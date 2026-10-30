const {chromium,webkit}=require(process.env.PLAYWRIGHT_PATH||'/Users/eherbert/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const OUT=path.join(__dirname,'screenshots');fs.mkdirSync(OUT,{recursive:true});
const ROOT=process.env.GAME_ROOT||'http://127.0.0.1:4170';
const PREFIX=process.env.PREFIX_ROOT||'http://127.0.0.1:4175/edwardofclt-gamestudio';
const KEY='dawn-isle.chapter-one.v1';
const runtimeErrors=[];
function observe(page){page.on('pageerror',e=>runtimeErrors.push(e.message));}
async function clock(page){await page.addInitScript(()=>{
 window.__clock=0;window.__frames=[];
 Object.defineProperty(performance,'now',{value:()=>window.__clock});
 window.requestAnimationFrame=callback=>{window.__frames.push(callback);return window.__frames.length;};
 window.__advance=ms=>{for(let n=0;n<ms;n+=1000/60){window.__clock+=Math.min(1000/60,ms-n);const queue=window.__frames.splice(0);queue.forEach(callback=>callback(window.__clock));}};
});}
const advance=(page,ms)=>page.evaluate(ms=>window.__advance(ms),ms);
async function hold(page,key,ms){await page.keyboard.down(key);await advance(page,ms);await page.keyboard.up(key);}
async function press(page,key){await page.keyboard.press(key);await advance(page,20);}
async function load(page,save){
 await page.goto(`${ROOT}/`);
 await page.evaluate(({KEY,save})=>save?localStorage.setItem(KEY,JSON.stringify(save)):localStorage.removeItem(KEY),{KEY,save});
 await page.goto(`${ROOT}/dawn-isle/index.html`);await advance(page,20);await page.locator('#primary').click();await advance(page,20);
}
function fixture(flags,checkpoint){return {version:1,flags:{blade:true,trial:false,boots:false,boss:false,fire:false,...flags},checkpoint};}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:2});
  const page=await context.newPage();observe(page);await clock(page);await load(page,null);
  await hold(page,'ArrowUp',350);await press(page,'Space');
  assert.match(await page.locator('#dialogue-text').textContent(),/shrine chose you/);
  assert.equal(await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)).flags.blade,KEY),true);
  for(let i=0;i<3;i++)await press(page,'Space');
  assert.equal(await page.locator('#dialogue').isHidden(),true);
  await page.getByRole('button',{name:'Pause game'}).click();assert.equal(await page.locator('#modal-title').textContent(),'Journey paused');
  await page.getByRole('button',{name:'Resume journey'}).click();
  await hold(page,'ArrowDown',400);
  const cdp=await context.newCDPSession(page);
  const right=await page.getByRole('button',{name:'Move right',exact:true}).boundingBox();
  const attack=await page.getByRole('button',{name:'Sword or interact'}).boundingBox();
  const p1={x:right.x+right.width/2,y:right.y+right.height/2,id:1};
  const p2={x:attack.x+attack.width/2,y:attack.y+attack.height/2,id:2};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p1]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p1,p2]});
  await advance(page,200);assert.equal(await page.locator('[data-control].pressed').count(),2);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await advance(page,20);
  assert.equal(await page.locator('[data-control].pressed').count(),0);
  for(const [name,width,height] of [['phone',390,844],['narrow',320,568],['landscape',844,390],['tablet',820,1180],['tablet-landscape',1180,820]]){
   await page.setViewportSize({width,height});await advance(page,20);
   if(await page.locator('#modal').isVisible()&&await page.locator('#modal-title').textContent()==='Journey paused')await page.locator('#primary').click();
   const screen=await page.locator('#screen').boundingBox();
   const buttons=await page.locator('[data-control="down"], [data-control="action"], [data-control="item"]').all();
   for(const button of buttons){const b=await button.boundingBox();assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=width+1&&b.y+b.height<=height+1,`${name} action fits`);}
   assert.ok(screen.x>=0&&screen.y>=0&&screen.x+screen.width<=width+1&&screen.y+screen.height<=height+1,`${name} screen fits`);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${name} horizontal overflow`);
   await page.screenshot({path:path.join(OUT,`${name}.png`)});
  }
  await page.setViewportSize({width:390,height:844});await advance(page,20);
  await load(page,fixture({trial:true},'treasure'));
  await hold(page,'ArrowLeft',745);await hold(page,'ArrowUp',10);await press(page,'Space');
  assert.match(await page.locator('#dialogue-text').textContent(),/Gust Boots/);
  assert.equal(await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)).flags.boots,KEY),true);
  for(let i=0;i<3;i++)await press(page,'Space');
  assert.equal(await page.locator('#item-name').textContent(),'GUST BOOTS');
  await page.locator('#equip').click();assert.equal(await page.locator('#item-name').textContent(),'SHIELD');
  await page.locator('#equip').click();await page.reload();await page.locator('#primary').click();
  assert.equal(await page.locator('#item-name').textContent(),'GUST BOOTS','boots survive reload');
  await load(page,fixture({trial:true,boots:true,boss:true},'boss'));
  await hold(page,'ArrowRight',2210);await hold(page,'ArrowUp',745);await hold(page,'ArrowRight',10);await press(page,'Space');
  assert.equal(await page.locator('#modal-title').textContent(),'The first light');
  assert.equal(await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)).flags.fire,KEY),true);
  await page.screenshot({path:path.join(OUT,'chapter-complete.png')});
  await page.reload();await page.locator('#primary').click();assert.equal(await page.locator('#modal-title').textContent(),'The first light','completion survives reload');
  await page.locator('#restart').click();assert.equal(await page.locator('#modal-title').textContent(),'Start over?');
  await page.locator('#secondary').click();assert.equal(await page.locator('#modal-title').textContent(),'The first light');
  await page.locator('#restart').click();await page.locator('#primary').click();
  assert.equal(await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)).flags.blade,KEY),false,'explicit restart clears progress');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  assert.equal(await page.locator('#modal-title').textContent(),'Journey paused');
  const blocked=await context.newPage();observe(blocked);await clock(blocked);
  await blocked.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error('storage blocked');};Storage.prototype.setItem=()=>{throw new Error('storage blocked');};});
  await blocked.goto(`${ROOT}/dawn-isle/index.html`);await blocked.locator('#primary').click();await advance(blocked,50);
  assert.equal(await blocked.locator('#save-status').textContent(),'SESSION SAVE');await blocked.close();
  const linksPage=await context.newPage();observe(linksPage);const bad=[];
  linksPage.on('response',response=>{if(response.status()>=400)bad.push(`${response.status()} ${response.url()}`);});
  for(const base of [ROOT,PREFIX]){
   await linksPage.goto(`${base}/`);const links=await linksPage.locator('.games a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
   assert.equal(links.length,4);
   for(const link of links){await linksPage.goto(new URL(link,`${base}/`).href);await linksPage.locator('canvas').waitFor();await linksPage.waitForLoadState('networkidle');}
  }
  assert.deepEqual(bad,[],'root/subpath assets all load');assert.deepEqual(runtimeErrors,[]);
  console.log('PASS: keeper/equipment, two-pointer touch, pause, five layouts, chest/reload, completion/reload, reset, hidden-page pause, blocked storage; all four games and assets under root and repository prefix.');
  await context.close();
 }finally{await browser.close();}
 try{
  const b=await webkit.launch({headless:true});
  try{const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true});await p.goto(`${ROOT}/dawn-isle/index.html`);await p.locator('#primary').tap();await p.getByRole('button',{name:'Move up',exact:true}).tap();console.log('PASS: desktop WebKit page and touch controls load.');}finally{await b.close();}
 }catch(e){console.log('WebKit unavailable:',e.message.split('\n')[0]);}
})().catch(e=>{console.error(e);process.exitCode=1;});
