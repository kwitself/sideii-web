import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Static, non-mutating regression checks on the actual versioned SQL migrations.
// They do not execute any payment, stock update or refund.
const load=path=>readFileSync(path,'utf8').toLowerCase();
const paid=load('supabase/migrations/20261014_paid_inventory_commit_transition.sql');
const refund=load('supabase/migrations/20261015_refund_preorder_stock_guard.sql');
const ledger=load('supabase/migrations/20261014_refund_inventory_idempotency.sql');
for(const marker of [
 'old.payment_status is distinct from new.payment_status',
 "new.payment_status='paid'",
 'new.inventory_committed=false',
 "oi.format<>'digital'",
 'not coalesce(oi.preorder,false)',
 'stock_qty=stock_qty-it.qty',
 'reserved_qty=reserved_qty-it.qty',
 'stock_qty>=it.qty and reserved_qty>=it.qty',
 "movement_type,quantity,reference_type,reference_id,note",
 "'sale',-it.qty",
 'inventory_committed=true',
 'raise exception'
]) assert.ok(paid.includes(marker),'Missing paid inventory safety rule: '+marker);
assert.ok(paid.includes('after update of payment_status'),'Stock commitment must be triggered by payment transition');
for(const marker of [
 "if o.payment_status<>'refunded'",
 'on conflict(order_id) do nothing',
 'if v_inserted is null then return',
 "it.format<>'digital' and not coalesce(it.preorder,false)",
 'reserved_qty=greatest(0,reserved_qty-it.quantity)',
 'stock_qty=stock_qty+it.quantity'
]) assert.ok(refund.includes(marker),'Missing refund inventory safety rule: '+marker);
assert.ok(ledger.includes('primary key references public.orders(id)'),'Refund finalization must be unique by order');
assert.ok(ledger.includes('where payment_status=\'refunded\''),'Historical refunded orders must be protected from replay');
console.log('Payment/stock/refund migration guardrails passed (static inspection, not live transaction tests).');
