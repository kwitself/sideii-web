-- SIDE:II Release Readiness / READ ONLY / run with authorized SQL access.
-- No transaction state changes; do not confuse clean data with an E2E checkout pass.
with checks as (
 select 'orders_present' as name,(select count(*) from public.orders)::bigint as failures
 union all select 'payment_events_present',(select count(*) from public.payment_events)::bigint
 union all select 'invalid_inventory_or_price',(select count(*) from public.product_variants
      where stock_qty<0 or reserved_qty<0 or reserved_qty>stock_qty or price<0)::bigint
 union all select 'uncommitted_paid_orders',(select count(*) from public.orders
      where payment_status='paid' and not coalesce(inventory_committed,false))::bigint
 union all select 'refunded_committed_orders',(select count(*) from public.orders
      where payment_status='refunded' and coalesce(inventory_committed,false))::bigint
)
select name,failures,case when failures=0 then 'PASS' else 'REVIEW' end as status from checks
order by name;
-- orders_present/payment_events_present must be interpreted as expected-empty
-- ONLY during prelaunch test cleanup; once live trading begins, nonzero is normal.
