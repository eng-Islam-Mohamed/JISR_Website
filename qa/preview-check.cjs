const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const {createRequire} = require('node:module');
const qa = process.env.QA_NODE_MODULES ? createRequire(path.join(process.env.QA_NODE_MODULES,'_qa.cjs')) : require;
const {chromium}=qa('playwright');
const base=process.env.JISR_SITE_URL || 'http://127.0.0.1:4175';
(async()=>{
 const browser=await chromium.launch();
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[],downloads=[],installerRequests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('download',d=>downloads.push(d.suggestedFilename()));
 page.on('request',r=>{if(/\.apk(?:\?|$)/i.test(r.url()))installerRequests.push(r.url());});
 await page.goto(base);await page.waitForSelector('.cinema-loader',{state:'detached',timeout:20000});
 assert.equal(await page.locator('.cinema-photo img').evaluate(i=>i.naturalWidth),1536);
 const image=await page.request.get(base+'/assets/portal/jisr-connection.png');assert.equal(image.status(),200);
 const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
 assert.equal(hash(await image.body()),hash(fs.readFileSync(path.join(__dirname,'../assets/portal/jisr-connection.png'))));
 await page.mouse.move(10,300);await page.screenshot({path:path.join(__dirname,'customer-preview-desktop.png')});
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const lang of ['ar','fr','en']){
  await page.locator('.language-toggle').click();await page.locator(`[data-lang=${lang}]`).click();
  for(const width of [280,390,1440]){
   await page.setViewportSize({width,height:844});await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(100);
   assert((await page.evaluate(()=>document.documentElement.scrollWidth))<=width+1,`${lang}/${width} overflow`);
  }
  for(const selector of ['.nav-download','.cinema-actions button','.cinema-ready>button','#download-apk'])assert(await page.locator(selector).isDisabled(),`${selector} not disabled`);
  assert.equal(await page.locator('a[href*=".apk"],[download]').count(),0);
  await page.locator('#download').scrollIntoViewIfNeeded();
  await page.locator('#download-apk').evaluate(button=>button.click());
 }
 assert.deepEqual(downloads,[]);assert.deepEqual(installerRequests,[]);
 for(const resource of ['/downloads/jisr-android.apk','/downloads/release.json','/jisr-website-deploy.zip']){
  const response=await page.request.get(base+resource);assert.equal(response.status(),404,`${resource} must not be public`);
 }
 await page.setViewportSize({width:390,height:844});await page.locator('.language-toggle').click();await page.locator('[data-lang=ar]').click();await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:path.join(__dirname,'customer-preview-mobile.png')});
 await page.locator('[data-phrase=happy]').click();assert.equal(await page.locator('#demo-phrase').textContent(),'أنا سعيد');
 await page.locator('[data-screen=settings]').click();assert((await page.locator('#showcase-screen').getAttribute('src')).endsWith('settings-ar.png'));
 const noJS=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});await noJS.goto(base);assert(await noJS.locator('#download-apk').isDisabled());assert.equal(await noJS.locator('a[href*=".apk"],[download]').count(),0);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({base,approvedImage:'Exact PNG hash matches',locales:'AR/FR/EN at 280/390/1440: no overflow',downloads:'All four controls disabled; no download events or installer requests',directURLs:'APK, release metadata and old deployment archive return 404',noJS:'Download remains disabled',interaction:'Pictogram and screenshot tabs work',errors},null,2));
 await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
