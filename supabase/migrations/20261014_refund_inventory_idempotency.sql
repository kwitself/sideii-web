-- SIDE:II refund inventory idempotency.
-- A single ledger row per order serializes refund stock finalization.
create table if not exists public.refund_inventory_finalizations (
  order_id uuid primary key references public.orders(id) on delete restrict,
  finalized_at timestamptz not null default now()
);
-- Mark historical refunded orders as already handled; do not change stock.
insert into public.refund_inventory_finalizations(order_id)
select id from public.orders where payment_status='refunded'
on conflict(order_id) do nothing;

create or replace function public.finalize_refund_inventory(p_order_id uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare
 o public.orders%rowtype;
 it record;
 v_inserted uuid;
begin
 select * into o from public.orders where id=p_order_id for update;
 if not found then raise exception 'Order not found'; end if;
 if o.payment_status<>'refunded' then raise exception 'Verified refund required'; end if;

 insert into public.refund_inventory_finalizations(order_id) values(o.id)
 on conflict(order_id) do nothing returning order_id into v_inserted;
 if v_inserted is null then return; end if;

 if not o.inventory_committed then
  for it in select oi.variant_id,oi.quantity,oi.format,oi.preorder
            from public.order_items oi where oi.order_id=o.id
  loop
   if it.variant_id is not null and it.format<>'digital' and not coalesce(it.preorder,false) then
    update public.product_variants
    set reserved_qty=greatest(0,reserved_qty-it.quantity),updated_at=now()
    where id=it.variant_id;
    insert into public.inventory_movements(variant_id,movement_type,quantity,reference_type,reference_id,note)
    values(it.variant_id,'release',-it.quantity,'order',o.id,'Reservation released by verified refund');
   end if;
  end loop;
 else
  for it in select oi.variant_id,oi.quantity,oi.format from public.order_items oi where oi.order_id=o.id
  loop
   if it.variant_id is not null and it.format<>'digital' then
    update public.product_variants set stock_qty=stock_qty+it.quantity,updated_at=now() where id=it.variant_id;
    insert into public.inventory_movements(variant_id,movement_type,quantity,reference_type,reference_id,note)
    values(it.variant_id,'return',it.quantity,'order',o.id,'Stock returned by verified refund');
   end if;
  end loop;
 end if;
 update public.orders set inventory_committed=false where id=o.id;
end $$;
revoke all on public.refund_inventory_finalizations from public,anon,authenticated;
