import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {starterDocument} from '../app/lib/page-builder-templates.js';
import {flattenNodes,createNode} from '../app/lib/page-builder.js';
import {checkThemeInheritance} from './check-theme-inheritance.mjs';
import {checkBuilderCatalogue} from './check-builder-catalogue.mjs';
import {checkBuilderLayout} from './check-builder-layout.mjs';
import {checkStudioPlus} from './check-studio-plus.mjs';
import {checkBuilderDesignTools} from './check-builder-design-tools.mjs';
const require=createRequire(import.meta.url);
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright'));}
const base=process.env.SIDEII_BASE_URL||'http://127.0.0.1:3000';
assert.match(base,/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/);
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL,'http://127.0.0.1:54321');
const out=(process.env.SIDEII_QA_OUTPUT||'/tmp/sideii-admin-qa')+'/builder';mkdirSync(out,{recursive:true});
const admin={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',aud:'authenticated',email:'editor@example.invalid',app_metadata:{role:'admin'},user_metadata:{}};
const customer={...admin,id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',app_metadata:{role:'customer'},user_metadata:{role:'admin'}};
const token=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:admin.id,role:'authenticated',exp:4102444800})).toString('base64url')+'.test-signature';
const session={access_token:token,refresh_token:'test-only',token_type:'bearer',expires_in:3600,expires_at:4102444800,user:admin};
const assetInfo=new Map(),schedules=new Map(),fontFiles=new Map();
const pages=new Map(),publications=new Map(),revisions=[],blocks=[],writes=[],errors=[],assets=[];
const pixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGMoUTP+DwADrAHNywzrzwAAAABJRU5ErkJggg==','base64');
let failSave=false;
const measurements=[];
const products=[{id:'11111111-1111-4111-8111-111111111111',catalogue_no:'SII-009',slug:'studio-edition',title:'Studio Edition',artist_project:'Independent Artist',product_type:'release',imprint:'sideii',status:'active',is_public:true,product_variants:[{id:'22222222-2222-4222-8222-222222222222',format:'cd',sku:'SII-009-CD',active:true,price:120,currency:'TRY',stock_qty:5,reserved_qty:0}]}];
products.push({...products[0],id:'33333333-3333-4333-8333-333333333333',slug:'lethargia-edition',title:'Lethargia Edition',imprint:'lethargia',homepage_selected:false});
const mock=createServer(async(req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1:54321'),name=url.pathname.split('/').pop();
  const send=(data,status=200)=>{res.writeHead(status,{'content-type':'application/json','access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,POST,PATCH,DELETE,OPTIONS'});res.end(JSON.stringify(data));};
  if(req.method==='OPTIONS')return send({});
  if(url.pathname.startsWith('/auth/v1'))return send(name==='user'?(req.headers.authorization==='Bearer customer-token'?customer:admin):session);
  let body={},raw=Buffer.alloc(0);if(req.method!=='GET'){const chunks=[];for await(const chunk of req)chunks.push(chunk);raw=Buffer.concat(chunks);try{body=JSON.parse(raw.toString());}catch{}}
  if(url.pathname.startsWith('/storage/v1/object/site-builder-fonts/')&&req.method==='POST'){fontFiles.set(name,raw);return send({Key:'site-builder-fonts/'+name,Id:crypto.randomUUID()});}
  if(url.pathname.startsWith('/storage/v1/object/public/site-builder-fonts/')){res.writeHead(200,{'content-type':'font/woff2','access-control-allow-origin':'*'});return res.end(fontFiles.get(name));}
  if(name==='site_builder_assets'){if(req.method==='POST'){assetInfo.set(body.path,{...body,created_at:new Date().toISOString()});return send({});}let rows=[...assetInfo.values()];const q=url.searchParams.get('name')?.slice(6).replaceAll('%','').replaceAll('\\',''),folder=url.searchParams.get('folder')?.slice(3);if(q)rows=rows.filter(x=>x.name.toLowerCase().includes(q.toLowerCase()));if(folder!==undefined)rows=rows.filter(x=>x.folder===folder);return send(rows.slice(Number(url.searchParams.get('offset')||0),Number(url.searchParams.get('offset')||0)+Number(url.searchParams.get('limit')||49)));}
  if(name==='site_builder_asset_folders')return send([...new Set([...assetInfo.values()].map(x=>x.folder))].map(folder=>({folder})));
  if(url.pathname.startsWith('/storage/v1/object/list/'))return send(assets);
  if(url.pathname.startsWith('/storage/v1/object/public/')){res.writeHead(200,{'content-type':'image/png','access-control-allow-origin':'*'});return res.end(pixel);}
  if(url.pathname.startsWith('/storage/v1/object/site-builder-assets/')&&req.method==='POST'){assets.push({name,id:crypto.randomUUID()});return send({Key:'site-builder-assets/images/'+name,Id:crypto.randomUUID()});}
  if(name==='products'){
    const rows=products.filter(product=>[...url.searchParams].every(([key,value])=>{
      if(!['slug','imprint','is_public','homepage_selected','status'].includes(key))return true;
      if(value.startsWith('eq.'))return String(product[key]??false)===value.slice(3);
      if(value.startsWith('in.'))return value.slice(4,-1).split(',').includes(String(product[key]));
      return true;
    }));
    return send(rows);
  }
  const pageKey=url.searchParams.get('page_key')?.replace(/^eq\./,'');
  if(name==='site_builder_schedules'){let rows=pageKey?(schedules.has(pageKey)?[schedules.get(pageKey)]:[]):[...schedules.values()];const due=url.searchParams.get('publish_at');if(due?.startsWith('lte.'))rows=rows.filter(p=>Date.parse(p.publish_at)<=Date.parse(due.slice(4)));return send(rows);}
  if(name==='site_builder_pages')return send(pageKey?(pages.has(pageKey)?[pages.get(pageKey)]:[]):[...pages.values()]);
  if(name==='site_builder_publications')return send(pageKey?(publications.has(pageKey)?[publications.get(pageKey)]:[]):[...publications.values()]);
  if(name==='site_builder_revisions'){const id=url.searchParams.get('id')?.replace(/^eq\./,'');return send(revisions.filter(row=>(!pageKey||row.page_key===pageKey)&&(!id||String(row.id)===id)).sort((a,b)=>b.version-a.version));}
  if(name==='site_builder_blocks'){
    if(req.method==='POST'){const row={id:crypto.randomUUID(),...body};blocks.push(row);return send(row);}
    return send(blocks);
  }
  if(name==='save_site_builder_page'||name==='schedule_site_builder_page'){
    if(req.headers.authorization!=='Bearer '+token)return send({code:'42501',message:'Admin only'},403);
    if(failSave)return send({code:'MOCK',message:'Offline fixture'},503);
    const current=pages.get(body.p_key);
    const due=schedules.get(body.p_key);if(due&&Date.parse(due.publish_at)<=Date.now()){publications.set(body.p_key,{...due,published_at:due.publish_at});schedules.delete(body.p_key);}
    if(Number(current?.version||0)!==body.p_expected_version)return send({code:'40001',message:'Conflict'},409);
    const page={page_key:body.p_key,title:body.p_title,draft_document:body.p_document,version:body.p_expected_version+1,updated_at:new Date().toISOString()};
    pages.set(body.p_key,page);writes.push(body.p_action);
    revisions.push({id:revisions.length+1,page_key:body.p_key,title:body.p_title,document:structuredClone(body.p_document),version:page.version,action:body.p_action,created_at:page.updated_at});
    if(body.p_action==='publish')publications.set(body.p_key,{page_key:body.p_key,title:body.p_title,document:structuredClone(body.p_document),version:page.version,published_at:page.updated_at});
    if(body.p_action==='unpublish')publications.delete(body.p_key);
    if(['publish','unpublish'].includes(body.p_action))schedules.delete(body.p_key);
    if(name==='schedule_site_builder_page'){if(body.p_publish_at)schedules.set(body.p_key,{page_key:body.p_key,title:body.p_title,document:structuredClone(body.p_document),version:page.version,publish_at:body.p_publish_at});else schedules.delete(body.p_key);}
    return send({page,publishedVersion:publications.get(body.p_key)?.version??null,publishedAt:publications.get(body.p_key)?.published_at??null});
  }
  // No real orders, emails, payment providers, storage or production database.
  if(req.method!=='GET'&&!url.pathname.includes('/rpc/get_'))return send({message:'Unexpected fixture write: '+name},403);
  return send([]);
});
await new Promise(resolve=>mock.listen(54321,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
await context.addInitScript(s=>{if(window.top===window&&!localStorage.getItem('sb-127-auth-token'))localStorage.setItem('sb-127-auth-token',JSON.stringify(s));},session);
await context.route('**/*',route=>{const host=new URL(route.request().url()).hostname;return ['127.0.0.1','localhost'].includes(host)?route.continue():route.abort();});
const page=await context.newPage();
const canvas=page.frameLocator('iframe[title="Site önizlemesi"]');page.on('pageerror',error=>errors.push(error.message));
const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
const request=async(body,auth=headers)=>{const response=await fetch(base+'/api/admin/page-builder',{method:body?'POST':'GET',headers:auth,...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,data:await response.json()};};
const save=async()=>{await page.getByRole('button',{name:'Taslağı kaydet',exact:true}).click();await page.getByText('Taslak kaydedildi.',{exact:true}).waitFor();};
const publish=async()=>{await page.getByRole('button',{name:'Yayımla ↗',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Yayımla',exact:true}).click();await page.getByText('Sayfa yayımlandı.',{exact:true}).waitFor();};
try{
  if(!process.env.SIDEII_STUDIO_PLUS_ONLY&&!process.env.SIDEII_THEME_ONLY&&!process.env.SIDEII_CATALOGUE_ONLY&&!process.env.SIDEII_LAYOUT_ONLY){
  assert.equal((await request(undefined,{})).status,401);
  assert.equal((await request(undefined,{Authorization:'Bearer customer-token'})).status,403);
  const invalid=starterDocument('home');invalid.children[0].style.backgroundColor='url(javascript:1)';
  assert.equal((await request({key:'home',title:'Bad',document:invalid,expectedVersion:0,action:'publish'})).status,400);
  assert.equal(pages.size,0);
  console.log('PASS API rejects anonymous/customer sessions and invalid documents');
  await page.goto(base+'/admin/editor?page=home');await page.getByRole('heading',{name:'Senin alanın.'}).waitFor();
  await canvas.locator('.pbRoot').waitFor();
  assert.equal(await canvas.locator('.pbNode').count(),9);
  const publicContext=await browser.newContext({reducedMotion:'reduce'});
  await publicContext.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
  const live=await publicContext.newPage();
  const measure=body=>{
    const doc=body.ownerDocument,view=doc.defaultView;
    const selectors=['.globalSiteHeader','.hero','.heroLogo','.tagline','.capabilityStrip','.statement','.statement > p','#releases .sectionHead h2','.imprint','.homeLethargiaLogo','.about','.productionHead h2','.editionObjects','.storeTitle h2','.footerInner'];
    return {width:view.innerWidth,sections:[...doc.querySelectorAll('[data-home-section]')].map(x=>x.dataset.homeSection),items:selectors.map(selector=>{
      const node=doc.querySelector(selector),style=view.getComputedStyle(node),box=node.getBoundingClientRect();
      return {selector,width:Math.round(box.width),height:Math.round(box.height),font:style.fontFamily,size:style.fontSize,color:style.color,display:style.display};
    })};
  };
  for(const [device,width,height] of [['Masaüstü',1200,900],['Tablet',820,1024],['Mobil',390,844]]){
    await page.getByRole('button',{name:device,exact:true}).click();
    await page.waitForFunction(width=>document.querySelector('iframe[title="Site önizlemesi"]')?.contentWindow.innerWidth===width,width);
    await live.setViewportSize({width,height});await live.goto(base+'/');
    await canvas.locator('body').evaluate(async body=>{
      const doc=body.ownerDocument;
      await Promise.all([...doc.querySelectorAll('link[rel=stylesheet]')].map(link=>link.sheet?Promise.resolve():new Promise(resolve=>link.addEventListener('load',resolve,{once:true}))));
      await Promise.all([...doc.images].map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.onload=resolve;img.onerror=resolve;})));
    });
    await live.locator('body').evaluate(async body=>Promise.all([...body.ownerDocument.images].map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.onload=resolve;img.onerror=resolve;}))));
    const editor=await canvas.locator('body').evaluate(measure),publicPage=await live.locator('body').evaluate(measure);
    measurements.push({device,editor,publicPage});
    writeFileSync(out+'/home-parity.json',JSON.stringify(measurements,null,2));
    assert.deepEqual(editor,publicPage,'Home appearance at '+width);
    assert.equal(await canvas.locator('#releases').getByText('LETHARGIA EDITION',{exact:true}).count(),0);
    assert.equal(await canvas.locator('.homeStorePreview').getByText('LETHARGIA EDITION',{exact:true}).count(),1);
    await live.screenshot({path:out+'/home-'+width+'.png',fullPage:true});
    await page.screenshot({path:out+'/preview-'+width+'.png'});
  }
  await publicContext.close();
  await page.getByRole('button',{name:'Masaüstü',exact:true}).click();
  await canvas.locator('.tagline').click();
  await page.getByRole('textbox',{name:'Slogan',exact:true}).fill('An edited physical edition.');
  await page.getByRole('button',{name:'Tasarım',exact:true}).click();
  await canvas.getByText('An edited physical edition.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Geri al',exact:true}).click();
  await canvas.locator('.tagline').filter({hasText:'Music, in another form.'}).waitFor();
  await canvas.locator('.heroLogo img').click();
  assert.equal(await page.getByRole('textbox',{name:'Logo',exact:true}).inputValue(),'/brand/sideii-logo-silver.png');
  await page.getByRole('button',{name:'Sayfa teması',exact:true}).click();
  console.log('PASS original homepage matches editor at 1200/820/390; native text and logo are editable');
  await page.getByRole('button',{name:'Başlık',exact:true}).click();
  await page.getByRole('textbox',{name:'Metin',exact:true}).fill('Builder acceptance edition');
  await page.getByRole('button',{name:'Tasarım',exact:true}).click();
  await canvas.locator('.pb-heading').getByText('Builder acceptance edition',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Geri al',exact:true}).click();
  assert.equal(await canvas.locator('.pb-heading').getByText('Builder acceptance edition',{exact:true}).count(),0);
  await page.getByRole('button',{name:'İleri al',exact:true}).click();
  await canvas.locator('.pb-heading').getByText('Builder acceptance edition',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Sütunlar',exact:true}).click();
  const columnId=await canvas.locator('.pb-columns.pbSelected').getAttribute('data-pb-id');
  const columns=canvas.locator('[data-pb-id="'+columnId+'"]');
  const source=page.getByRole('button',{name:'Metin',exact:true}),target=columns.locator(':scope > .pbDropZone').last();
  await source.scrollIntoViewIfNeeded();await target.scrollIntoViewIfNeeded();
  const from=await source.boundingBox(),to=await target.boundingBox();
  await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();
  await page.mouse.move(from.x+from.width/2+10,from.y+from.height/2,{steps:5});
  await page.mouse.move(to.x+to.width/2,to.y+to.height/2,{steps:20});await page.mouse.move(to.x+to.width/2+1,to.y+to.height/2,{steps:2});await page.mouse.up();
  assert.equal(await columns.locator('.pb-text').count(),1);
  console.log('PASS native drag/drop creates a nested block; undo/redo preserves content');
  await page.getByRole('button',{name:'Görsel',exact:true}).click();
  await page.getByRole('button',{name:'Görsel seç / yükle',exact:true}).click();
  await page.getByRole('dialog').locator('input[type=file]').setInputFiles({name:'fixture.png',mimeType:'image/png',buffer:pixel});
  await page.getByText(/Görsel yüklendi/,{exact:true}).waitFor();assert.equal(assets.length,1);
  await save();assert.equal(publications.size,0);assert.equal(pages.get('home').version,1);
  const before=await (await fetch(base+'/')).text();assert.ok(!before.includes('Builder acceptance edition'));
  await publish();assert.equal(publications.get('home').version,2);
  const after=await (await fetch(base+'/')).text();assert.ok(after.includes('Builder acceptance edition'));
  await page.locator('.beStage').evaluate(el=>el.scrollTo({top:0,left:0}));
  await canvas.locator('body').evaluate(body=>body.ownerDocument.defaultView.scrollTo(0,0));
  await page.screenshot({path:out+'/desktop-1440.png'});
  console.log('PASS draft stays private; explicit publication appears in server-rendered homepage');
  await page.getByRole('button',{name:'Mobil',exact:true}).click();
  await page.waitForFunction(()=>Math.round(document.querySelector('.beCanvasFrame').offsetWidth)===390);
  await page.screenshot({path:out+'/mobile-preview.png'});
  assert.equal(await page.locator('.beCanvasFrame').evaluate(el=>Math.round(el.offsetWidth)),390);
  await page.getByRole('button',{name:'Masaüstü',exact:true}).click();
  await page.getByRole('button',{name:'Katmanlar',exact:true}).click();
  await page.getByRole('button',{name:'SIDE:II / Hero',exact:true}).click();
  await page.getByRole('button',{name:'Bölümü şablon olarak kaydet',exact:true}).click();
  await page.getByRole('dialog').getByLabel('Şablon adı').fill('Reusable hero');
  await page.getByRole('dialog').getByRole('button',{name:'Şablonu kaydet'}).click();
  await page.getByText('Bölüm şablonu arşive kaydedildi.',{exact:true}).waitFor();assert.equal(blocks.length,1);
  await page.getByRole('button',{name:'Ekle',exact:true}).click();
  await page.getByRole('button',{name:'Reusable hero ＋',exact:true}).click();
  assert.equal(await canvas.locator('.tagline').filter({hasText:'Music, in another form.'}).count(),2);
  await page.getByRole('button',{name:'Geri al',exact:true}).click();
  // Concurrent editor: fail safely and retain local work.
  await page.getByRole('button',{name:'Metin',exact:true}).click();
  await page.getByRole('textbox',{name:'Metin',exact:true}).fill('Unpublished recovery content');
  await page.getByRole('button',{name:'Tasarım',exact:true}).click();
  pages.get('home').version++;
  await page.getByRole('button',{name:'Taslağı kaydet',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'başka bir oturumda'}).waitFor();
  assert.equal(publications.get('home').version,2);
  await page.waitForFunction(()=>Object.keys(localStorage).some(k=>k.startsWith('sideii:builder:')&&localStorage[k].includes('Unpublished recovery content')));
  page.once('dialog',dialog=>dialog.accept());await page.reload();
  await page.getByRole('button',{name:'Çalışmayı kurtar',exact:true}).waitFor();
  await page.getByRole('button',{name:'Çalışmayı kurtar',exact:true}).click();
  await canvas.locator('.pb-text').getByText('Unpublished recovery content',{exact:true}).waitFor();
  failSave=true;await page.getByRole('button',{name:'Taslağı kaydet',exact:true}).click();await page.getByRole('alert').filter({hasText:'kaydedilemedi'}).waitFor();
  failSave=false;await save();assert.equal(publications.get('home').version,2);
  console.log('PASS conflict/offline failure preserves edits; browser recovery saves against current version');
  await page.getByRole('button',{name:'Geçmiş',exact:true}).click();
  await page.locator('.beRevision').filter({hasText:'v1 · save'}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Taslağa geri yükle',exact:true}).click();
  await page.getByText('Önceki sürüm taslak olarak geri yüklendi.',{exact:true}).waitFor();
  assert.equal(flattenNodes(pages.get('home').draft_document).filter(n=>n.props.text==='Unpublished recovery content').length,0);
  assert.equal(publications.get('home').version,2);
  await page.getByRole('button',{name:'Yayını kaldır',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Yayını kaldır',exact:true}).click();
  await page.getByText('Yayın kaldırıldı. Mevcut site şablonu devrede.',{exact:true}).waitFor();
  assert.equal(publications.size,0);assert.ok(!(await (await fetch(base+'/')).text()).includes('Builder acceptance edition'));
  console.log('PASS revision restore remains a draft; unpublish restores the original storefront');
  // Existing generic drafts are kept until the admin explicitly replaces them.
  const legacy={schemaVersion:1,theme:{},children:[createNode('heading',{props:{level:'h1',text:'My existing home draft'}})]};
  pages.get('home').draft_document=legacy;
  await page.reload();await canvas.getByText('My existing home draft',{exact:true}).waitFor();
  assert.equal(await canvas.locator('[data-home-section]').count(),0);
  await page.getByRole('button',{name:'Gerçek site düzenini yükle',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Şablonu yükle',exact:true}).click();
  assert.equal(await canvas.locator('[data-home-section]').count(),9);
  assert.equal(publications.size,0);
  await canvas.locator('.hero').focus();
  await canvas.locator('.hero').press('Control+z');
  await canvas.getByText('My existing home draft',{exact:true}).waitFor();
  assert.deepEqual(pages.get('home').draft_document,legacy);
  await page.getByRole('button',{name:'İleri al',exact:true}).click();
  assert.equal(await canvas.locator('[data-home-section]').count(),9);
  console.log('PASS legacy draft unchanged; explicit reset is private and iframe keyboard undo restores it');
  for(const width of [320,390,768,1024,1920]){
    await page.setViewportSize({width,height:900});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,'Editor overflow at '+width);
    await page.screenshot({path:out+'/editor-'+width+'.png'});
  }
  await page.setViewportSize({width:1440,height:1000});
  // APIs protect the required commerce blocks, and custom pages stay isolated.
  const product=starterDocument('product');product.children=product.children.filter(n=>n.props.slot!=='product-hero');
  assert.equal((await request({key:'product',title:'Product',document:product,expectedVersion:0,action:'publish'})).status,400);
  assert.equal((await request({key:'page:campaign',title:'Campaign',document:starterDocument('page:campaign'),expectedVersion:0,action:'save'})).status,200);
  assert.equal((await fetch(base+'/pages/campaign')).status,404);
  // An unpublished custom page must be previewable in the authenticated
  // editor without offering a dead public "Siteyi aç" link.
  await page.goto(base+'/admin/editor?page=page%3Acampaign');
  await page.waitForFunction(() =>
    document.querySelector('select[aria-label="Düzenlenen sayfa"]')?.value === 'page:campaign' &&
    document.querySelector('.beStatusbar')?.textContent?.includes('Taslak v1')
  );
  assert.equal(await page.locator('.beStatusbar').getByRole('link',{name:'Siteyi aç ↗'}).count(),0);
  await page.locator('.beStatusbar').getByRole('button',{name:'Taslağı önizle ↗'}).click();
  await page.locator('.beWorkspace.isPreview').waitFor();
  assert.equal(await canvas.getByText('A new perspective.').count(),1);
  await page.locator('.beStatusbar').getByRole('button',{name:'Düzenlemeye dön'}).click();
  await page.locator('.beWorkspace:not(.isPreview)').waitFor();
  assert.equal((await fetch(base+'/pages/campaign')).status,404);
  assert.equal((await request({key:'page:campaign',title:'Campaign',document:starterDocument('page:campaign'),expectedVersion:1,action:'publish'})).status,200);
  await page.reload();
  await page.locator('.beStatusbar').getByRole('link',{name:'Siteyi aç ↗'}).waitFor();
  assert.equal(await page.locator('.beStatusbar').getByRole('link',{name:'Siteyi aç ↗'}).getAttribute('href'),'/pages/campaign');
  const custom=await fetch(base+'/pages/campaign');assert.equal(custom.status,200);assert.ok((await custom.text()).includes('A new perspective.'));
  console.log('PASS private custom draft previews in editor without 404; public link appears only after publishing');
  const checkStoreDefault=async()=>{
    await page.goto(base+'/store');
    await page.getByLabel('SEARCH CATALOGUE',{exact:true}).waitFor();
    const image=page.locator('img[src="/defaults/store-20261023.jpg"]');
    await image.scrollIntoViewIfNeeded();await image.evaluate(img=>img.decode());
    assert.equal(await page.getByRole('link',{name:'Keşfet →',exact:true}).getAttribute('href'),'/store');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  };
  await checkStoreDefault();
  await page.screenshot({path:out+'/store-default-desktop.png',fullPage:true});
  for(const key of ['store','product'])assert.equal((await request({key,title:key,document:starterDocument(key),expectedVersion:0,action:'publish'})).status,200);
  await page.goto(base+'/store');await page.getByLabel('SEARCH CATALOGUE',{exact:true}).waitFor();
  assert.equal((await request({key:'store',title:'Store',document:starterDocument('store'),expectedVersion:1,action:'unpublish'})).status,200);
  await page.setViewportSize({width:390,height:844});await checkStoreDefault();
  await page.screenshot({path:out+'/store-default-mobile.png',fullPage:true});
  await page.setViewportSize({width:1440,height:1000});
  console.log('PASS store default preserves owner artwork, link and catalogue before publication and after unpublish');
  await page.goto(base+'/releases/studio-edition');await page.locator('.productHero').waitFor();
  assert.equal((await page.locator('h1').allTextContents()).length,1);assert.ok((await page.locator('body').innerText()).includes('STUDIO'));
  await checkBuilderDesignTools({page,canvas,browser,base,out,request,save,publish,pages});
  }
  if(!process.env.SIDEII_CATALOGUE_ONLY&&!process.env.SIDEII_LAYOUT_ONLY){
    await checkThemeInheritance({page,canvas,browser,base,out,request,save,publish,pages});
    if(!process.env.SIDEII_THEME_ONLY)await checkStudioPlus({page,canvas,browser,base,out,request,save,publish,pages,schedules,assetInfo});
  }
  if(!process.env.SIDEII_THEME_ONLY&&!process.env.SIDEII_LAYOUT_ONLY)await checkBuilderCatalogue({page,canvas,browser,base,out,request,publish,pages,publications,products});
  if(!process.env.SIDEII_THEME_ONLY&&!process.env.SIDEII_CATALOGUE_ONLY&&!process.env.SIDEII_STUDIO_PLUS_ONLY)await checkBuilderLayout({page,canvas,browser,base,out,request,publish,pages,publications,products});
  assert.deepEqual(errors,[]);
  console.log('PASS custom pages, catalogue and product templates render; no browser errors');
}catch(error){await page.screenshot({path:out+'/failure.png',fullPage:true});writeFileSync(out+'/failure.txt',await page.locator('body').innerText());throw error;}
finally{writeFileSync(out+'/results.json',JSON.stringify({writes,errors,pages:[...pages.keys()]},null,2));await browser.close();await new Promise(resolve=>mock.close(resolve));}
