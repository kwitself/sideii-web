-- SIDE:II read-only inventory concurrency contract audit.
-- This audit does not create orders or change stock.
-- Expected booleans: true. Expected anomaly counts: 0.
with definitions as (
 select proname, lower(pg_get_functiondef(p.oid)) body
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and proname in
 ('create_store_order_v4','create_store_order_v5','release_stale_order_reservations',
  'consume_digital_download_grant','create_my_digital_download_grant',
  'create_guest_digital_download_grant')
)
select
 exists(select 1 from definitions where proname='create_store_order_v4'
   and position('for update of pv' in body)>0
   and position('reserved_qty=reserved_qty+q' in body)>0
   and position('(v.stock_qty-v.reserved_qty)<q' in body)>0) as checkout_stock_row_lock_and_capacity_check,
 exists(select 1 from definitions where proname='create_store_order_v5'
   and position('create_store_order_v4' in body)>0) as live_checkout_uses_locked_core,
 exists(select 1 from definitions where proname='release_stale_order_reservations'
   and position('for update skip locked' in body)>0) as expiry_uses_skip_locked,
 exists(select 1 from definitions where proname='consume_digital_download_grant'
   and position('for update of g,oi' in body)>0
   and position('digital_download_count<digital_download_limit' in body)>0) as download_consumption_is_serialized,
 (select count(*) from public.product_variants where reserved_qty<0) as negative_reserved_count,
 (select count(*) from public.order_items where digital_download_count>digital_download_limit) as download_over_limit_count;
