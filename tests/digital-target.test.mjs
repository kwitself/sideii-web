import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyDownloadTarget as classify} from '../app/lib/server/digitalTarget.mjs';
const base='https://side.example/download/token';
test('private delivery accepts safe nested paths',()=>{
 assert.deepEqual(classify('storage-private://albums/release.zip',base),{kind:'private',path:'albums/release.zip'});
});
test('private delivery rejects traversal and encoded paths',()=>{
 for(const target of ['storage-private:///etc/passwd','storage-private://a/../b','storage-private://a/./b','storage-private://a//b','storage-private://a/%2e%2e/b','storage-private://a\\b']){
  assert.equal(classify(target,base).kind,'invalid',target);
 }
});
test('internal demo and same-origin path permitted',()=>{
 assert.equal(classify('sideii-internal://demo-digital',base).kind,'demo');
 assert.equal(classify('/media/track.mp3',base).kind,'same-origin');
});
test('external hosts must be HTTPS and explicitly allowed',()=>{
 assert.equal(classify('https://files.example/release.zip',base,'files.example').kind,'external');
 for(const target of ['http://files.example/release.zip','https://evil.example/release.zip','https://files.example.evil.example/release.zip','https://user:pass@files.example/release.zip','//evil.example/track','javascript:alert(1)']){
  assert.notEqual(classify(target,base,'files.example').kind,'external',target);
 }
});
test('malformed control and slash targets fail closed',()=>{
 for(const target of ['/\\evil.example/file','https://files.example/x\nHeader:yes','','storage-private://a\u0000b']){
  assert.equal(classify(target,base,'files.example').kind,'invalid',target);
 }
});
