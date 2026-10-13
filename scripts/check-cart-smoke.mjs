import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const storage=new Map();
const events=[];
globalThis.window={dispatchEvent:e=>events.push(e)};
globalThis.localStorage={
 getItem:key=>storage.get(key)??null,
 setItem:(key,value)=>storage.set(key,String(value)),
};
globalThis.CustomEvent=class CustomEvent {
 constructor(type,options={}){this.type=type;this.detail=options.detail;}
};
// Import actual production module; these are not reimplemented cart functions.
const source=readFileSync('app/lib/cart.js','utf8');
const cart=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const {CART_KEY,MAX_CART_LINE_QTY,readCart,writeCart,addCartItem}=cart;
const clear=()=>{storage.clear();events.length=0;};
const release={title:'QA release',catalogue:'QA',cover:'/qa.jpg',commerceConfig:{}};
const variant=(overrides={})=>({id:'physical-1',sku:'QA-P1',format:'vinyl',formatLabel:'Vinyl',price:500,stock:2,...overrides});

clear();
assert.deepEqual(readCart(),[],'Empty cart');
storage.set(CART_KEY,'{broken');
assert.deepEqual(readCart(),[],'Corrupt JSON must not crash');
storage.set(CART_KEY,JSON.stringify([{key:'bad',qty:-1},{key:'ok',qty:2},{key:'nan',qty:'no'}]));
assert.deepEqual(readCart().map(x=>x.key),['ok'],'Invalid cart rows filtered');

clear();
addCartItem(release,variant());
addCartItem(release,variant());
addCartItem(release,variant());
assert.equal(readCart().length,1,'Same variant must merge');
assert.equal(readCart()[0].qty,2,'Physical stock must cap quantity');
assert.equal(events.length,3,'Cart writes should notify UI');

clear();
assert.deepEqual(addCartItem(release,variant({stock:0})),[],'No stock: cannot add new item');
assert.equal(readCart().length,0,'Sold-out physical item not stored');

clear();
addCartItem(release,variant({id:'digital-1',format:'digital',stock:0}));
for(let i=0;i<MAX_CART_LINE_QTY+3;i++) addCartItem(release,variant({id:'digital-1',format:'digital',stock:0}));
assert.equal(readCart()[0].qty,MAX_CART_LINE_QTY,'Digital quantity global cap');

clear();
const limited={...release,commerceConfig:{max_qty:3}};
for(let i=0;i<7;i++)addCartItem(limited,variant({stock:12}));
assert.equal(readCart()[0].qty,3,'Product-specific limit');

clear();
for(let i=0;i<6;i++)addCartItem(release,variant({stock:0,preorderEnabled:true,preorderLimit:4}));
assert.equal(readCart()[0].qty,4,'Preorder limit');

clear();
const merch={...release,isMerch:true,mockups:{front:'/mock.png'},merchCategory:'shirt',storefrontConfig:{visibility:{wear:true}}};
addCartItem(merch,variant({id:'shirt-m',size:'M',color:'black'}));
assert.equal(readCart()[0].mockup,'/mock.png','Merch mockup preserved');
assert.equal(readCart()[0].wwysSupportEligible,true,'Support eligibility preserved');
assert.equal(readCart()[0].size,'M','Size preserved');
assert.equal(readCart()[0].color,'black','Color preserved');

clear();
writeCart([{key:'manual',qty:1}]);
assert.equal(events[0].type,'sideii-cart','Cart change event');
assert.equal(events[0].detail[0].key,'manual','Cart change detail');

console.log('SIDE:II production cart smoke tests passed (local storage only; no checkout/payment).');
