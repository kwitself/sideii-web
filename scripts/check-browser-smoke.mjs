import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let chromium;try{({chromium}=require('playwright'))}catch{({chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright'))}

// Browser-only, read-only smoke: NO order submission, payment, email, or DB writes.
const base=(process.env.BROWSER_BASE_URL||'http://127.0.0.1:3000').replace(/\/$/,'');
assert.ok(/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(base),'Use an isolated local app');
const browser=await chromium.launch({headless:true,executablePath:process.env.SIDEII_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const viewport of [320,375,390,428,768,1024,1440,1920].map(width=>({width,height:900}))){
  const page=await browser.newPage({viewport,deviceScaleFactor:1});
  const errors=[];
  await page.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.origin===base)return route.continue();
   if(url.hostname!=='127.0.0.1')return route.abort();
   const name=url.pathname.split('/').pop();
   const data=name==='get_store_localization'?{rates:[],locales:[]}:name==='get_store_payment_mode'?{mode:'manual_link',provider:'iyzico_link',enabled:true,extra_support_enabled:false}:name==='quote_store_order_v4'?{subtotal:120,total:120,shipping_total:0,discount_total:0}:[];
   assert.ok(!/create_store_order|apply_payment|refund|notifications/.test(url.pathname),'No business operations in browser smoke');
   return route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
  });
  page.on('pageerror',e=>errors.push(e.message));
  for(const path of ['/','/store','/store?media=vinyl','/store?media=cd','/store?media=digital','/wear','/bundles']){
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
   // The closed drawer is translated off-screen, so Playwright can still deem
   // it "visible". Wait for React's open/accessibility state after each action.
   const openDrawer=page.locator('aside.globalBagDrawer.open[aria-hidden="false"]');
   await openDrawer.waitFor({state:'visible',timeout:10000});
   assert.equal(await drawer.getAttribute('aria-hidden'),'false','Open bag must be accessible');
   assert.equal(await bag.count(),0,'Floating bag trigger should hide while drawer is open');
   // Keyboard Escape must close the dialog and restore usable focus.
   await page.keyboard.press('Escape');
   await bag.waitFor({state:'visible',timeout:10000});
   assert.equal(await drawer.getAttribute('aria-hidden'),'true','Escape should dismiss cart');
   await bag.focus();
   await page.keyboard.press('Enter');
   await openDrawer.waitFor({state:'visible',timeout:10000});
   assert.equal(await drawer.getAttribute('aria-hidden'),'false','Keyboard Enter should reopen cart');
   await page.locator('button.globalBagClose').click();
   await bag.waitFor({state:'visible',timeout:10000});
   assert.equal(await drawer.getAttribute('aria-hidden'),'true','Closed bag must be hidden from accessibility tree');
   console.log(`PASS bag open/close ${path} @${viewport.width}px`);
   assert.ok(errors.length===0,`${path} @${viewport.width}px: uncaught browser JS error: ${errors.join(' | ')}`);
  }
  // Account and checkout are drawers, not standalone routes in this architecture.
  await page.goto(base+'/store');
  await page.locator('.globalAccountTrigger').click();await page.locator('.globalAccountDrawer.open').waitFor();
  await page.keyboard.press('Tab');assert.ok(await page.locator('.globalAccountDrawer').evaluate(el=>el.contains(document.activeElement)));
  await page.keyboard.press('Escape');await page.locator('.globalAccountTrigger').waitFor({state:'visible'});
  await page.evaluate(()=>{
   const cart=[{key:'local-only',variantId:'22222222-2222-4222-8222-222222222222',sku:'LOCAL-TEST',title:'Browser fixture',catalogue:'LOCAL',format:'CD',price:120,qty:1,stock:5}];
   localStorage.setItem('sideii_cart_v1',JSON.stringify(cart));window.dispatchEvent(new CustomEvent('sideii-cart',{detail:cart}));
  });
  await page.locator('.globalBagTrigger').click();await page.getByRole('button',{name:'CHECKOUT →',exact:true}).click();
  await page.locator('.globalCheckout').waitFor({state:'visible'});
  const checkoutOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.ok(checkoutOverflow<=4,'Checkout must fit '+viewport.width);
  await page.keyboard.press('Escape');
  const missing=await page.goto(base+'/store/qa-hidden-browser-fixture');assert.equal(missing.status(),404,'Hidden/missing product must not be publicly rendered');
  assert.deepEqual(errors,[],'Public drawer and checkout runtime errors');
  await page.close();
 }
 console.log('Browser smoke: 7 storefront views, account, cart, checkout form and hidden-product 404 verified at all 8 widths (no order submission).');
}finally{await browser.close()}
