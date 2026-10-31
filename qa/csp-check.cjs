const {createRequire}=require('node:module');
const path=require('node:path');
const fs=require('node:fs');
const qa=process.env.QA_NODE_MODULES?createRequire(path.join(process.env.QA_NODE_MODULES,'_qa.cjs')):require;
const{chromium}=qa('playwright');
(async()=>{
 const browser=await chromium.launch();const page=await browser.newPage({reducedMotion:'reduce'});const errors=[];
 const policy=fs.readFileSync(path.join(__dirname,'../_headers'),'utf8').split('\n').find(line=>line.includes('Content-Security-Policy:')).split(':').slice(1).join(':').trim();
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('http://127.0.0.1:4173/',async route=>{
  const response=await route.fetch();await route.fulfill({response,headers:{...response.headers(),'content-security-policy':policy}});
 });
 await page.goto('http://127.0.0.1:4173');await page.waitForSelector('.cinema-loader',{state:'detached'});
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Production CSP: cinematic page initializes without script errors.');
 await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
