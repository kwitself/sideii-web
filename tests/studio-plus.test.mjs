import test from 'node:test';
import assert from 'node:assert/strict';
import {createNode,validateDocument,documentCss,scopeSharedDocument} from '../app/lib/page-builder.js';
import {starterDocument} from '../app/lib/page-builder-templates.js';
import {defaultSiteSettings,validateSiteSettings,builderMetadata,customFontCss} from '../app/lib/builder-design.js';
import {validateRuns,formatSelection} from '../app/lib/builder-rich-text.js';
import {effectivePublication,publicationDiff,documentUses} from '../app/lib/builder-publication.js';
const doc=children=>({schemaVersion:1,theme:{},children});
test('Site settings are opt-in, bounded and reject CSS/font URL injection',()=>{
 const site=defaultSiteSettings();assert.equal(site.header.custom,false);assert.deepEqual(validateSiteSettings(site),site);assert.equal(validateDocument(starterDocument('site'),'site',{publishing:true}).children.length,0);assert.throws(()=>validateDocument({...starterDocument('home'),site},'home'));
 for(const value of ['red','url(x)','#fff;display:none'])assert.throws(()=>validateSiteSettings({...site,design:{accentColor:value}}));assert.throws(()=>validateSiteSettings({...site,design:{buttonRadius:101}}));
 const font={id:'custom-'+'a'.repeat(32),name:'Own font',url:'https://example.com/storage/v1/object/public/site-builder-fonts/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.woff2'};assert.match(customFontCss(validateSiteSettings({...site,fonts:[font],design:{bodyFont:font.id}})),/font-display:swap/);assert.throws(()=>validateSiteSettings({...site,fonts:[{...font,url:'https://x.test/font.woff2";background:red'}]}));assert.throws(()=>validateSiteSettings({...site,fonts:Array(13).fill(font)}));
});
test('Rich text preserves selection boundaries and rejects mismatches, HTML and unsafe links',()=>{
 const runs=formatSelection([{text:'Bir harika müzik.'}],4,10,{bold:true,color:'#742633'});assert.equal(runs[1].text,'harika');assert.deepEqual(validateRuns(runs,'Bir harika müzik.'),runs);assert.throws(()=>validateRuns(runs,'Different'));assert.throws(()=>validateRuns([{text:'x',html:'<script/>'}],'x'));assert.throws(()=>validateRuns([{text:'x',href:'javascript:alert(1)'}],'x'));assert.throws(()=>validateRuns([{text:'x',href:'/store'}],'x',false));assert.deepEqual(formatSelection(runs,4,10,{bold:null,color:null}),[{text:'Bir harika müzik.'}]);const node=createNode('text',{props:{text:'Bir harika müzik.'},richText:{text:runs}});assert.deepEqual(validateDocument(doc([node]),'page:rich').children[0].richText.text,runs);
});
test('New widgets validate gallery, event and audio data',()=>{
 for(const type of ['album','artist','audio','events','countdown','gallery','shared'])assert.equal(validateDocument(doc([createNode(type)]),'page:widgets').children[0].type,type);const gallery=createNode('gallery');gallery.props.items=Array(25).fill({src:'/x.jpg',alt:'x'});assert.throws(()=>validateDocument(doc([gallery]),'home'));const events=createNode('events');events.props.items=[{title:'x',location:'y',date:'not-a-date',href:'/store'}];assert.throws(()=>validateDocument(doc([events]),'home'));const audio=createNode('audio');audio.props.src='javascript:1';assert.throws(()=>validateDocument(doc([audio]),'home'));
});
test('Shared blocks cannot recurse or expand without bound and long IDs remain distinct',()=>{
 const shared=createNode('shared',{props:{key:'block:one'}});assert.throws(()=>validateDocument(doc([shared]),'block:two'));assert.throws(()=>validateDocument(doc(Array.from({length:61},()=>createNode('text'))),'block:large'));assert.throws(()=>validateDocument(doc(Array.from({length:21},()=>createNode('shared'))),'page:large'));const long='n'+'a'.repeat(50),a=createNode('text',{id:long+'1'}),b=createNode('text',{id:long+'2'}),scoped=scopeSharedDocument(doc([a,b]),'ninstance');assert.notEqual(scoped.children[0].id,scoped.children[1].id);assert.equal(a.id,long+'1');assert.match(documentCss(scoped,'ninstance'),/data-pb-scope="ninstance"/);
});
test('Column ratios respect responsive layouts and custom font IDs compile safely',()=>{
 const columns=createNode('columns');columns.style.columnSplit=33;const css=documentCss(doc([columns]));assert.match(css,/grid-template-columns:33fr 67fr/);assert.match(css,/grid-template-columns:repeat\(1,minmax\(0,1fr\)\)/);const node=createNode('heading');node.style.fontFamily='custom-'+'a'.repeat(32);assert.match(documentCss(validateDocument(doc([node]))),/custom-aaaaaaaa/);node.style.fontFamily='bad";color:red';assert.throws(()=>validateDocument(doc([node])));
});
test('Scheduled snapshot only replaces an older publication at its due time',()=>{
 const now=Date.parse('2026-10-25T12:00:00Z'),live={version:2,document:{value:'old'}},plan={version:3,publish_at:'2026-10-25T13:00:00Z',document:{value:'new'}};assert.equal(effectivePublication(live,plan,now),live);assert.equal(effectivePublication(live,plan,now+3600000).document.value,'new');assert.equal(effectivePublication({...live,version:4},plan,now+3600000).version,4);
});
test('Publication review detects order/settings changes and media usage uses exact URLs',()=>{
 const before=doc([createNode('text'),createNode('heading')]),after=structuredClone(before);after.children.reverse();after.seo={title:'changed'};assert(publicationDiff(before,after).includes('Bölüm sırası'));assert(publicationDiff(before,after).includes('SEO ayarları'));assert(documentUses({items:[{src:'https://x.test/a.jpg'}]},'https://x.test/a.jpg'));assert(!documentUses({text:'https://x.test/a.jpg suffix'},'https://x.test/a.jpg'));
});
test('SEO preserves fallback metadata and fills per-product placeholders',()=>{
 const fallback={title:'Old',description:'Description',alternates:{canonical:'/store/x'}};assert.deepEqual(builderMetadata({seo:{title:'',description:'',image:'',noindex:false}},fallback),fallback);const result=builderMetadata({seo:{title:'{title} / {artist}',description:'A new edition',image:'/og.jpg',noindex:true}},fallback,{title:'Edition',artist:'Artist'});assert.equal(result.title,'Edition / Artist');assert.equal(result.robots.index,false);assert.equal(result.alternates.canonical,'/store/x');assert.deepEqual(result.openGraph.images,['/og.jpg']);
});
