import test from 'node:test';
import assert from 'node:assert/strict';
import {notificationRetryDecision as decide} from '../app/lib/server/notificationRetryPolicy.js';
const now=Date.parse('2026-10-12T00:00:00Z');
const item=(outcome,error_code,minutesAgo)=>({outcome,error_code,attempted_at:new Date(now-minutesAgo*60000).toISOString()});
test('first notification can send',()=>assert.equal(decide([],now).send,true));
test('accepted delivery never blindly resends',()=>assert.equal(decide([item('sent',null,500)],now).reason,'provider_accepted_review'));
test('timeout has uncertain outcome and requires reconciliation',()=>assert.equal(decide([item('failed','network_error',500)],now).send,false));
test('429 retries only after cooldown',()=>{
 assert.equal(decide([item('failed','http_429',3)],now).reason,'retry_cooldown');
 assert.equal(decide([item('failed','http_429',8)],now).send,true);
});
test('permanent 400 does not retry',()=>assert.equal(decide([item('failed','http_400',200)],now).send,false));
test('fifth attempt stops automatic retries',()=>assert.equal(decide(Array(5).fill(item('failed','http_503',500)),now).reason,'max_attempts_review'));
test('attempt two uses longer delay',()=>assert.equal(decide([item('failed','http_503',10),item('failed','http_503',80)],now).reason,'retry_cooldown'));
