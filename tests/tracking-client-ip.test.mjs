import test from 'node:test';
import assert from 'node:assert/strict';
import {trackingClientIp} from '../app/lib/server/trackingClientIp.js';
const headers=(values)=>new Headers(values);
test('use Vercel-managed IP, not client x-real-ip',()=>{
 assert.equal(trackingClientIp(headers({'x-vercel-forwarded-for':'203.0.113.7','x-real-ip':'198.51.100.99'}),{vercel:true}),'203.0.113.7');
});
test('untrusted hosting ignores spoofed forwarding headers',()=>{
 assert.equal(trackingClientIp(headers({'x-forwarded-for':'198.51.100.99'})),'unknown');
});
test('reject malformed IP',()=>{
 assert.equal(trackingClientIp(headers({'x-vercel-forwarded-for':'bogus'}),{vercel:true}),'unknown');
});
test('allow IPv6 on Vercel',()=>{
 assert.equal(trackingClientIp(headers({'x-vercel-forwarded-for':'2001:db8::1'}),{vercel:true}),'2001:db8::1');
});
