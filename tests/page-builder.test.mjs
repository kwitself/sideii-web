import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDocument,createNode,moveNode,insertNode,duplicateNode,findNode,flattenNodes,documentCss,safeUrl,validPageKey,cloneNodeTree} from '../app/lib/page-builder.js';
import {starterDocument,sectionTemplate} from '../app/lib/page-builder-templates.js';
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
