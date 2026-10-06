-- Snapshot of migration already applied to Supabase production.
-- Version: 20261006170717
-- Name: consolidate_permissive_rls_policies

-- Products: anon gets public catalogue; authenticated gets public catalogue or admin access.
alter policy products_public_read on public.products to anon;
drop policy if exists products_admin_read on public.products;
drop policy if exists products_authenticated_read on public.products;
create policy products_authenticated_read
on public.products for select to authenticated
using (
  (
    is_public=true
    and (
      status in ('forthcoming','active')
      or (status='archived' and archive_visible=true)
    )
  )
  or ((((select auth.jwt()) -> 'app_metadata') ->> 'role')='admin')
);

-- Variants: remove duplicate admin insert/delete policies and consolidate read.
drop policy if exists product_variants_admin_insert on public.product_variants;
drop policy if exists product_variants_admin_delete on public.product_variants;
alter policy variants_public_read on public.product_variants to anon;
drop policy if exists variants_admin_read on public.product_variants;
drop policy if exists variants_authenticated_read on public.product_variants;
create policy variants_authenticated_read
on public.product_variants for select to authenticated
using (
  (
    active=true
    and exists (
      select 1 from public.products p
      where p.id=product_variants.product_id
        and p.is_public=true
        and (
          p.status in ('forthcoming','active')
          or (p.status='archived' and p.archive_visible=true)
        )
    )
  )
  or ((((select auth.jwt()) -> 'app_metadata') ->> 'role')='admin')
);

-- Customer/account commerce tables: own row OR admin, in a single permissive SELECT policy.
drop policy if exists customers_admin_read on public.customers;
drop policy if exists customers_read_own on public.customers;
create policy customers_authenticated_read
on public.customers for select to authenticated
using (
  auth_user_id=(select auth.uid())
  or ((((select auth.jwt()) -> 'app_metadata') ->> 'role')='admin')
);

drop policy if exists orders_admin_read on public.orders;
drop policy if exists orders_read_own on public.orders;
create policy orders_authenticated_read
on public.orders for select to authenticated
using (
  customer_user_id=(select auth.uid())
  or ((((select auth.jwt()) -> 'app_metadata') ->> 'role')='admin')
);

drop policy if exists order_items_admin_read on public.order_items;
drop policy if exists order_items_read_own on public.order_items;
create policy order_items_authenticated_read
on public.order_items for select to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id=order_items.order_id
      and (
        o.customer_user_id=(select auth.uid())
        or ((((select auth.jwt()) -> 'app_metadata') ->> 'role')='admin')
      )
  )
);
