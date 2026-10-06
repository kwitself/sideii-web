-- Snapshot of migration already applied to Supabase production.
-- Version: 20261006170257
-- Name: restrict_internal_trigger_function_execute
-- Source of truth at export time: supabase_migrations.schema_migrations

do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.proname in (
        'allocate_order_impact',
        'audit_order_state_changes',
        'audit_product_changes',
        'finalize_order_value',
        'handle_new_customer_account',
        'issue_order_passports',
        'rls_auto_enable'
      )
  loop
    execute format('revoke execute on function %s from public, anon, authenticated',r.signature);
    execute format('grant execute on function %s to service_role',r.signature);
  end loop;
end $$;
