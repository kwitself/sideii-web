import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Browser-only, read-only smoke: NO order submission, payment, email, or DB writes.
const base=(process.env.BROWSER_BASE_URL||'http://127.0.0.1:3000').replace(/\/$/,'');
const browser=await chromium.launch({headless:true});
try{
 for(const viewport of [{width:320,height:720},{width:375,height:812},{width:768,height:1024},{width:1440,height:900},{width:1920,height:1080}]){
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
   assert.ok(state.horizontalOverflow<=4,`${path} @${viewport.width}px: horizontal overflow ${state.horizontalOverflow}px`);
   // A small pixel tolerance accommodates fractional rendering differences.
   console.log(JSON.stringify({page:path,viewport:viewport.width,title:state.title,
    horizontalOverflowPx:state.horizontalOverflow,jsErrors:errors.slice(-5)}));
   // Exercise the real shared cart drawer without modifying cart contents or submitting checkout.
   const bag=page.locator('button.globalBagTrigger');
   await bag.waitFor({state:'visible',timeout:15000});
   await bag.click();
   const drawer=page.locator('aside.globalBagDrawer[role="dialog"]');
   await drawer.waitFor({state:'visible',timeout:10000});
   assert.equal(await drawer.getAttribute('aria-hidden'),'false','Open bag must be accessible');
   assert.equal(await bag.count(),0,'Floating bag trigger should hide while drawer is open');
   // Keyboard Escape must close the dialog and restore usable focus.
   await page.keyboard.press('Escape');
   await bag.waitFor({state:'visible',timeout:10000});
   assert.equal(await drawer.getAttribute('aria-hidden'),'true','Escape should dismiss cart');
   await bag.focus();
   await page.keyboard.press('Enter');
   await drawer.waitFor({state:'visible',timeout:10000});
   assert.equal(await drawer.getAttribute('aria-hidden'),'false','Keyboard Enter should reopen cart');
   await page.locator('button.globalBagClose').click();
   await bag.waitFor({state:'visible',timeout:10000});
   assert.equal(await drawer.getAttribute('aria-hidden'),'true','Closed bag must be hidden from accessibility tree');
   console.log(`PASS bag open/close ${path} @${viewport.width}px`);
   assert.ok(errors.length===0,`${path} @${viewport.width}px: uncaught browser JS error: ${errors.join(' | ')}`);
  }
  await page.close();
 }
 console.log('Browser smoke: home/store and bag open/close verified at 320, 375, 768, 1440 and 1920 pixels (no checkout submission).');
}finally{await browser.close()}
