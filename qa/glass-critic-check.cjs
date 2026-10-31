const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require('C:/Users/ASUS TUF GAMING 15/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=process.env.CRITIC_OUT?path.resolve(process.env.CRITIC_OUT):__dirname;
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true});
 const results={screens:[],interactions:[],errors:[]};
 for(const colorScheme of ['light','dark']) {
  const page=await browser.newPage({viewport:{width:1280,height:960},colorScheme,reducedMotion:'reduce'});
  page.on('pageerror',e=>results.errors.push(e.message));
  await page.goto('http://127.0.0.1:4173');
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForFunction(()=>document.querySelector('.hero-stage').dataset.renderer);
  for(const lang of ['ar','en','fr']) {
   await page.locator('.language-toggle').click();
   await page.locator(`[data-lang=${lang}]`).click();
   for(const width of [1280,390]) {
    await page.setViewportSize({width,height:width===390?844:960});
    await page.evaluate(()=>scrollTo(0,0));
    await page.mouse.move(0,0);
    await page.waitForTimeout(120);
    const name=`glass-critic-${width}-${colorScheme}-${lang}.png`;
    await page.screenshot({path:path.join(out,name),fullPage:true});
    const metrics=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth,renderer:document.querySelector('.hero-stage').dataset.renderer,canvas:document.querySelector('canvas').dataset.drawn}));
    results.screens.push({name,...metrics});
    if(colorScheme==='light') {
     await page.locator('.hero').screenshot({path:path.join(out,`glass-critic-${width}-${lang}-hero.png`)});
     if(lang==='en') {
      for(const [selector,name] of [['.demo-composition','demo'],['#inside','inside']]) {
       await page.locator(selector).screenshot({path:path.join(out,`glass-critic-${width}-${name}.png`)});
      }
     }
    }
   }
  }
  await page.close();
 }
 const p=await browser.newPage({viewport:{width:1280,height:960},reducedMotion:'no-preference'});
 await p.goto('http://127.0.0.1:4173');
 await p.waitForFunction(()=>document.querySelector('.hero-stage').dataset.renderer==='webgl');
 await p.evaluate(()=>document.fonts.ready);
 await p.locator('.language-toggle').click(); await p.locator('[data-lang=en]').click();
 await p.mouse.move(0,0);
 const before=await p.locator('.crystal-scene').screenshot();
 const stage=await p.locator('.hero-stage').boundingBox();
 await p.mouse.move(stage.x+stage.width*.8,stage.y+stage.height*.3); await p.waitForTimeout(500);
 const after=await p.locator('.crystal-scene').screenshot();
 assert(!before.equals(after),'Sculpture pointer response changes pixels');
 results.interactions.push('WebGL pointer response changes actual rendered pixels');
 await p.mouse.move(0,0); await p.waitForTimeout(600);
 await p.locator('.hero-stage').screenshot({path:path.join(out,'glass-critic-native-stage.png')});
 const links=p.locator('.main-nav a'); const lens=p.locator('.nav-lens');
 const x1=(await lens.boundingBox()).x;
 await links.nth(2).hover(); await p.waitForTimeout(600);
 const x2=(await lens.boundingBox()).x; assert(Math.abs(x1-x2)>20);
 await links.nth(2).click(); assert.equal(new URL(p.url()).hash,'#questions');
 results.interactions.push('Nav lens moves to hovered control and navigation click reaches Questions');
 await p.locator('[data-phrase=happy]').click(); assert.equal(await p.locator('#demo-phrase').innerText(),'I am happy');
 await p.locator('[data-phrase=food]').click(); assert.equal(await p.locator('[data-phrase=food]').getAttribute('aria-pressed'),'true');
 results.interactions.push('Pictogram controls update phrase and selection');
 for(const lang of ['ar','en','fr']) {
  await p.locator('.language-toggle').click();await p.locator(`[data-lang=${lang}]`).click();
  for(const tab of ['gallery','detail','settings']) {
   await p.locator(`[data-screen=${tab}]`).click();
   assert((await p.locator('#showcase-screen').getAttribute('src')).endsWith(`${tab}-${lang}.png`));
  }
 }
 results.interactions.push('All nine showcase locale/tab combinations load matching screenshot');
 for(const summary of await p.locator('summary').all()) {await summary.click();assert(await summary.evaluate(e=>e.parentElement.open));await summary.click();}
 results.interactions.push('Every FAQ disclosure opens and closes');
 await p.locator('#motion-toggle').click();assert.equal(await p.locator('html').getAttribute('data-motion'),'reduced');
 await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(200);
 const rb=await p.locator('.crystal-scene').screenshot();
 await p.mouse.move(stage.x+stage.width*.8,stage.y+stage.height*.2);await p.waitForTimeout(300);
 const ra=await p.locator('.crystal-scene').screenshot();assert(rb.equals(ra));
 results.interactions.push('Reduced motion freezes rendered sculpture response');
 fs.writeFileSync(path.join(out,'glass-critic-results.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify(results,null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
