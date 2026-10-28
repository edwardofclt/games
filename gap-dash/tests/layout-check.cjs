const {chromium,webkit}=require(process.env.PLAYWRIGHT_PATH || '/Users/eherbert/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try{
for(const [name,width,height] of [['phone',390,844],['narrow',320,568],['tablet',820,1180],['landscape',844,390],['desktop',1440,900]]){
const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,hasTouch:true});await page.goto('http://127.0.0.1:4172/');await page.waitForTimeout(120);await page.screenshot({path:`tests/${name}.png`});
const b=await page.locator('.game').boundingBox();assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=width&&b.y+b.height<=height);await page.close();}
const page=await browser.newPage();await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked storage');}});});await page.goto('http://127.0.0.1:4172/');await page.locator('canvas').click();await page.waitForTimeout(550);assert.equal(await page.locator('#score').textContent(),'1','blocked storage still permits scoring');
await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});assert.equal(await page.locator('#title').textContent(),'Take a breather.');console.log('Fresh layouts, blocked storage, visibility pause passed.');
}finally{await browser.close();}
})();
