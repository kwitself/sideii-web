import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const editor=readFileSync('app/admin/EditReleaseModal.js','utf8');
const create=readFileSync('app/admin/ReleaseWorkspace.js','utf8');
assert.match(editor,/shipping_class:v\.shipping_class\.trim\(\)\|\|defaultShippingClass\(v\.format\)/);
assert.match(editor,/shipping_class:v\.shipping_class\|\|defaultShippingClass\(v\.format\|\|'cd'\)/);
assert.match(create,/shipping_class:shippingClass/);
for(const code of ["fmt==='vinyl'?'vinyl'","fmt==='digital'?'digital'"])assert.ok(create.includes(code));
console.log('Required shipping class editor/create guardrails passed.');
