import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let chromium;try{({chromium}=require('playwright'))}catch{({chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright'))}
const base=process.env.SIDEII_BASE_URL||'http://127.0.0.1:3000';
assert.ok(/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(base),'Run against isolated local app only');
const out=process.env.SIDEII_QA_OUTPUT||'/tmp/sideii-admin-qa';mkdirSync(out,{recursive:true});
const widths=(process.env.SIDEII_QA_WIDTHS||'320,375,390,428,768,1024,1440,1920').split(',').map(Number);
const views=['overview','products','preview','merchandising','orders','inventory','customers','commerce','catalogue','growth','impact','fulfillment','localization','settings','launch','seo','emails','finance'];
const products=[{id:'11111111-1111-4111-8111-111111111111',catalogue_no:'SII-009',slug:'studio-edition',title:'Studio Edition',artist_project:'Independent Artist',description:'Local browser test fixture',status:'draft',is_public:false,product_type:'release',imprint:'sideii',artwork_path:'cover.png',storefront_config:{},seo_config:{},commerce_config:{},product_variants:[{id:'22222222-2222-4222-8222-222222222222',sku:'SII-009-CD',format:'cd',active:true,price:120,currency:'TRY',stock_qty:5,reserved_qty:1,manufactured_qty:5,low_stock_threshold:2}]},{id:'33333333-3333-4333-8333-333333333333',title:'QA Digital Edition',catalogue_no:'QA-003',slug:'qa-digital',status:'active',is_public:false,product_type:'release',product_variants:[{id:'44444444-4444-4444-8444-444444444444',sku:'QA-DIG',format:'digital',active:true,price:50,currency:'TRY',stock_qty:0,reserved_qty:0,low_stock_threshold:5}]}];
const orders=[{id:'55555555-5555-4555-8555-555555555555',order_no:42,email:'qa@example.invalid',shipping_name:'Local Test Customer',payment_status:'unpaid',status:'pending',fulfillment_type:'shipping',total:120,subtotal:120,currency:'TRY',created_at:'2026-10-18T10:00:00Z',order_items:[{id:'66666666-6666-4666-8666-666666666666',sku:'SII-009-CD',title:'Studio Edition',format:'cd',quantity:1,unit_price:120,line_total:120,variant_id:products[0].product_variants[0].id}]}];
const customers=[{id:'c1',full_name:'Local Test Customer',email:'qa@example.invalid',created_at:'2026-10-18T10:00:00Z'}];
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="#343434"/><text x="60" y="120" font-size="48" fill="white">Studio Edition</text></svg>';
const user={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',aud:'authenticated',email:'admin@example.invalid',app_metadata:{role:'admin'},user_metadata:{},created_at:'2026-01-01T00:00:00Z'};
const token=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:user.id,role:'authenticated',exp:4102444800,app_metadata:{role:'admin'}})).toString('base64url')+'.test';
const session={access_token:token,refresh_token:'test-only',token_type:'bearer',expires_in:3600,expires_at:4102444800,user};
const browser=await chromium.launch({headless:true,executablePath:process.env.SIDEII_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
let failureRpc='',nonAdmin=false,empty=false,writeScenario='';
const mutations=[],requests=[],errors=[],results=[];
await context.addInitScript(s=>{if(window.top===window)localStorage.setItem('sb-127-auth-token',JSON.stringify(s));},session);
await context.route('**/*',async route=>{
 const req=route.request(),url=new URL(req.url());
 const json=(body,status=200,headers={})=>route.fulfill({status,contentType:'application/json',headers,body:JSON.stringify(body)});
 if(url.origin===base){
  if(url.pathname==='/api/admin/provider-status')return json({ok:true,checks:[]});
  if(url.pathname==='/api/admin/notification-overview')return json({ok:true,counts:{},recent:[],runner:{}});
  if(url.pathname.startsWith('/api/')&&req.method()!=='GET'){mutations.push(url.pathname);return json({ok:true})}
  return route.continue();
 }
 // No browser request reaches a real Supabase project, mail provider or payment service.
 if(url.hostname!=='127.0.0.1'){return route.abort()}
 if(url.pathname.startsWith('/auth/v1'))return json(url.pathname.endsWith('/user')?{...user,app_metadata:nonAdmin?{}:user.app_metadata}:session);
 if(url.pathname.startsWith('/storage/'))return route.fulfill({status:200,contentType:'image/svg+xml',body:svg});
 requests.push(url.pathname);
 if(url.pathname.includes('/rpc/')){
  const name=url.pathname.split('/').pop();
  if(name===failureRpc)return json({message:'Simulated finance outage',code:'TEST'},500);
  const objects={get_store_localization:{rates:[],locales:[]},admin_finance_read:{settings:{sales_vat_rate:20,shipping_vat_rate:20,prices_include_vat:true},expenses:[]},admin_finance_snapshot_status:{captured:0,legacy_without_snapshot:0,cost_missing:0,vat_unconfigured:0},admin_finance_parties_read:{parties:[],entries:[]},admin_commerce_expansion_snapshot:{},admin_commerce_expansion_data:{},admin_final_qa_health:{checks:[],ready:0,total:0}};
  if(name in objects)return json(objects[name]);
  if(name==='suggest_catalogue_no')return json('SII-010');
  if(!/^(get_|admin_get_|admin_sales_report$|admin_stock_alerts$|admin_finance_list_|admin_(list|finance_.*(read|status|audit|summary|reconciliation|variances|integrity|review)|audit_feed|royalty_report|commerce_|location_stock_health|control_room_alerts|daily_brief))/.test(name))mutations.push(name);
  return json([]);
 }
 const table=url.pathname.split('/').pop();
 if(req.method()!=='GET'&&req.method()!=='HEAD'){
  mutations.push({table,method:req.method(),body:req.postDataJSON()});
  if(writeScenario==='variant-failure'&&table==='product_variants')return json({message:'Simulated variant failure',code:'TEST'},500);
  if(writeScenario)return json({id:table==='products'?products[0].id:products[0].product_variants[0].id});
  return json(req.method()==='POST'?[{id:'test-created'}]:[]);
 }
 const rows=empty?[]:table==='products'?products:table==='orders'?orders:table==='customers'?customers:table==='product_variants'?products.flatMap(p=>p.product_variants):[];
 if(table==='shipping_settings')return json({enabled:true,standard_rate:150,vinyl_rate:250,free_shipping_threshold:1000,international_enabled:false});
 return json(rows,200,{'content-range':`0-${Math.max(0,rows.length-1)}/${rows.length}`});
});
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
let navigation=0;
async function go(view){await page.goto(base+'/admin?qa='+(++navigation)+'#'+view);await page.locator('.adminTop').waitFor();await page.waitForFunction(()=>!document.body.innerText.includes('Loading workspace…')&&!document.body.innerText.includes('Loading finance…')&&!document.body.innerText.includes('Loading analytics…'));await page.waitForTimeout(120);}
try{
 for(const width of widths){
  await page.setViewportSize({width,height:1000});
  for(const view of views){
   await go(view);
   const overflow=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth,culprits:[...document.querySelectorAll('.adminMain *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>innerWidth+2&&!e.closest('.financeAuditScroll')}).slice(0,6).map(e=>e.className||e.tagName)}));
   if(overflow.scroll>width+2)results.push({width,view,overflow});
   if([390,1440].includes(width)&&['overview','products','inventory','finance'].includes(view))await page.screenshot({path:`${out}/${view}-${width}.png`,fullPage:true});
  }
  console.log('PASS admin views @'+width+'px');
 }
 await page.setViewportSize({width:390,height:844});await go('products');
 await page.getByRole('button',{name:'Open admin navigation'}).click();await page.getByRole('link',{name:'Finance',exact:false}).last().waitFor({state:'visible'});await page.keyboard.press('Escape');
 assert.equal(await page.locator('.adminRail').getAttribute('inert'),'','Closed mobile navigation must be inert');
 await page.getByRole('button',{name:'RUN QA',exact:true}).first().click();const readiness=page.getByRole('dialog',{name:'Product readiness'});await readiness.waitFor();
 const focusable=readiness.getByRole('button');await focusable.first().focus();await page.keyboard.press('Shift+Tab');assert.ok(await focusable.last().evaluate(el=>el===document.activeElement),'Dialog must trap backwards Tab');await page.keyboard.press('Tab');assert.ok(await focusable.first().evaluate(el=>el===document.activeElement),'Dialog must cycle forwards Tab');
 await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog',{name:'Product readiness'}).count(),0);
 await page.getByRole('button',{name:'EDIT',exact:true}).first().click();await page.getByRole('dialog',{name:'Edit Studio Edition'}).waitFor();await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog',{name:'Edit Studio Edition'}).count(),0);
 for(const width of widths){
  await page.setViewportSize({width,height:844});await page.getByRole('button',{name:'EDIT',exact:true}).first().click();
  const editor=page.getByRole('dialog',{name:'Edit Studio Edition'});await editor.waitFor();
  const bounds=await editor.boundingBox();assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=width+1&&bounds.y+bounds.height<=845,'Release dialog must fit '+width+'px');
  await editor.getByRole('button',{name:'CLOSE ×',exact:true}).click();await editor.waitFor({state:'detached'});
 }
 await go('orders');await page.locator('.orderRow').first().click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
 await go('inventory');assert.equal(await page.locator('.inventoryRow').count(),1,'Digital stock must not appear in physical ledger');
 await go('finance');
 for(const button of await page.locator('.financeNavButtons button').all()){await button.click();await page.waitForTimeout(40);}
 failureRpc='admin_finance_read';await go('finance');await page.getByRole('heading',{name:'Finance data unavailable'}).waitFor();assert.equal(await page.locator('.financeKpi').count(),0,'Missing finance data must not render zero balances');failureRpc='';
 empty=true;await go('products');await page.getByText('No products match this view.').waitFor();empty=false;
 nonAdmin=true;await page.goto(base+'/admin');await page.getByText('This account does not have administrator access.').waitFor();assert.equal(await page.locator('.adminMain').count(),0);
 // A failed bulk readiness check must open the correct product dialog without a write.
 nonAdmin=false;products[0].product_variants[0].stock_qty=0;products[0].product_variants[0].reserved_qty=0;
 await go('products');await page.getByRole('checkbox',{name:'Select Studio Edition',exact:true}).check();await page.getByRole('button',{name:'PUBLISH',exact:true}).click();
 await page.getByRole('dialog',{name:'Product readiness'}).getByRole('heading',{name:'Studio Edition',exact:true}).waitFor();await page.keyboard.press('Escape');
 products[0].product_variants[0].stock_qty=5;products[0].product_variants[0].reserved_qty=1;
 assert.deepEqual(errors,[],'Browser runtime errors');
 assert.deepEqual(results,[],'Viewport overflow');
 assert.equal(mutations.length,0,'Read-only browser QA must not submit business mutations');
 // All writes below are intercepted by this local-only harness.
 page.on('dialog',dialog=>dialog.accept());
 for(const scenario of ['variant-failure','success']){
  mutations.length=0;writeScenario=scenario;await go('products');
  await page.getByRole('button',{name:'EDIT',exact:true}).first().click();
  const dialog=page.getByRole('dialog',{name:'Edit Studio Edition'});
  await dialog.getByRole('combobox',{name:'Status',exact:true}).selectOption('active');
  await dialog.getByRole('button',{name:'SAVE RELEASE V2 →',exact:true}).click();
  if(scenario==='variant-failure'){
   await dialog.getByText(/Product remains hidden/).waitFor();
   assert.ok(mutations.some(x=>x.table==='products'&&x.body.is_public===false));
   assert.ok(!mutations.some(x=>x.table==='products'&&x.body.is_public===true),'Failed variant save must never publish');
  }else{
   await dialog.waitFor({state:'detached'});
   const hide=mutations.findIndex(x=>x.table==='products'&&x.body.is_public===false);
   const variant=mutations.findIndex(x=>x.table==='product_variants');
   const publish=mutations.findIndex(x=>x.table==='products'&&x.body.is_public===true);
   assert.ok(hide>=0&&variant>hide&&publish>variant,'Publish only after variant persistence');
   assert.equal('reserved_qty' in mutations[variant].body,false,'Release editor must not overwrite reservations');
  }
 }
 assert.deepEqual(errors,[],'Runtime errors during publication tests');
 console.log(`Admin Chromium passed: ${widths.length} widths × ${views.length} views; finance tabs, modal Escape, navigation, empty/error/non-admin states. No live writes; publication success/failure mutations intercepted.`);
}catch(error){await page.screenshot({path:out+'/failure.png',fullPage:true});writeFileSync(out+'/failure.txt',await page.locator('body').innerText());throw error;}finally{writeFileSync(out+'/results.json',JSON.stringify({widths,views,overflows:results,errors,mutations},null,2));await browser.close();}
