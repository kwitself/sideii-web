import test from 'node:test';
import assert from 'node:assert/strict';
import {isAdminUser,isQaFixture,inventorySummary,stockAdjustment,updateStockSafely} from '../app/lib/adminSafety.js';
import {evaluateProductQa} from '../app/lib/productQa.js';
const valid=()=>({title:'Studio Edition',catalogue_no:'SII-009',slug:'studio-edition',status:'draft',artwork_path:'cover.png',product_variants:[{id:'one',sku:'SII-009-CD',format:'cd',active:true,price:120,stock_qty:5,reserved_qty:1}]});
test('Only trusted app metadata grants admin UI access',()=>{
 assert.equal(isAdminUser({user_metadata:{role:'admin'}}),false);
 assert.equal(isAdminUser({app_metadata:{role:'customer'}}),false);
 assert.equal(isAdminUser({app_metadata:{role:'admin'}}),true);
 assert.equal(isAdminUser(null),false);
});
test('Fixture detection covers catalogue, slug and variant SKU',()=>{
 for(const p of [{catalogue_no:'QA-001'},{slug:'qa-hidden'},{product_variants:[{sku:'qa-test'}]}])assert.equal(isQaFixture(p),true);
 assert.equal(isQaFixture(valid()),false);
 assert.equal(isQaFixture(null),false);
});
test('Publication checks target active state rather than stale draft state',()=>{
 const p=valid();p.product_variants[0].stock_qty=0;p.product_variants[0].reserved_qty=0;
 assert.ok(evaluateProductQa(p,'active').blockers.some(x=>x.code==='availability'));
 assert.ok(!evaluateProductQa(p,'forthcoming').blockers.some(x=>x.code==='availability'));
});
test('Missing, zero and invalid prices cannot be published',()=>{
 for(const price of [null,undefined,'',0,' ',NaN,Infinity,-1]){
  const p=valid();p.product_variants[0].price=price;
  assert.ok(evaluateProductQa(p,'active').blockers.some(x=>x.code==='price'));
 }
 assert.equal(evaluateProductQa(valid(),'active').ready,true);
});
test('Inactive variants cannot supply availability and duplicate SKUs are rejected',()=>{
 const p=valid();p.product_variants[0].active=false;
 assert.equal(evaluateProductQa(p,'active').ready,false);
 const duplicate=valid();duplicate.product_variants.push({...duplicate.product_variants[0],id:'two'});
 assert.ok(evaluateProductQa(duplicate).blockers.some(x=>x.code==='duplicate-sku'));
});
test('Digital publication requires a delivery file and fixtures stay blocked',()=>{
 const p=valid();p.product_variants[0].format='digital';
 assert.ok(evaluateProductQa(p,'active').blockers.some(x=>x.code==='digital-file'));
 p.product_variants[0].digital_download_url='storage-private://album.zip';
 assert.equal(evaluateProductQa(p,'active').ready,true);
 p.catalogue_no='QA-001';assert.equal(evaluateProductQa(p,'active').ready,false);
});
test('Inventory separates digital and inactive stock from active physical totals',()=>{
 const summary=inventorySummary([{format:'digital',stock_qty:900},{format:'cd',stock_qty:5,reserved_qty:2,low_stock_threshold:3},{format:'vinyl',stock_qty:60,active:false}]);
 assert.equal(summary.physical.length,2);assert.equal(summary.stock,5);assert.equal(summary.available,3);assert.equal(summary.reserved,2);assert.equal(summary.low.length,1);
});
test('Stock edits reject fractions, blanks and stock below reserved units',()=>{
 for(const stock_qty of ['',-1,1.5,1,Infinity])assert.throws(()=>stockAdjustment({stock_qty,reserved_qty:2,low_stock_threshold:1}));
 const payload=stockAdjustment({stock_qty:'4',reserved_qty:2,low_stock_threshold:'1',manufactured_qty:3});
 assert.deepEqual(payload,{stock_qty:4,low_stock_threshold:1,manufactured_qty:4});
 assert.equal('reserved_qty' in payload,false);
});
test('Stale stock edit cannot create an inventory movement',async()=>{
 const calls=[];const query={update(p){calls.push(p);return this},eq(...args){calls.push(args);return this},select(){return this},async maybeSingle(){return {data:null,error:null}}};
 const client={from(table){assert.equal(table,'product_variants');return query}};
 await assert.rejects(updateStockSafely(client,{id:'v',stock_qty:8,reserved_qty:2,low_stock_threshold:1,originalStock:10}),/Inventory changed/);
 assert.ok(calls.some(c=>Array.isArray(c)&&c[0]==='reserved_qty'&&c[1]===2));
});
test('Threshold-only edits do not insert forbidden zero-quantity movements',async()=>{
 const query={update(){return this},eq(){return this},select(){return this},async maybeSingle(){return {data:{id:'v'},error:null}}};
 const client={from(table){assert.equal(table,'product_variants');return query}};
 assert.deepEqual(await updateStockSafely(client,{id:'v',stock_qty:8,reserved_qty:2,low_stock_threshold:3,originalStock:8}),{stock:8,ledgerError:null});
});
test('Movement logging records the delta and preserves its failure for the UI',async()=>{
 const failure={message:'Ledger unavailable'};
 const query={update(){return this},eq(){return this},select(){return this},async maybeSingle(){return {data:{id:'v'},error:null}}};
 const client={from(table){return table==='product_variants'?query:{async insert(payload){assert.equal(payload.quantity,-2);return {error:failure}}}}};
 assert.deepEqual(await updateStockSafely(client,{id:'v',stock_qty:6,reserved_qty:2,low_stock_threshold:1,originalStock:8}),{stock:6,ledgerError:failure});
});
