import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Static checkout guardrail smoke test. Does not create orders or issue payments.
const source=readFileSync('app/components/GlobalBag.js','utf8');
const start=source.indexOf('async function placeOrder(e)');
const end=source.indexOf(' const close=()=>',start);
assert.ok(start>=0&&end>start,'Checkout submission function missing');
const submit=source.slice(start,end);
for(const marker of [
 "supabase.rpc('create_store_order_v5'",
 "if(created.error)",
 "if(!data?.order_id)",
 "Your cart has been kept",
 "catch(err){setError(",
 "finally{setBusy(false)}",
 "reserve_order_value",
 "get_guest_order_payment_link",
 "setDone(finalData)",
 "update([])"
]) assert.ok(submit.includes(marker),`Checkout guard missing: ${marker}`);
assert.ok(submit.indexOf('if(!data?.order_id)')<submit.indexOf('update([])'),'Order confirmation must precede cart clear');
assert.ok(submit.indexOf('setDone(finalData)')<submit.indexOf('update([])'),'Order completion must precede cart clear');
console.log('Checkout safety source guardrails passed; this is NOT an end-to-end payment test.');
