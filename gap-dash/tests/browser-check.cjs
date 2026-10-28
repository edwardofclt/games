const {chromium,webkit}=require(process.env.PLAYWRIGHT_PATH || '/Users/eherbert/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try{
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.framesToRun=[];window.requestAnimationFrame=f=>{window.framesToRun.push(f);return 1;};window.testTime=100;window.advance=ms=>{for(let elapsed=0;elapsed<ms;elapsed+=5){window.testTime+=Math.min(5,ms-elapsed);const q=window.framesToRun.splice(0);q.forEach(f=>f(window.testTime));}};});
await page.goto('http://127.0.0.1:4172/');
const advance=ms=>page.evaluate(ms=>advance(ms),ms);
const tap=()=>page.locator('canvas').tap({position:{x:70,y:260}});
await advance(10);await page.screenshot({path:'tests/phone.png'});
await tap();await advance(480);assert.equal(await page.locator('#score').textContent(),'1','first crossing scores');
await tap();await tap();await advance(480);assert.equal(await page.locator('#score').textContent(),'2','mid-flight tap does not queue');
await advance(100);assert.equal(await page.locator('#score').textContent(),'2');
await tap();await advance(300);assert.equal(await page.locator('#title').textContent(),'Bump. Try again.');await page.screenshot({path:'tests/failure.png'});
await page.getByRole('button',{name:'Try again'}).click();assert.equal(await page.locator('#score').textContent(),'0');assert.equal(await page.locator('#best').textContent(),'2');
await page.getByRole('button',{name:'Pause game'}).click();await advance(2000);assert.equal(await page.locator('#title').textContent(),'Take a breather.');
await page.getByRole('button',{name:'Resume route'}).click();await page.keyboard.press('Space');await advance(480);assert.equal(await page.locator('#score').textContent(),'1','pause freezes simulation');
await page.reload();assert.equal(await page.locator('#best').textContent(),'2','best survives reload');await advance(10);await page.keyboard.press('Space');
await page.setViewportSize({width:844,height:390});await advance(10);assert.equal(await page.locator('#title').textContent(),'Take a breather.','rotation pauses crossing');
await page.getByRole('button',{name:'Resume route'}).click();
for(const [name,width,height] of [['narrow',320,568],['tablet',820,1180],['landscape',844,390],['desktop',1440,900]]){await page.setViewportSize({width,height});await advance(10);await page.screenshot({path:`tests/${name}.png`});const b=await page.locator('.game').boundingBox();console.log(name,b);assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=width&&b.y+b.height<=height,`${name} fits`);assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight),false);}
assert.deepEqual(errors,[]);console.log('Chromium: start, 2 scores, ignored midflight tap, failure, retry, pause/resume, Space, persistence, rotation, and 4 layouts passed.');
}finally{await browser.close();}
try{const b=await webkit.launch({headless:true,...(process.env.WEBKIT_PATH?{executablePath:process.env.WEBKIT_PATH}:{})});const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true});await p.goto('http://127.0.0.1:4172/');await p.locator('canvas').tap();await p.waitForTimeout(600);console.log('WebKit score after tap:',await p.locator('#score').textContent());await b.close();}catch(e){console.log('WebKit unavailable:',e.message.split('\n')[0]);}
})().catch(e=>{console.error(e);process.exitCode=1;});
