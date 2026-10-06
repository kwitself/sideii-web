-- Snapshot of migration already applied to Supabase production.
-- Version: 20261005213917
-- Name: allow_public_archived_catalogue_reads
-- Source of truth at export time: supabase_migrations.schema_migrations

drop policy if exists products_public_read on public.products;
create policy products_public_read
on public.products
for select
to anon, authenticated
using (
  is_public = true
  and (
    status in ('forthcoming','active')
    or (status = 'archived' and archive_visible = true)
  )
);

drop policy if exists variants_public_read on public.product_variants;
create policy variants_public_read
on public.product_variants
for select
to anon, authenticated
using (
  active = true
  and exists (
    select 1
    from public.products p
    where p.id = product_variants.product_id
      and p.is_public = true
      and (
        p.status in ('forthcoming','active')
        or (p.status = 'archived' and p.archive_visible = true)
      )
  )
);
