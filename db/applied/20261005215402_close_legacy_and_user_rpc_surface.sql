-- Snapshot of migration already applied to Supabase production.
-- Version: 20261005215402
-- Name: close_legacy_and_user_rpc_surface
-- Source of truth at export time: supabase_migrations.schema_migrations

do $$
declare r record;
begin
  -- Legacy commerce RPCs are no longer used by the storefront.
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.proname in (
        'create_store_order','create_store_order_v2','create_store_order_v3',
        'quote_store_order','quote_store_order_v2','quote_store_order_v3'
      )
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.signature);
    execute format('grant execute on function %s to service_role', r.signature);
  end loop;

  -- Internal quote helpers are callable only by privileged database code.
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.proname in ('quote_store_order_v4_base','calculate_best_bundle_discount')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.signature);
    execute format('grant execute on function %s to service_role', r.signature);
  end loop;

  -- Account-scoped RPCs require an authenticated session.
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and (p.proname like 'get_my_%' or p.proname like 'save_my_%')
  loop
    execute format('revoke execute on function %s from public, anon', r.signature);
    execute format('grant execute on function %s to authenticated, service_role', r.signature);
  end loop;
end $$;
