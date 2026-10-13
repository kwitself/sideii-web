-- Commit reservations to sold stock exactly once when payment becomes paid.
-- Intentionally does NOT backfill historical paid orders or modify existing inventory.
create or replace function public.sideii_commit_paid_inventory_on_transition()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare
 it record;
begin
 if new.payment_status <> 'paid' or old.payment_status is not distinct from new.payment_status or coalesce(new.inventory_committed,false) then
  return new;
 end if;
 -- Each grouped variant is locked and changed atomically. Failure rolls back the payment transition.
 for it in
  select oi.variant_id,sum(oi.quantity)::integer as qty
  from public.order_items oi
  where oi.order_id=new.id and oi.variant_id is not null
    and oi.format<>'digital' and not coalesce(oi.preorder,false)
  group by oi.variant_id order by oi.variant_id
 loop
  update public.product_variants
  set stock_qty=stock_qty-it.qty,
      reserved_qty=reserved_qty-it.qty,
      updated_at=now()
  where id=it.variant_id and stock_qty>=it.qty and reserved_qty>=it.qty;
  if not found then
    raise exception 'Paid inventory reservation mismatch for order %',new.id;
  end if;
  insert into public.inventory_movements(variant_id,movement_type,quantity,reference_type,reference_id,note)
  values(it.variant_id,'sale',-it.qty,'order',new.id,'Reserved stock committed on confirmed payment');
 end loop;
 update public.orders set inventory_committed=true where id=new.id and inventory_committed=false;
 return new;
end $$;

drop trigger if exists sideii_commit_paid_inventory_transition on public.orders;
create trigger sideii_commit_paid_inventory_transition
after update of payment_status on public.orders
for each row
when (new.payment_status='paid' and old.payment_status is distinct from new.payment_status and new.inventory_committed=false)
execute function public.sideii_commit_paid_inventory_on_transition();
revoke all on function public.sideii_commit_paid_inventory_on_transition() from public,anon,authenticated;
