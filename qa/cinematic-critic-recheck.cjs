const fs=require('node:fs');
const {chromium}=require('C:/Users/ASUS TUF GAMING 15/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const b=await chromium.launch();const checks=[];
for(const width of [1280,390]){
 const p=await b.newPage({viewport:{width,height:844},reducedMotion:'reduce'});await p.goto('http://127.0.0.1:4173');await p.waitForSelector('.cinema-loader',{state:'detached',timeout:18000});
 for(const lang of ['ar','fr','en']){
  await p.locator('.language-toggle').click();await p.locator(`[data-lang=${lang}]`).click();await p.mouse.move(-10,-10);
  for(const progress of [.44,.45,.533,.60]){await p.evaluate(v=>scrollTo({top:innerHeight*1.5*v,behavior:'instant'}),progress);await p.waitForTimeout(350);const state=await p.evaluate(()=>({progress:document.querySelector('.cinema').dataset.progress,ready:getComputedStyle(document.querySelector('.cinema-ready')).opacity,old:getComputedStyle(document.querySelector('.cinema-copy')).opacity,hidden:document.querySelector('.cinema-ready').getAttribute('aria-hidden')}));checks.push({width,lang,target:progress,...state});if(progress===.533)await p.screenshot({path:`${__dirname}/cinema-recheck-${width}-${lang}-reduced.png`});}
 }
 if(width===1280){await p.emulateMedia({reducedMotion:'no-preference'});for(const lang of ['en','fr']){await p.locator('.language-toggle').click();await p.locator(`[data-lang=${lang}]`).click();await p.mouse.move(-10,-10);await p.evaluate(()=>scrollTo({top:innerHeight*1.6,behavior:'instant'}));await p.waitForTimeout(1800);await p.screenshot({path:`${__dirname}/cinema-recheck-${width}-${lang}-ready.png`});}}
 else{await p.locator('#download').scrollIntoViewIfNeeded();await p.waitForTimeout(800);await p.screenshot({path:`${__dirname}/cinema-recheck-390-download.png`});checks.push(await p.evaluate(()=>{const r=document.querySelector('#download-apk').getBoundingClientRect(),c=document.querySelector('.ghost-canvas'),pet=document.querySelector('.ghost-pet');return {companionOpacity:getComputedStyle(c).opacity,companionPointerEvents:getComputedStyle(pet).pointerEvents,rightOfDownload:document.elementFromPoint(r.right-45,r.top+r.height/2)?.closest('a')?.id};}));
 const down=p.waitForEvent('download');await p.locator('#download-apk').click({position:{x:290,y:28}});checks.push({rightSideDownload:(await down).suggestedFilename()});}
 await p.close();
}fs.writeFileSync(`${__dirname}/cinema-recheck-results.json`,JSON.stringify(checks,null,2));console.log(JSON.stringify(checks));await b.close();})().catch(e=>{console.error(e);process.exit(1)});
