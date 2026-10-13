-- SIDE:II read-only inventory and payment consistency audit.
-- No updates, no invoice issuance, no payments, no refunds.
select
 (select count(*) from public.product_variants where stock_qty < 0 or reserved_qty < 0) as negative_inventory_rows,
 (select count(*) from public.product_variants where reserved_qty > stock_qty) as over_reserved_rows,
 (select count(*) from public.orders where payment_status = 'paid' and status = 'cancelled') as paid_cancelled_orders,
 (select count(*) from public.orders where payment_status = 'refunded' and inventory_committed = true) as refunded_committed_orders;

-- Developer review required before changing finalize_refund_inventory:
-- current procedure can add stock on repeated invocation where inventory_committed=false;
-- inspect refund event idempotency and reservation history first.
