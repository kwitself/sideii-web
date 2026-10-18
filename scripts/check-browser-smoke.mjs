import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Browser-only, read-only smoke: NO order submission, payment, email, or DB writes.
const base=(process.env.BROWSER_BASE_URL||'http://127.0.0.1:3000').replace(/\/$/,'');
const browser=await chromium.launch({headless:true});
try{
 for(const viewport of [{width:375,height:812},{width:768,height:1024},{width:1440,height:900}]){
  const page=await browser.newPage({viewport,deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  for(const path of ['/','/store']){
   const response=await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:30000});
   assert.equal(response?.status(),200,`Browser ${path} returned ${response?.status()}`);
   await page.locator('body').waitFor();
   const state=await page.evaluate(()=>({
    title:document.title,
    content:document.body?.innerText?.trim().length||0,
    horizontalOverflow:document.documentElement.scrollWidth-window.innerWidth
   }));
   assert.ok(state.title.length>0,`${path}: missing document title`);
   assert.ok(state.content>30,`${path}: no visible document content`);
   // Report overflow, but avoid false launch failures from decorative full-bleed sections.
   console.log(JSON.stringify({page:path,viewport:viewport.width,title:state.title,
    horizontalOverflowPx:state.horizontalOverflow,jsErrors:errors.slice(-5)}));
   assert.ok(errors.length===0,`${path} @${viewport.width}px: uncaught browser JS error: ${errors.join(' | ')}`);
  }
  await page.close();
 }
 console.log('Browser smoke: home/store rendered at 375, 768 and 1440 pixels (no checkout submission).');
}finally{await browser.close()}
