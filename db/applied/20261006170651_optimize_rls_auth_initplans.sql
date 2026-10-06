-- Snapshot of migration already applied to Supabase production.
-- Version: 20261006170651
-- Name: optimize_rls_auth_initplans

alter policy products_admin_insert on public.products
  with check ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');
alter policy products_admin_update on public.products
  using ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin')
  with check ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');
alter policy products_admin_delete on public.products
  using ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');
alter policy products_admin_read on public.products
  using ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');

alter policy saved_cart_insert_own on public.customer_saved_cart
  with check ((select auth.uid()) = user_id);
alter policy saved_cart_select_own on public.customer_saved_cart
  using ((select auth.uid()) = user_id);
alter policy saved_cart_update_own on public.customer_saved_cart
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy saved_cart_delete_own on public.customer_saved_cart
  using ((select auth.uid()) = user_id);

alter policy variants_admin_insert on public.product_variants
  with check ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');
alter policy variants_admin_update on public.product_variants
  using ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin')
  with check ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');
alter policy variants_admin_delete on public.product_variants
  using ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');
alter policy variants_admin_read on public.product_variants
  using ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');
alter policy product_variants_admin_insert on public.product_variants
  with check ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');
alter policy product_variants_admin_delete on public.product_variants
  using ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');

alter policy orders_admin_read on public.orders
  using ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');
alter policy order_items_admin_read on public.order_items
  using ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');
alter policy customers_admin_read on public.customers
  using ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');

alter policy shipping_settings_admin_update on public.shipping_settings
  using ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin')
  with check ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');
alter policy shipping_settings_admin_insert on public.shipping_settings
  with check ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');

alter policy account_select_own on public.customer_accounts
  using ((select auth.uid()) = user_id);
alter policy account_update_own on public.customer_accounts
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy account_insert_own on public.customer_accounts
  with check ((select auth.uid()) = user_id);

alter policy wishlist_select_own on public.customer_wishlist
  using ((select auth.uid()) = user_id);
alter policy wishlist_insert_own on public.customer_wishlist
  with check ((select auth.uid()) = user_id);
alter policy wishlist_update_own on public.customer_wishlist
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy wishlist_delete_own on public.customer_wishlist
  using ((select auth.uid()) = user_id);

alter policy application_settings_admin_update on public.application_settings
  using (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())))
  with check (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));

alter policy addresses_select_own on public.customer_addresses
  using ((select auth.uid()) = user_id);
alter policy addresses_insert_own on public.customer_addresses
  with check ((select auth.uid()) = user_id);
alter policy addresses_update_own on public.customer_addresses
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy addresses_delete_own on public.customer_addresses
  using ((select auth.uid()) = user_id);

alter policy return_requests_select_own on public.return_requests
  using ((select auth.uid()) = user_id);
alter policy return_requests_insert_own on public.return_requests
  with check ((select auth.uid()) = user_id);

alter policy waitlist_own_select on public.stock_waitlist
  using (user_id = (select auth.uid()));
