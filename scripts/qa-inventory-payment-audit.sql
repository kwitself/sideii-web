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

-- Paid orders with reservations that have not been committed (review only).
select o.order_no,o.payment_status,o.status,o.inventory_committed,
       oi.sku,oi.format,oi.quantity,oi.preorder,
       pv.stock_qty,pv.reserved_qty,
       (select count(*) from public.inventory_movements im
        where im.reference_type='order' and im.reference_id=o.id
          and im.variant_id=oi.variant_id and im.movement_type='reserve') as reserve_events,
       (select count(*) from public.inventory_movements im
        where im.reference_type='order' and im.reference_id=o.id
          and im.variant_id=oi.variant_id and im.movement_type='sale') as sale_events
from public.orders o
join public.order_items oi on oi.order_id=o.id
left join public.product_variants pv on pv.id=oi.variant_id
where o.payment_status='paid' and not coalesce(o.inventory_committed,false)
order by o.order_no,oi.sku;

-- Review provider events before any remediation. Do not confuse QA SKUs with fake payment.
select o.order_no,o.total,o.currency,pe.provider,pe.event_type,pe.amount,pe.processed_at
from public.orders o left join public.payment_events pe on pe.order_id=o.id
where o.payment_status='paid' and not coalesce(o.inventory_committed,false)
order by o.order_no;
