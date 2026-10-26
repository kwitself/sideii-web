import assert from 'node:assert/strict';
import {createNode,findNode} from '../app/lib/page-builder.js';
import {starterDocument} from '../app/lib/page-builder-templates.js';

export async function checkThemeInheritance({page,canvas,browser,base,out,request,save,publish,pages}) {
  const key='page:theme-defaults',heading=createNode('heading'),text=createNode('text'),artist=createNode('artist'),button=createNode('button');
  const section=createNode('section',{children:[heading,text,artist,button]}),document={schemaVersion:1,theme:{},children:[section]};
  const write=async(k,doc,action='save')=>{const result=await request({key:k,title:k,document:doc,expectedVersion:pages.get(k)?.version||0,action});assert.equal(result.status,200,JSON.stringify(result.data));};
  const load=async()=>{await page.goto(base+'/admin/editor?page='+key);await canvas.locator('[data-pb-id="'+heading.id+'"]').waitFor();};
  const look=locator=>locator.evaluate(el=>{const s=el.ownerDocument.defaultView.getComputedStyle(el);return {font:s.fontFamily,color:s.color,size:s.fontSize};});
  const head=()=>canvas.locator('[data-pb-id="'+heading.id+'"] h2');
  const visitor=await browser.newContext({viewport:{width:1200,height:900},reducedMotion:'reduce'});
  await visitor.route('**/*',r=>['127.0.0.1','localhost'].includes(new URL(r.request().url()).hostname)?r.continue():r.abort());
  const live=await visitor.newPage();
  try {
    await write(key,document);await load();
    assert.match((await look(head())).font,/Georgia/);
    assert.match((await look(canvas.locator('[data-pb-id="'+text.id+'"] p'))).font,/Arial/);
    await head().click();await page.getByRole('button',{name:'Tasarım',exact:true}).click();
    assert.match(await page.locator('.beFontTrigger').innerText(),/Georgia.*Temadan/s);
    await page.getByRole('button',{name:'Yazı tipi seç',exact:true}).click();
    assert.equal(await page.getByRole('button',{name:/^Temadan al/}).getAttribute('aria-pressed'),'true');
    await page.getByRole('button',{name:/^Inter Sans/}).click();assert.match((await look(head())).font,/PB Inter/);
    await page.getByRole('button',{name:'Yazı tipi sıfırla',exact:true}).click();assert.match((await look(head())).font,/Georgia/);
    await publish();assert.equal(findNode(pages.get(key).draft_document,heading.id).style.fontFamily,undefined);
    await live.goto(base+'/pages/theme-defaults');assert.deepEqual(await look(live.locator('[data-pb-id="'+heading.id+'"] h2')),await look(head()));
    assert.equal((await look(live.locator('[data-pb-id="'+text.id+'"] p'))).color,await live.locator('main').first().evaluate(el=>getComputedStyle(el).color));

    // Existing nodes keep following the shared design without a page re-save.
    const site=starterDocument('site');site.site.design={headingFont:'lora',bodyFont:'manrope',headingColor:'#dac8b0',textColor:'#b0b4b8',sectionSpacing:66,contentWidth:1000,buttonRadius:12};
    await write('site',site,'publish');await load();await live.reload();
    for(const scope of [canvas,live]) {
      assert.match((await look(scope.locator('[data-pb-id="'+heading.id+'"] h2'))).font,/PB Lora/);
      assert.match((await look(scope.locator('[data-pb-id="'+text.id+'"] p'))).font,/PB Manrope/);
      assert.match((await look(scope.locator('[data-pb-id="'+artist.id+'"] h2'))).font,/PB Lora/);
      assert.equal((await look(scope.locator('[data-pb-id="'+heading.id+'"] h2'))).color,'rgb(218, 200, 176)');
      assert.equal(await scope.locator('[data-pb-id="'+section.id+'"]').evaluate(el=>el.ownerDocument.defaultView.getComputedStyle(el).paddingTop),'66px');
      assert.equal(await scope.locator('[data-pb-id="'+button.id+'"] a').evaluate(el=>el.ownerDocument.defaultView.getComputedStyle(el).borderRadius),'12px');
    }
    await head().click();await page.getByRole('button',{name:'Tasarım',exact:true}).click();assert.match(await page.locator('.beFontTrigger').innerText(),/Lora.*Temadan/s);
    await page.getByRole('button',{name:'Yazı tipi seç',exact:true}).click();await page.getByRole('button',{name:/^Inter Sans/}).click();
    await page.getByRole('button',{name:'Mobil',exact:true}).click();await page.getByRole('button',{name:'Yazı tipi seç',exact:true}).click();await page.getByRole('button',{name:/^Oswald Vurgu/}).click();
    assert.match((await look(head())).font,/PB Oswald/);await publish();
    for(const [device,width,font] of [['Masaüstü',1200,'PB Inter'],['Mobil',390,'PB Oswald']]) {
      await page.getByRole('button',{name:device,exact:true}).click();await live.setViewportSize({width,height:900});await live.reload();
      assert((await look(head())).font.includes(font));assert.deepEqual(await look(live.locator('[data-pb-id="'+heading.id+'"] h2')),await look(head()));
      assert(await live.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    }
    await head().click();await page.getByRole('button',{name:'Tasarım',exact:true}).click();await page.getByRole('button',{name:'Yazı tipi sıfırla',exact:true}).click();assert.match((await look(head())).font,/PB Inter/);
    await page.getByRole('button',{name:'Masaüstü',exact:true}).click();await page.getByRole('button',{name:'Yazı tipi sıfırla',exact:true}).click();assert.match((await look(head())).font,/PB Lora/);
    await save();assert.equal(findNode(pages.get(key).draft_document,heading.id).style.fontFamily,undefined);assert.equal(findNode(pages.get(key).draft_document,heading.id).mobile.fontFamily,undefined);
    // An explicit page font still wins over shared heading/body families.
    const own=structuredClone(pages.get(key).draft_document);own.theme={fontFamily:'serif',color:'#ffffff'};own.children[0].style={paddingTop:25};await write(key,own,'publish');await live.reload();
    assert.match((await look(live.locator('[data-pb-id="'+artist.id+'"] h2'))).font,/Georgia/);assert.equal((await look(live.locator('[data-pb-id="'+artist.id+'"] h2'))).color,'rgb(255, 255, 255)');
    assert.equal(await live.locator('[data-pb-id="'+section.id+'"]').evaluate(el=>getComputedStyle(el).paddingTop),'25px');
    await live.screenshot({path:out+'/theme-defaults-mobile.png',fullPage:true});
    await write('site',site,'unpublish');
    console.log('PASS theme defaults, live inheritance, font picker/reset, component/page overrides and mobile publication parity');
  } finally {await visitor.close();}
}
