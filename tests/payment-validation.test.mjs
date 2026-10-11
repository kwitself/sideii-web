import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {verifyPaymentSignature} from '../app/lib/server/paymentValidation.mjs';

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
