-- Snapshot of migration already applied to Supabase production.
-- Version: 20261005215112
-- Name: fix_control_room_alerts_ordering
-- Source of truth at export time: supabase_migrations.schema_migrations

create or replace function public.admin_get_control_room_alerts()
returns table(alert_type text, priority integer, title text, detail text, entity_id uuid)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if coalesce((auth.jwt() -> 'app_metadata' ->> 'role'),'') <> 'admin' then
    raise exception 'Admin access required';
  end if;

  return query
  select q.alert_type,q.priority,q.title,q.detail,q.entity_id
  from (
    select 'low_stock'::text as alert_type,1::integer as priority,p.title::text as title,
           (coalesce(v.sku,'')||' · '||greatest(coalesce(v.stock_qty,0)-coalesce(v.reserved_qty,0),0)||' available')::text as detail,
           v.id as entity_id
    from public.product_variants v
    join public.products p on p.id=v.product_id
    where v.active=true
      and greatest(coalesce(v.stock_qty,0)-coalesce(v.reserved_qty,0),0)<=coalesce(v.low_stock_threshold,0)

    union all

    select 'order'::text,1::integer,('Order #SII-'||lpad(o.order_no::text,4,'0'))::text,
           (upper(o.status)||' · '||upper(o.payment_status))::text,o.id
    from public.orders o
    where o.status in ('pending','preparing') and o.payment_status='paid'

    union all

    select 'impact'::text,2::integer,'Impact batch ready'::text,
           (c.name||' · '||to_char(sum(a.amount),'FM999999990.00')||' TRY')::text,c.id
    from public.impact_allocations a
    join public.impact_campaigns c on c.id=a.campaign_id
    where a.status='pending'
    group by c.id,c.name
  ) q
  order by q.priority,q.alert_type;
end;
$function$;
