-- Snapshot of migration already applied to Supabase production.
-- Version: 20261006170339
-- Name: add_foreign_key_supporting_indexes
-- Source of truth at export time: supabase_migrations.schema_migrations

create index if not exists idx_edition_passports_product_id_fk on public.edition_passports(product_id);
create index if not exists idx_edition_passports_variant_id_fk on public.edition_passports(variant_id);
create index if not exists idx_gift_card_ledger_gift_card_id_fk on public.gift_card_ledger(gift_card_id);
create index if not exists idx_gift_card_ledger_order_id_fk on public.gift_card_ledger(order_id);
create index if not exists idx_impact_allocations_batch_id_fk on public.impact_allocations(batch_id);
create index if not exists idx_impact_allocations_product_id_fk on public.impact_allocations(product_id);
create index if not exists idx_inventory_movements_created_by_fk on public.inventory_movements(created_by);
create index if not exists idx_order_items_variant_id_fk on public.order_items(variant_id);
create index if not exists idx_order_value_reservations_gift_card_id_fk on public.order_value_reservations(gift_card_id);
create index if not exists idx_orders_campaign_id_fk on public.orders(campaign_id);
create index if not exists idx_orders_customer_id_fk on public.orders(customer_id);
create index if not exists idx_orders_discount_code_id_fk on public.orders(discount_code_id);
create index if not exists idx_press_assets_product_id_fk on public.press_assets(product_id);
create index if not exists idx_product_collection_items_product_id_fk on public.product_collection_items(product_id);
create index if not exists idx_product_impact_rules_campaign_id_fk on public.product_impact_rules(campaign_id);
create index if not exists idx_product_variants_product_id_fk on public.product_variants(product_id);
create index if not exists idx_return_requests_order_id_fk on public.return_requests(order_id);
create index if not exists idx_return_requests_user_id_fk on public.return_requests(user_id);
create index if not exists idx_stock_waitlist_user_id_fk on public.stock_waitlist(user_id);
create index if not exists idx_store_bundle_items_product_id_fk on public.store_bundle_items(product_id);
create index if not exists idx_variant_location_stock_variant_id_fk on public.variant_location_stock(variant_id);
create index if not exists idx_wholesale_price_rules_product_id_fk on public.wholesale_price_rules(product_id);
