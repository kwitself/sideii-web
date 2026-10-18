import assert from 'node:assert/strict';
import {trustedIyziLink} from '../app/lib/trusted-iyzilink.js';
for(const url of ['https://iyzi.link/abc','https://sandbox.iyzi.link/demo','https://iyzi.link/test?x=1'])assert.equal(trustedIyziLink(url),url);
for(const url of [null,'','javascript:alert(1)','http://iyzi.link/abc','https://iyzi.link.evil.com/abc','https://evil.com/?r=iyzi.link','https://user:pw@iyzi.link/a','https://iyzi.link:8443/a','https://sandbox.iyzi.link.evil.com/abc'])assert.equal(trustedIyziLink(url),null);
console.log('iyzico Link URL trust boundary passed (no requests or payments).');
