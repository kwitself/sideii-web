import assert from 'node:assert/strict';
import {FONT_CATALOG} from '../app/lib/builder-fonts.js';
import {starterDocument} from '../app/lib/page-builder-templates.js';
import {findNode} from '../app/lib/page-builder.js';

// Called by the builder suite against its isolated local Supabase fixture.
export async function checkBuilderDesignTools({page, canvas, browser, base, out, request, save, publish, pages}) {
  const key='page:design-tools';
  assert.equal((await request({key,title:'Design tools',document:starterDocument(key),expectedVersion:0,action:'save'})).status,200);
  await page.goto(base+'/admin/editor?page='+encodeURIComponent(key));
  const heading=canvas.locator('.pb-heading').first();await heading.waitFor();
  await heading.click();await page.getByRole('button',{name:'Tasarım',exact:true}).click();
  const headingId=await heading.getAttribute('data-pb-id');
  const fontPicker=page.locator('.beFontPicker');
  await fontPicker.getByRole('button',{name:'Yazı tipi seç',exact:true}).click();
  await page.getByRole('searchbox',{name:'Font ara'}).fill('no-such-font');
  await page.getByText('Eşleşen font yok.',{exact:true}).waitFor();
  await page.getByRole('searchbox',{name:'Font ara'}).fill('Playfair');
  await fontPicker.getByRole('button',{name:'Serif',exact:true}).click();
  await fontPicker.getByRole('button',{name:/Playfair Display/}).click();
  await page.getByLabel('Hazır metin stili',{exact:true}).selectOption('editorial');
  await page.getByLabel('Yazı eğimi',{exact:true}).selectOption('italic');
  await page.getByLabel('Metin çizgisi',{exact:true}).selectOption('underline');
  await page.getByLabel('Büyük / küçük harf',{exact:true}).selectOption('uppercase');
  const setNumber=async(label,value)=>{const input=page.getByRole('spinbutton',{name:label,exact:true});await input.fill(String(value));await input.press('Enter');};
  const setColor=async(label,value)=>{const input=page.getByRole('textbox',{name:label+' · HEX',exact:true});await input.fill(value);await input.press('Enter');};
  const device=async name=>page.getByRole('button',{name,exact:true}).click();
  await setNumber('Kelime aralığı',3);
  await device('Tablet');await setNumber('Yazı boyutu',42);
  await device('Mobil');await setNumber('Yazı boyutu',30);
  const typography=locator=>locator.evaluate(el=>{const s=el.ownerDocument.defaultView.getComputedStyle(el);return {font:s.fontFamily,size:s.fontSize,weight:s.fontWeight,style:s.fontStyle,decoration:s.textDecorationLine,transform:s.textTransform,wordSpacing:s.wordSpacing};});
  let type=await typography(heading.locator('h2'));
  assert.ok(type.font.includes('PB Playfair Display'));assert.equal(type.size,'30px');assert.equal(type.style,'italic');assert.equal(type.transform,'uppercase');assert.equal(type.wordSpacing,'3px');
  await page.getByRole('button',{name:'Stili kopyala',exact:true}).click();
  await page.getByRole('button',{name:'Metin',exact:true}).click();
  await page.getByRole('textbox',{name:'Metin',exact:true}).fill('İçerik korunur, tasarım paylaşılır.');
  await page.getByRole('button',{name:'Tasarım',exact:true}).click();
  const text=canvas.locator('.pb-text.pbSelected');
  const textId=await text.getAttribute('data-pb-id');
  await page.getByRole('button',{name:'Stili yapıştır',exact:true}).click();
  assert.equal(await text.locator('p').textContent(),'İçerik korunur, tasarım paylaşılır.');
  assert.deepEqual(await typography(text.locator('p')),type);
  await page.getByRole('button',{name:'Geri al',exact:true}).click();
  assert.notEqual((await typography(text.locator('p'))).font,type.font);
  await page.getByRole('button',{name:'İleri al',exact:true}).click();
  assert.deepEqual(await typography(text.locator('p')),type);

  await device('Masaüstü');
  const section=canvas.locator('.pb-section').first();
  const sectionId=await section.getAttribute('data-pb-id');
  await section.focus();await section.press('Enter');
  await page.getByRole('button',{name:'Tasarım',exact:true}).click();
  await page.locator('summary').filter({hasText:/^Arka plan$/}).click();
  await page.getByLabel('Zemin türü',{exact:true}).selectOption('gradient');
  await setColor('Zemin rengi','#171719');await setColor('Degrade bitiş rengi','#742633');await setNumber('Degrade açısı (°)',60);
  await device('Tablet');await setColor('Degrade bitiş rengi','#38383e');
  await device('Mobil');await setNumber('Degrade açısı (°)',180);
  const gradient=await section.evaluate(el=>el.ownerDocument.defaultView.getComputedStyle(el).backgroundImage);
  assert.ok(gradient.includes('rgb(23, 23, 25)')&&gradient.includes('rgb(56, 56, 62)'),gradient);
  await device('Masaüstü');
  await page.locator('summary').filter({hasText:/^Çerçeve ve efektler$/}).click();
  await page.getByLabel('Çerçeve türü',{exact:true}).selectOption('dashed');
  await setNumber('Çerçeve',2);await setNumber('Köşe yuvarlama',24);await setColor('Çerçeve rengi','#85858e');
  await page.getByLabel('Gölge',{exact:true}).selectOption('medium');
  assert.equal(await section.evaluate(el=>el.ownerDocument.defaultView.getComputedStyle(el).borderTopStyle),'dashed');

  await page.getByRole('button',{name:'Görsel',exact:true}).click();
  await page.getByRole('textbox',{name:'Görsel adresi',exact:true}).fill('/defaults/store-20261023.jpg');
  await page.getByRole('button',{name:'Tasarım',exact:true}).click();
  const imageNode=canvas.locator('.pb-image.pbSelected'),image=imageNode.locator('img');
  const imageId=await imageNode.getAttribute('data-pb-id');
  await image.evaluate(img=>img.decode());
  await page.getByLabel('En / boy oranı',{exact:true}).selectOption('16:9');
  await page.getByRole('button',{name:'Odak: Sağ üst',exact:true}).click();
  await setNumber('Sabit yükseklik (px)',280);
  await device('Mobil');await setNumber('Sabit yükseklik (px)',160);
  assert.equal(await image.evaluate(img=>Math.round(img.getBoundingClientRect().height)),160);
  await page.getByRole('button',{name:'Sıfırla',exact:true}).click();
  assert.equal(await image.evaluate(img=>Math.round(img.getBoundingClientRect().height)),280);
  await page.getByRole('button',{name:'Geri al',exact:true}).click();
  assert.equal(await image.evaluate(img=>Math.round(img.getBoundingClientRect().height)),160);
  assert.equal(await image.evaluate(img=>img.ownerDocument.defaultView.getComputedStyle(img).objectPosition),'100% 0%');
  await save();
  const saved=pages.get(key).draft_document;
  assert.deepEqual(findNode(saved,textId).style,findNode(saved,headingId).style);
  assert.deepEqual(findNode(saved,textId).tablet,{fontSize:42});
  assert.deepEqual(findNode(saved,textId).mobile,{fontSize:30});
  assert.equal(findNode(saved,sectionId).mobile.gradientAngle,180);
  assert.equal((await fetch(base+'/pages/design-tools')).status,404);
  await page.reload();await canvas.locator('[data-pb-id="'+headingId+'"]').waitFor();
  await publish();
  const publicContext=await browser.newContext({reducedMotion:'reduce'});
  await publicContext.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
  const live=await publicContext.newPage();
  try {
    for(const [name,width,height,size,imgHeight] of [['Masaüstü',1200,900,'56px',280],['Tablet',820,1024,'42px',280],['Mobil',390,844,'30px',160]]) {
      await device(name);await live.setViewportSize({width,height});await live.goto(base+'/pages/design-tools');
      const publicHeading=live.locator('[data-pb-id="'+headingId+'"] h2');
      await publicHeading.evaluate(el=>el.ownerDocument.fonts.ready);
      const editorType=await typography(canvas.locator('[data-pb-id="'+headingId+'"] h2'));
      assert.equal(editorType.size,size);assert.deepEqual(await typography(publicHeading),editorType);
      const liveImage=live.locator('[data-pb-id="'+imageId+'"] img');await liveImage.evaluate(img=>img.decode());
      assert.equal(await liveImage.evaluate(img=>Math.round(img.getBoundingClientRect().height)),imgHeight);
      assert.equal(await live.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
      assert.equal(await live.locator('[data-pb-id="'+sectionId+'"]').evaluate(el=>getComputedStyle(el).backgroundImage),await canvas.locator('[data-pb-id="'+sectionId+'"]').evaluate(el=>el.ownerDocument.defaultView.getComputedStyle(el).backgroundImage));
      if(width===390)await live.screenshot({path:out+'/design-tools-public-mobile.png',fullPage:true});
    }
  } finally {await publicContext.close();}
  // Ensure every bundled family loads as a real FontFace, including Turkish glyphs;
  // a computed CSS family alone could hide a network/decode failure and fallback.
  const webFonts=FONT_CATALOG.filter(font=>font.category!=='system').map(font=>font.family.split(',')[0]);
  const loaded=await page.evaluate(async families=>Promise.all(families.map(async family=>{
    const faces=await document.fonts.load('400 18px '+family,'ÇĞİÖŞÜ çğıöşü');
    return {family,count:faces.length,loaded:faces.every(face=>face.status==='loaded')};
  })),webFonts);
  for(const font of loaded)assert.ok(font.count>0&&font.loaded,'Bundled font failed: '+font.family);
  await device('Masaüstü');
  await canvas.locator('[data-pb-id="'+headingId+'"]').click();await page.getByRole('button',{name:'Tasarım',exact:true}).click();
  await fontPicker.getByRole('button',{name:'Yazı tipi seç',exact:true}).click();
  await page.locator('.beInspector').evaluate(el=>el.scrollTo({top:0}));
  await page.screenshot({path:out+'/design-tools-editor.png'});
  console.log('PASS 12 self-hosted fonts, typography, responsive styles, copy/paste + undo, gradients, borders, image crop, private save and publication parity');
}
