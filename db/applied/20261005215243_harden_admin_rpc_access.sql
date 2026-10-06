-- Snapshot of migration already applied to Supabase production.
-- Version: 20261005215243
-- Name: harden_admin_rpc_access
-- Source of truth at export time: supabase_migrations.schema_migrations

create or replace function public.admin_list_campaigns()
returns setof public.campaigns
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if coalesce((auth.jwt() -> 'app_metadata' ->> 'role'),'') <> 'admin' then
    raise exception 'Admin access required';
  end if;
  return query select * from public.campaigns order by created_at desc;
end;
$function$;

create or replace function public.admin_list_discount_codes()
returns setof public.discount_codes
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if coalesce((auth.jwt() -> 'app_metadata' ->> 'role'),'') <> 'admin' then
    raise exception 'Admin access required';
  end if;
  return query select * from public.discount_codes order by created_at desc;
end;
$function$;

create or replace function public.admin_stock_alerts()
returns table(
  variant_id uuid, sku text, title text, format text,
  available integer, threshold integer, preorder_enabled boolean, waitlist_count bigint
)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if coalesce((auth.jwt() -> 'app_metadata' ->> 'role'),'') <> 'admin' then
    raise exception 'Admin access required';
  end if;
  return query
  select pv.id,pv.sku,p.title,pv.format,
    greatest(0,pv.stock_qty-pv.reserved_qty),
    pv.low_stock_threshold,
    pv.preorder_enabled,
    (select count(*) from public.stock_waitlist w where w.variant_id=pv.id and w.notified_at is null)
  from public.product_variants pv
  join public.products p on p.id=pv.product_id
  where pv.active=true
    and (
      greatest(0,pv.stock_qty-pv.reserved_qty)<=pv.low_stock_threshold
      or exists(select 1 from public.stock_waitlist w where w.variant_id=pv.id and w.notified_at is null)
    )
  order by greatest(0,pv.stock_qty-pv.reserved_qty) asc,p.title;
end;
$function$;

create or replace function public.admin_toggle_campaign(p_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if coalesce((auth.jwt() -> 'app_metadata' ->> 'role'),'') <> 'admin' then
    raise exception 'Admin access required';
  end if;
  update public.campaigns set active=p_active,updated_at=now() where id=p_id;
end;
$function$;

create or replace function public.admin_toggle_discount_code(p_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if coalesce((auth.jwt() -> 'app_metadata' ->> 'role'),'') <> 'admin' then
    raise exception 'Admin access required';
  end if;
  update public.discount_codes set active=p_active,updated_at=now() where id=p_id;
end;
$function$;

create or replace function public.admin_save_campaign(
  p_id uuid, p_name text, p_campaign_type text, p_value numeric, p_min_qty integer,
  p_min_subtotal numeric, p_scope_type text, p_scope_value text, p_usage_limit integer,
  p_valid_until timestamptz, p_active boolean
)
returns public.campaigns
language plpgsql
security definer
set search_path to 'public'
as $function$
declare out_row public.campaigns;
begin
  if coalesce((auth.jwt() -> 'app_metadata' ->> 'role'),'') <> 'admin' then
    raise exception 'Admin access required';
  end if;
  if nullif(trim(p_name),'') is null then raise exception 'Campaign name is required'; end if;
  if p_campaign_type not in ('quantity_percent','first_order_percent','free_shipping') then raise exception 'Invalid campaign type'; end if;
  if p_scope_type not in ('all','product','category','imprint','format') then raise exception 'Invalid scope'; end if;
  if p_campaign_type in ('quantity_percent','first_order_percent') and (coalesce(p_value,0)<=0 or p_value>100) then raise exception 'Percent must be between 1 and 100'; end if;

  if p_id is null then
    insert into public.campaigns(name,campaign_type,value,min_qty,min_subtotal,scope_type,scope_value,usage_limit,valid_until,active)
    values(trim(p_name),p_campaign_type,case when p_campaign_type='free_shipping' then 0 else coalesce(p_value,0) end,
      greatest(1,coalesce(p_min_qty,1)),greatest(0,coalesce(p_min_subtotal,0)),p_scope_type,
      case when p_scope_type='all' then null else p_scope_value end,p_usage_limit,p_valid_until,coalesce(p_active,true))
    returning * into out_row;
  else
    update public.campaigns set
      name=trim(p_name),campaign_type=p_campaign_type,
      value=case when p_campaign_type='free_shipping' then 0 else coalesce(p_value,0) end,
      min_qty=greatest(1,coalesce(p_min_qty,1)),min_subtotal=greatest(0,coalesce(p_min_subtotal,0)),
      scope_type=p_scope_type,scope_value=case when p_scope_type='all' then null else p_scope_value end,
      usage_limit=p_usage_limit,valid_until=p_valid_until,active=coalesce(p_active,true),updated_at=now()
    where id=p_id returning * into out_row;
  end if;
  return out_row;
end;
$function$;

create or replace function public.admin_save_discount_code(
  p_id uuid, p_code text, p_discount_type text, p_value numeric, p_min_subtotal numeric,
  p_usage_limit integer, p_valid_until timestamptz, p_active boolean
)
returns public.discount_codes
language plpgsql
security definer
set search_path to 'public'
as $function$
declare out_row public.discount_codes;
begin
  if coalesce((auth.jwt() -> 'app_metadata' ->> 'role'),'') <> 'admin' then
    raise exception 'Admin access required';
  end if;
  if nullif(trim(p_code),'') is null then raise exception 'Code is required'; end if;
  if p_discount_type not in ('percent','fixed','free_shipping') then raise exception 'Invalid discount type'; end if;
  if p_discount_type='percent' and (coalesce(p_value,0)<=0 or p_value>100) then raise exception 'Percent must be between 1 and 100'; end if;
  if p_discount_type='fixed' and coalesce(p_value,0)<=0 then raise exception 'Fixed discount must be greater than zero'; end if;

  if p_id is null then
    insert into public.discount_codes(code,discount_type,value,min_subtotal,usage_limit,valid_until,active)
    values(upper(trim(p_code)),p_discount_type,case when p_discount_type='free_shipping' then 0 else coalesce(p_value,0) end,
           greatest(0,coalesce(p_min_subtotal,0)),p_usage_limit,p_valid_until,coalesce(p_active,true))
    returning * into out_row;
  else
    update public.discount_codes set
      code=upper(trim(p_code)),discount_type=p_discount_type,
      value=case when p_discount_type='free_shipping' then 0 else coalesce(p_value,0) end,
      min_subtotal=greatest(0,coalesce(p_min_subtotal,0)),
      usage_limit=p_usage_limit,valid_until=p_valid_until,active=coalesce(p_active,true),updated_at=now()
    where id=p_id returning * into out_row;
  end if;
  return out_row;
end;
$function$;

create or replace function public.admin_save_discount_code_v2(
  p_id uuid, p_code text, p_discount_type text, p_value numeric, p_min_subtotal numeric,
  p_usage_limit integer, p_valid_until timestamptz, p_active boolean, p_scope_type text,
  p_scope_value text, p_per_customer_limit integer, p_first_order_only boolean, p_min_item_qty integer
)
returns public.discount_codes
language plpgsql
security definer
set search_path to 'public'
as $function$
declare out_row public.discount_codes;
begin
  if coalesce((auth.jwt() -> 'app_metadata' ->> 'role'),'') <> 'admin' then
    raise exception 'Admin access required';
  end if;
  if nullif(trim(p_code),'') is null then raise exception 'Code is required'; end if;
  if p_discount_type not in ('percent','fixed','free_shipping') then raise exception 'Invalid discount type'; end if;
  if p_scope_type not in ('all','product','category','imprint','format') then raise exception 'Invalid scope'; end if;
  if p_scope_type<>'all' and nullif(trim(coalesce(p_scope_value,'')),'') is null then raise exception 'Scope value is required'; end if;
  if p_discount_type='percent' and (coalesce(p_value,0)<=0 or p_value>100) then raise exception 'Percent must be between 1 and 100'; end if;
  if p_discount_type='fixed' and coalesce(p_value,0)<=0 then raise exception 'Fixed discount must be greater than zero'; end if;

  if p_id is null then
    insert into public.discount_codes(code,discount_type,value,min_subtotal,usage_limit,valid_until,active,scope_type,scope_value,per_customer_limit,first_order_only,min_item_qty)
    values(upper(trim(p_code)),p_discount_type,case when p_discount_type='free_shipping' then 0 else coalesce(p_value,0) end,
      greatest(0,coalesce(p_min_subtotal,0)),p_usage_limit,p_valid_until,coalesce(p_active,true),
      p_scope_type,case when p_scope_type='all' then null else p_scope_value end,p_per_customer_limit,
      coalesce(p_first_order_only,false),greatest(1,coalesce(p_min_item_qty,1)))
    returning * into out_row;
  else
    update public.discount_codes set
      code=upper(trim(p_code)),discount_type=p_discount_type,
      value=case when p_discount_type='free_shipping' then 0 else coalesce(p_value,0) end,
      min_subtotal=greatest(0,coalesce(p_min_subtotal,0)),usage_limit=p_usage_limit,valid_until=p_valid_until,
      active=coalesce(p_active,true),scope_type=p_scope_type,scope_value=case when p_scope_type='all' then null else p_scope_value end,
      per_customer_limit=p_per_customer_limit,first_order_only=coalesce(p_first_order_only,false),
      min_item_qty=greatest(1,coalesce(p_min_item_qty,1)),updated_at=now()
    where id=p_id returning * into out_row;
  end if;
  return out_row;
end;
$function$;

do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname like 'admin_%'
  loop
    execute format('revoke execute on function %s from public', r.signature);
    execute format('revoke execute on function %s from anon', r.signature);
    execute format('grant execute on function %s to authenticated', r.signature);
    execute format('grant execute on function %s to service_role', r.signature);
  end loop;
end $$;
