import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Source-level boundary checks only; never sends email, changes status or charges money.
const source=readFileSync('app/api/orders/notify-v2/route.js','utf8');
const required=[
 "Invalid order identifier",
 "Order notification token required",
 "claim_received_order_email",
 "claim_server_order_email",
 "Admin access required",
 "SUPABASE_SECRET_KEY",
 "getUser()",
 "already_sent_or_not_found",
 "sendOrderEmailPayload(payload)"
];
for(const marker of required)assert.ok(source.includes(marker),'Missing order notification guard: '+marker);
const received=source.indexOf("if(type==='received')");
const admin=source.indexOf('}else{',received);
const send=source.indexOf('sendOrderEmailPayload(payload)');
assert.ok(received>0&&admin>received&&send>admin,'Expected notification auth partition missing');
assert.ok(source.indexOf("body.notification_token",received)<admin,'Guest notification must use token');
assert.ok(source.indexOf("getUser()",admin)<send,'Admin identity check must happen before send');
assert.ok(source.indexOf("claim_server_order_email",admin)<send,'Server claim must happen before send');
assert.ok(source.indexOf("Invalid order identifier")<received,'Invalid order IDs rejected before RPC');
console.log('Order notification boundary checks passed (static checks, not live email/payment tests).');
