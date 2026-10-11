import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {verifyPaymentSignature,validatePaymentEvent} from '../app/lib/server/paymentValidation.mjs';

const secret='local-test-secret';
const payload=JSON.stringify({event_id:'local-001',event_type:'payment.succeeded',amount:123.45});
const signed=createHmac('sha256',secret).update(payload).digest('hex');

test('valid signed payload is accepted',()=>{
 assert.equal(verifyPaymentSignature(payload,signed,secret),true);
});
test('uppercase hex signature accepted',()=>{
 assert.equal(verifyPaymentSignature(payload,signed.toUpperCase(),secret),true);
});
test('changed payload rejected',()=>{
 assert.equal(verifyPaymentSignature(payload+' ',signed,secret),false);
});
test('invalid and malformed signatures rejected',()=>{
 for(const signature of ['', 'xyz',signed.slice(0,60),signed+'00','f'.repeat(64)]){
  assert.equal(verifyPaymentSignature(payload,signature,secret),false);
 }
});
test('missing secret fails closed',()=>{
 assert.equal(verifyPaymentSignature(payload,signed,''),false);
});
test('wrong signing secret rejected',()=>{
 assert.equal(verifyPaymentSignature(payload,signed,'another-secret'),false);
});

const validEvent={
 provider:'generic',event_id:'event-1',event_type:'payment.succeeded',
 order_id:'c850f3b3-bdb9-4e42-ade5-ef1d6635a7c5',currency:'TRY',amount:99.95
};
test('valid event accepted',()=>{
 assert.equal(validatePaymentEvent(validEvent,'generic').ok,true);
});
test('missing, null and string payment amounts rejected',()=>{
 for(const amount of [undefined,null,'0','99.95',NaN,Infinity,-1]){
  assert.equal(validatePaymentEvent({...validEvent,amount},'generic').ok,false);
 }
});
test('unknown provider and unsupported event rejected',()=>{
 assert.equal(validatePaymentEvent({...validEvent,provider:'other'},'generic').ok,false);
 assert.equal(validatePaymentEvent({...validEvent,event_type:'payment.changed'},'generic').ok,false);
});
test('invalid order identifier and event id rejected',()=>{
 assert.equal(validatePaymentEvent({...validEvent,order_id:'not-an-id'},'generic').ok,false);
 assert.equal(validatePaymentEvent({...validEvent,event_id:''},'generic').ok,false);
});
