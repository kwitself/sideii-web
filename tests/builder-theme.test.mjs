import test from 'node:test';
import assert from 'node:assert/strict';
import {createNode,flattenNodes,validateDocument} from '../app/lib/page-builder.js';
import {starterDocument,sectionTemplate} from '../app/lib/page-builder-templates.js';
import {defaultSiteSettings,themeFontId} from '../app/lib/builder-design.js';

test('New content and templates follow the theme without storing font or colour overrides',()=>{
  for(const type of ['heading','text','section','button','artist','audio','events','countdown','gallery','products']) {
    const node=createNode(type);assert.equal(node.style.fontFamily,undefined);assert.equal(node.style.color,undefined);assert.equal(node.style.backgroundColor,undefined);
  }
  for(const key of ['home','product','page:new','block:new'])assert.deepEqual(starterDocument(key).theme,{});
  for(const kind of ['hero','split','cta','faq','products'])for(const node of flattenNodes({children:[sectionTemplate(kind)]})) {
    assert.equal(node.style.fontFamily,undefined);assert.equal(node.style.color,undefined);assert.equal(node.style.backgroundColor,undefined);
  }
});
test('Font previews resolve the native SIDE:II roles and selected site fonts',()=>{
  const site=defaultSiteSettings();assert.equal(themeFontId(createNode('heading'),site),'serif');assert.equal(themeFontId(createNode('text'),site),'sans');
  site.design={headingFont:'lora',bodyFont:'manrope'};assert.equal(themeFontId(createNode('artist'),site),'lora');assert.equal(themeFontId(createNode('button'),site),'manrope');
});
test('Existing explicit page and device choices survive validation unchanged',()=>{
  const node=createNode('heading',{style:{fontFamily:'inter',color:'#abcdef',fontSize:60},tablet:{fontSize:40},mobile:{fontFamily:'lora',fontSize:30}});
  const document={schemaVersion:1,theme:{fontFamily:'sans',backgroundColor:'#09090a',color:'#eeeef0'},children:[node]};
  assert.deepEqual(validateDocument(document,'page:existing'),document);
});
