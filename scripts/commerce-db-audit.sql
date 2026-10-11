-- Read-only post-deployment verification for SIDE:II payment and inventory hardening.
-- Execute against a non-production database or as read-only audit.
select
  exists(
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='apply_payment_event'
      and position('ev.provider_payment_id is distinct from' in pg_get_functiondef(p.oid))>0
  ) as duplicate_payment_identity_guard,
  exists(
    select 1 from pg_indexes
    where schemaname='public' and tablename='payment_events'
      and indexname='payment_events_success_provider_payment_id_uidx'
      and position('payment.succeeded' in indexdef)>0
  ) as refund_compatible_unique_index,
  exists(
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='enforce_pending_order_reservation_limit'
      and position('pg_advisory_xact_lock' in pg_get_functiondef(p.oid))>0
  ) as concurrent_checkout_serialization;
