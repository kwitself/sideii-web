import test from 'node:test';
import assert from 'node:assert/strict';
import {createNode,validateDocument} from '../app/lib/page-builder.js';
import {widgetDefaults,validateWidgetProps} from '../app/lib/builder-widgets.js';
for(const type of ['discography','tracklist','tabs']){
 test(type+' validates default document',()=>{
  const node=createNode(type);
  assert.deepEqual(validateWidgetProps(type,node.props,'home'),node.props);
  const valid=validateDocument({schemaVersion:1,theme:{},children:[node]},'home');
  assert.equal(valid.children[0].type,type);
 });
}
test('discography filter and count bounds',()=>{
 const defaults=widgetDefaults('discography');
 assert.throws(()=>validateWidgetProps('discography',{...defaults,limit:'25'},'home'));
 assert.throws(()=>validateWidgetProps('discography',{...defaults,imprint:'unknown'},'home'));
});
test('tracklist and tabs count bounds',()=>{
 assert.throws(()=>validateWidgetProps('tracklist',{title:'A',items:Array.from({length:31},()=>({title:'A',duration:'',src:''}))},'home'));
 assert.throws(()=>validateWidgetProps('tabs',{title:'A',items:Array.from({length:9},()=>({label:'A',text:'A'}))},'home'));
});

test('timeline and merchandise widgets validate defaults',()=>{
 for(const type of ['timeline','merch']){
  const node=createNode(type);
  assert.deepEqual(validateWidgetProps(type,node.props,'home'),node.props);
  const doc=validateDocument({schemaVersion:1,theme:{},children:[node]},'home');
  assert.equal(doc.children[0].type,type);
 }
});
test('timeline and merchandise enforce item and filter limits',()=>{
 assert.throws(()=>validateWidgetProps('timeline',{title:'A',items:Array.from({length:25},()=>({title:'A',year:'2026',text:'',href:''}))},'home'));
 assert.throws(()=>validateWidgetProps('merch',{...widgetDefaults('merch'),imprint:'unknown'},'home'));
});
