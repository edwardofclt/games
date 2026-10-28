const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  let browser;try{browser=await engine.launch({headless:true,...(name==='chromium'?{channel:'chrome'}:{})});}catch(e){console.log(`${name} unavailable: ${e.message.split('\n')[0]}`);continue;}
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install({time:new Date('2026-10-28T16:00:00')});
  await page.goto('http://127.0.0.1:4171');await page.clock.runFor(40);
  await page.screenshot({path:`loop-hop/checks/${name}-phone.png`});
  await page.locator('#canvas').tap();assert.equal(await page.locator('body').getAttribute('data-state'),'running');
  await page.clock.runFor(3100);await page.keyboard.press('Space');await page.clock.runFor(1800);
  assert.equal(await page.locator('#score').textContent(),'1');
  await page.locator('#pause').click();assert.equal(await page.locator('body').getAttribute('data-state'),'paused');
  const held=await page.locator('#score').textContent();await page.clock.runFor(5000);assert.equal(await page.locator('#score').textContent(),held);
  await page.locator('#action').click();assert.equal(await page.locator('body').getAttribute('data-state'),'running');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));delete document.hidden;});assert.equal(await page.locator('body').getAttribute('data-state'),'paused');await page.locator('#action').click();
  await page.clock.runFor(6000);assert.equal(await page.locator('body').getAttribute('data-state'),'dead');
  await page.screenshot({path:`loop-hop/checks/${name}-failure.png`});
  await page.locator('#canvas').tap();assert.equal(await page.locator('#score').textContent(),'0');assert.equal(await page.locator('body').getAttribute('data-state'),'running');
  await page.reload();await page.clock.runFor(40);assert.equal(await page.locator('#best').textContent(),'1');
  for(const [label,width,height] of [['narrow',320,568],['tablet',768,1024],['landscape',844,390]]){
   await page.setViewportSize({width,height});await page.clock.runFor(60);
   const bounds=await page.locator('#action').boundingBox();assert.ok(bounds.y+bounds.height<=height);assert.ok(bounds.x>=0);
   await page.screenshot({path:`loop-hop/checks/${name}-${label}.png`});
  }
  await context.close();const fallback=await browser.newContext();await fallback.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('storage blocked');}});});
  const fp=await fallback.newPage();await fp.goto('http://127.0.0.1:4171');await fp.locator('#action').click();assert.equal(await fp.locator('body').getAttribute('data-state'),'running');
  assert.deepEqual(errors,[]);console.log(`${name}: start, touch, Space jump, score, pause/resume, failure, retry, persistent best, blocked storage, simulated page-hidden pause, phone/tablet/landscape passed`);
  await browser.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1});
