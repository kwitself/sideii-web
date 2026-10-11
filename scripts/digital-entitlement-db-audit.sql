-- SIDE:II read-only digital entitlement release audit.
-- Must return true, true, true and zero violations.
select
  (select position('for update of oi' in lower(pg_get_functiondef(oid)))>0
   from pg_proc where proname='create_my_digital_download_grant' and pronamespace='public'::regnamespace) as account_grant_uses_row_lock,
  (select position('used_at is null' in lower(pg_get_functiondef(oid)))>0
   from pg_proc where proname='create_my_digital_download_grant' and pronamespace='public'::regnamespace) as consumed_account_grants_retained,
  (select position('for update of oi' in lower(pg_get_functiondef(oid)))>0
   from pg_proc where proname='create_guest_digital_download_grant' and pronamespace='public'::regnamespace) as guest_grant_uses_row_lock,
  (select count(*) from public.order_items where digital_download_count>digital_download_limit) as over_limit_items,
  (select count(*) from public.product_variants where reserved_qty<0) as negative_reserved_items;
