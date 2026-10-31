const fs=require('node:fs');
const {chromium}=require('C:/Users/ASUS TUF GAMING 15/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch();const results=[];
 for(const width of [1280,390])for(const scheme of ['light','dark']){
 const page=await browser.newPage({viewport:{width,height:844},colorScheme:scheme});
 await page.goto('http://127.0.0.1:4173');await page.waitForSelector('.cinema-loader',{state:'detached',timeout:18000});
 await page.mouse.move(-10,-10);
 for(const lang of ['ar','fr','en']){
 await page.locator('.language-toggle').click();await page.locator(`[data-lang=${lang}]`).click();await page.mouse.move(-10,-10);
 await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(850);
 await page.screenshot({path:`${__dirname}/cinema-critic-${width}-${scheme}-${lang}-intro.png`});
 await page.evaluate(()=>scrollTo({top:innerHeight*1.6,behavior:'instant'}));await page.waitForTimeout(1700);
 await page.screenshot({path:`${__dirname}/cinema-critic-${width}-${scheme}-${lang}-ready.png`});
 results.push({width,scheme,lang,ready:await page.locator('.cinema-ready').getAttribute('aria-hidden'),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>scrollTo({top:innerHeight*.8,behavior:'instant'}));await page.waitForTimeout(900);
 await page.screenshot({path:`${__dirname}/cinema-critic-${width}-${scheme}-reduced.png`});
 if(scheme==='light'){
 await page.locator('.ghost-pet').focus();await page.keyboard.press('Enter');await page.waitForTimeout(70);results.push({width,press:await page.locator('.ghost-canvas').getAttribute('data-expression')});
 await page.locator('.ghost-toggle').click();results.push({width,hidden:await page.locator('.ghost-canvas').isHidden()});await page.locator('.ghost-toggle').click();
 if(width>1000){await page.locator('.main-nav a').first().click();await page.waitForTimeout(900);await page.screenshot({path:`${__dirname}/cinema-critic-${width}-nav.png`});}
 for(const lang of ['ar','fr','en']){
 await page.locator('.language-toggle').click();await page.locator(`[data-lang=${lang}]`).click();
 await page.locator('#experience').scrollIntoViewIfNeeded();await page.waitForTimeout(400);await page.screenshot({path:`${__dirname}/cinema-critic-${width}-${lang}-lower.png`});
 }
 await page.locator('#download').scrollIntoViewIfNeeded();await page.waitForTimeout(400);await page.screenshot({path:`${__dirname}/cinema-critic-${width}-download.png`});
 const pending=page.waitForEvent('download');await page.locator('#download-apk').click();const d=await pending;results.push({width,download:d.suggestedFilename(),bytes:fs.statSync(await d.path()).size});
 }
 await page.close();
 }
 fs.writeFileSync(`${__dirname}/cinema-critic-results.json`,JSON.stringify(results,null,2));await browser.close();console.log(JSON.stringify(results));
})().catch(e=>{console.error(e);process.exit(1)});
