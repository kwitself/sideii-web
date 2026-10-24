import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDocument,createNode,moveNode,insertNode,duplicateNode,findNode,flattenNodes,documentCss,safeUrl,validPageKey,cloneNodeTree,inheritedNodeStyle} from '../app/lib/page-builder.js';
import {starterDocument,sectionTemplate} from '../app/lib/page-builder-templates.js';
import {FONT_CATALOG, TYPOGRAPHY_PRESETS, typographyPreset} from '../app/lib/builder-fonts.js';
const document=children=>({schemaVersion:1,theme:{},children});
test('Built-in pages and reusable sections satisfy the public document contract',()=>{
  for(const key of ['home','store','product','page:production'])assert.ok(validateDocument(starterDocument(key),key,{publishing:true}));
  for(const kind of ['hero','split','cta','faq','products'])assert.ok(validateDocument(document([sectionTemplate(kind)]),'page:snippet',{publishing:true}));
});
test('URLs reject script, protocol-relative, attribute and stylesheet injection',()=>{
  for(const value of ['javascript:alert(1)','//evil.test/x','data:text/html,boom','https://x.test/" onerror="x','https://x.test/</style>','https://user:pass@x.test/','/\\evil.test','java\nscript:alert(1)'])assert.equal(safeUrl(value),'',value);
  for(const value of ['/store','#releases','https://example.com/a.png','mailto:info@example.com'])assert.equal(safeUrl(value),value);
  assert.equal(safeUrl('mailto:a@example.com',true),'');
});
test('Validation rejects unknown widgets, unsafe styles, duplicate IDs and anchors',()=>{
  const node=createNode('heading');
  assert.throws(()=>validateDocument(document([{...node,type:'script'}])));
  assert.throws(()=>validateDocument(document([{...node,type:'__proto__'}])));
  assert.throws(()=>validateDocument(document([{...node,style:{position:'fixed'}}])));
  assert.throws(()=>validateDocument(document([{...node,style:{color:'red;</style><script>'}}])));
  assert.throws(()=>validateDocument(document([{...node,style:{fontSize:Infinity}}])));
  assert.throws(()=>validateDocument(document([node,node])));
  const a=createNode('section',{props:{anchor:'same'}}),b=createNode('section',{props:{anchor:'same'}});
  assert.throws(()=>validateDocument(document([a,b])));
  assert.throws(()=>validateDocument(document([createNode('section',{props:{anchor:'top'}})])));
});
test('Data size, nesting depth, element count and leaf children are bounded',()=>{
  const outer=createNode('section');let current=outer;
  for(let i=0;i<9;i++){const next=createNode('section');current.children=[next];current=next;}
  assert.throws(()=>validateDocument(document([outer])));
  assert.throws(()=>validateDocument(document(Array.from({length:301},()=>createNode('spacer')))));
  assert.throws(()=>validateDocument(document([createNode('heading',{children:[createNode('text')]})])));
  assert.throws(()=>validateDocument(document([createNode('text',{props:{text:'x'.repeat(500000)}})])));
});
test('Moves preserve content, support nesting and reject cycles without mutating source',()=>{
  const a=createNode('section',{children:[createNode('text')]}),b=createNode('columns'),c=createNode('heading');
  const original=document([a,b,c]), before=JSON.stringify(original);
  let moved=moveNode(original,a.id,b.id,0);
  assert.equal(findNode(moved,b.id).children[0].id,a.id);
  assert.equal(flattenNodes(moved).length,4);
  assert.throws(()=>moveNode(moved,b.id,a.id,0));
  assert.equal(JSON.stringify(original),before);
  moved=moveNode(original,a.id,null,3);
  assert.deepEqual(moved.children.map(x=>x.id),[b.id,c.id,a.id]);
  assert.throws(()=>insertNode(original,createNode('text'),c.id,0));
});
test('Copies and reusable blocks have fresh IDs and anchors',()=>{
  const section=createNode('section',{props:{anchor:'intro'},children:[createNode('heading')]});
  const result=duplicateNode(document([section]),section.id);
  assert.notEqual(result.children[0].id,result.children[1].id);
  assert.notEqual(result.children[0].children[0].id,result.children[1].children[0].id);
  assert.notEqual(result.children[0].props.anchor,result.children[1].props.anchor);
  assert.ok(validateDocument(result));
  assert.throws(()=>cloneNodeTree(createNode('native',{props:{slot:'product-hero'}})));
});
test('Publication requires commerce slots and rejects hiding them through ancestors',()=>{
  assert.throws(()=>validateDocument(document([createNode('text')]),'store',{publishing:true}));
  assert.throws(()=>validateDocument(document([createNode('text')]),'product',{publishing:true}));
  assert.ok(validateDocument(document([createNode('text')]),'product'));
  const hero=createNode('native',{props:{slot:'product-hero'}});
  assert.ok(validateDocument(document([hero]),'product',{publishing:true}));
  const group=createNode('section',{children:[hero],mobile:{display:'hide'}});
  assert.throws(()=>validateDocument(document([group]),'product',{publishing:true}));
  assert.throws(()=>validateDocument(document([hero]),'home'));
  assert.throws(()=>validateDocument(document([hero,createNode('native',{props:{slot:'product-hero'}})]),'product'));
});
test('Responsive styles keep tablet and mobile overrides in separate container queries',()=>{
  const node=createNode('heading',{style:{fontSize:80},tablet:{fontSize:54},mobile:{fontSize:30}});
  const css=documentCss(validateDocument(document([node])));
  assert.match(css,/font-size:80px/);assert.match(css,/@container pbCanvas \(max-width:900px\).*font-size:54px/);
  assert.match(css,/@container pbCanvas \(max-width:600px\).*font-size:30px/);
});
test('Custom pages cannot overwrite admin, payment or existing application routes',()=>{
  for(const key of ['admin','/admin','page:../admin','page:a/b','page:','page:UPPER'])assert.equal(validPageKey(key),false);
  for(const key of ['home','store','product','page:production'])assert.equal(validPageKey(key),true);
});

test('Original home sections validate editable fields and reject URL/field injection',()=>{
  const doc=starterDocument('home');
  assert.equal(doc.children.length,9);
  const hero=doc.children[0];
  for(const props of [{section:'__proto__'},{section:'unknown'},{...hero.props,logo:'javascript:alert(1)'},{...hero.props,linkHref:'//evil.test'},{...hero.props,html:'<script>'}])
    assert.throws(()=>validateDocument(document([{...hero,props}])));
  const minimal={...hero,props:{section:'releases'}};
  const valid=validateDocument(document([minimal]));
  assert.equal(valid.children[0].props.anchor,'releases');
  assert.throws(()=>validateDocument(document([minimal,{...minimal,id:createNode('text').id}])));
  assert.ok(validateDocument(document([cloneNodeTree(hero)]),'page:snippet'));
  const styled={...hero,style:{fontSize:40,paddingTop:24}};
  assert.match(documentCss(validateDocument(document([styled]))),/\[data-home-title\]\{font-size:40px\}/);
});
test('Legacy generic home drafts retain their content without conversion',()=>{
  const legacy=document([createNode('section',{children:[createNode('heading',{props:{text:'My saved layout',level:'h1'}})]})]);
  assert.deepEqual(validateDocument(legacy),legacy);
});

test('Font choices and typography presets round-trip through the public contract',()=>{
  for (const font of FONT_CATALOG) {
    const node=createNode('heading',{style:{fontFamily:font.id,fontStyle:'italic',textDecoration:'underline',textTransform:'uppercase',wordSpacing:2.5}});
    const doc=validateDocument(document([node]));
    assert.deepEqual(doc.children[0].style,node.style);
    assert.ok(documentCss(doc).includes('font-family:'+font.family));
    assert.match(documentCss(doc),/font-style:italic;text-decoration:underline;text-transform:uppercase;word-spacing:2.5px/);
  }
  for (const preset of TYPOGRAPHY_PRESETS) for(const device of ['desktop','tablet','mobile']) {
    assert.ok(validateDocument(document([createNode('text',{style:typographyPreset(preset.id,device)})])));
  }
  for (const style of [{fontFamily:'url(https://evil.test)'},{fontFamily:'__proto__'},{textDecoration:'underline;display:none'},{boxShadow:'0 0 0 9999px red'},{gradientColor:'#fff'},{gradientAngle:361},{aspectRatio:'1:1;position:fixed'},{objectPosition:'url(x)'},{mediaHeight:-1}]) {
    assert.throws(()=>validateDocument(document([createNode('text',{style})])));
  }
});
test('Gradient responsive overrides retain earlier colours and angle, with an explicit solid reset',()=>{
  const node=createNode('section',{style:{backgroundType:'gradient',backgroundColor:'#111111',gradientColor:'#222222',gradientAngle:90},tablet:{gradientColor:'#333333'},mobile:{backgroundType:'solid'}});
  const css=documentCss(validateDocument(document([node])));
  assert.match(css,/linear-gradient\(90deg,#111111,#222222\)/);
  assert.match(css,/@container pbCanvas \(max-width:900px\).*linear-gradient\(90deg,#111111,#333333\)/);
  assert.match(css,/@container pbCanvas \(max-width:600px\).*background-image:none/);
  const inherited=createNode('section',{style:{backgroundType:'gradient'},tablet:{gradientAngle:45},mobile:{gradientColor:'#742633'}});
  assert.match(documentCss(validateDocument(document([inherited]))),/@container pbCanvas \(max-width:600px\).*linear-gradient\(45deg,#171719,#742633\)/);
});
test('Media sizing targets the actual image/video, while borders and shadows stay on its frame',()=>{
  for(const type of ['image','video']) {
    const node=createNode(type,{style:{aspectRatio:'16:9',objectFit:'cover',objectPosition:'right top',mediaHeight:300,borderRadius:24,boxShadow:'medium'},mobile:{mediaHeight:160,aspectRatio:'1:1'}});
    const css=documentCss(validateDocument(document([node])));
    assert.ok(css.includes(`[data-pb-id="${node.id}"]{border-radius:24px;box-shadow:0 12px 32px #00000059}`));
    assert.match(css,/:is\(img,video\)\{aspect-ratio:16 \/ 9;object-fit:cover;object-position:right top;height:300px\}/);
    assert.match(css,/@container pbCanvas \(max-width:600px\).*:is\(img,video\)\{height:160px;aspect-ratio:1 \/ 1\}/);
  }
});
test('Original home heading typography overrides a page font without changing the section layout',()=>{
  const doc=starterDocument('home');doc.theme.fontFamily='inter';
  doc.children[0].style={fontFamily:'lora',fontStyle:'italic',textTransform:'uppercase',textAlign:'right',paddingTop:32};
  const css=documentCss(validateDocument(doc));
  assert.ok(css.includes('.pbRoot .pb-siteSection [data-home-field]{font-family:"PB Inter",Arial,sans-serif}'));
  assert.ok(css.includes('[data-home-title]{font-family:"PB Lora",Georgia,serif;font-style:italic;text-transform:uppercase;text-align:right}'));
  assert.ok(css.includes(`[data-pb-id="${doc.children[0].id}"]{padding-top:32px}`));
});
test('Inspector inheritance follows parent fonts and previous devices, without inheriting parent backgrounds',()=>{
  const child=createNode('text',{style:{fontSize:22},tablet:{fontSize:20}});
  const parent=createNode('section',{style:{fontFamily:'lora',backgroundType:'gradient',paddingTop:100},mobile:{fontFamily:'inter'},children:[child]});
  const doc={...document([parent]),theme:{fontFamily:'sans',color:'#ffffff',backgroundColor:'#171719'}};
  assert.deepEqual(inheritedNodeStyle(doc,child.id,'desktop'),{fontFamily:'lora',color:'#ffffff'});
  assert.deepEqual(inheritedNodeStyle(doc,child.id,'mobile'),{fontFamily:'inter',color:'#ffffff',fontSize:20});
  assert.equal(inheritedNodeStyle(doc,parent.id,'tablet').backgroundType,'gradient');
});
