-- Hide QA fixtures from public storefront; preserve all records for development.
-- Idempotent on already-hidden test products. Abort on mixed product variants.
do $$
begin
 if exists (
  select 1 from public.products p
  where lower(p.slug) like 'qa-%'
    and (not exists(select 1 from public.product_variants v where v.product_id=p.id)
         or exists(select 1 from public.product_variants v where v.product_id=p.id and coalesce(v.sku,'') not like 'QA-%'))
 ) then raise exception 'Mixed QA/non-QA product detected; abort'; end if;
 update public.products p set is_public=false
 where p.is_public=true
   and lower(p.slug) like 'qa-%'
   and exists(select 1 from public.product_variants v where v.product_id=p.id)
   and not exists(select 1 from public.product_variants v where v.product_id=p.id and coalesce(v.sku,'') not like 'QA-%');
end $$;
