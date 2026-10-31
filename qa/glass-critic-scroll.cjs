const {chromium}=require('C:/Users/ASUS TUF GAMING 15/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path=require('node:path');
const fs=require('node:fs');
const out=process.env.CRITIC_OUT?path.resolve(process.env.CRITIC_OUT):__dirname;
fs.mkdirSync(out,{recursive:true});
(async()=>{
const browser=await chromium.launch({headless:true});
const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
await p.goto('http://127.0.0.1:4173');await p.evaluate(()=>document.fonts.ready);
await p.locator('.language-toggle').click();await p.locator('[data-lang=en]').click();
await p.mouse.move(0,0);
const y=await p.locator('#inside').evaluate(e=>e.getBoundingClientRect().top+scrollY);
await p.evaluate(y=>{document.activeElement.blur();scrollTo(0,y+330)},y);
await p.screenshot({path:path.join(out,'glass-critic-mobile-scrolled.png')});
console.log(await p.evaluate(()=>({scroll:scrollY,active:document.activeElement.tagName,skipFocus:document.querySelector('.skip').matches(':focus'),header:document.querySelector('.header').getBoundingClientRect().toJSON()})));
await browser.close();
})();
