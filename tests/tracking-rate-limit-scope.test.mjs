import test from 'node:test';
import assert from 'node:assert/strict';
import {trackingRateLimitScope as scope} from '../app/lib/server/trackingRateLimitScope.js';
test('localhost quota scoped by normalized email, not shared across all customers',()=>{
 assert.equal(scope({development:true,email:' Person@Example.com '}),'local:person@example.com');
 assert.notEqual(scope({development:true,email:'a@example.com'}),scope({development:true,email:'b@example.com'}));
});
test('production quota scoped by network IP, never email',()=>{
 assert.equal(scope({ip:'203.0.113.7',email:'a@example.com'}),'ip:203.0.113.7');
 assert.equal(scope({ip:'203.0.113.7',email:'b@example.com'}),'ip:203.0.113.7');
});
test('untrusted production network shares conservative fallback quota',()=>{
 assert.equal(scope({ip:'unknown'}),'ip:unknown');
});
