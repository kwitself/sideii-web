import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app/api/payments/webhook/route.js',import.meta.url),'utf8');
test('payment webhook does not return internal exception messages',()=>{
 assert.doesNotMatch(source,/error:\s*error\.message/);
 assert.doesNotMatch(source,/error:\s*String\(error\?\.message/);
});
