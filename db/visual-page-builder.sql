-- Additive migration. Run through Supabase apply_migration; existing storefront
-- content stays active until an administrator explicitly publishes a document.
create table public.site_builder_pages (
  page_key text primary key check (page_key in ('home','store','product') or page_key ~ '^page:[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(title) between 1 and 120),
  draft_document jsonb not null check (jsonb_typeof(draft_document) = 'object' and octet_length(draft_document::text) <= 500000),
  version bigint not null default 0 check (version >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid not null default auth.uid()
);
create table public.site_builder_publications (
  page_key text primary key references public.site_builder_pages(page_key),
  title text not null,
  document jsonb not null,
  version bigint not null,
  published_at timestamptz not null default now()
);
create table public.site_builder_revisions (
  id bigint generated always as identity primary key,
  page_key text not null references public.site_builder_pages(page_key),
  title text not null,
  document jsonb not null,
  version bigint not null,
  action text not null check (action in ('save','publish','unpublish','restore')),
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid(),
  unique (page_key, version)
);
create table public.site_builder_blocks (
  id uuid primary key default gen_random_uuid(),
  name text not null check(length(name) between 1 and 100),
  document jsonb not null check(jsonb_typeof(document)='object' and octet_length(document::text)<=500000),
  created_at timestamptz not null default now()
);
alter table public.site_builder_blocks enable row level security;
revoke all on public.site_builder_blocks from public,anon,authenticated;
grant select,insert,delete on public.site_builder_blocks to authenticated;
create policy builder_blocks_admin on public.site_builder_blocks for all to authenticated
  using ((select auth.uid()) is not null and (select auth.jwt()->'app_metadata'->>'role')='admin')
  with check ((select auth.uid()) is not null and (select auth.jwt()->'app_metadata'->>'role')='admin');
alter table public.site_builder_pages enable row level security;
alter table public.site_builder_publications enable row level security;
alter table public.site_builder_revisions enable row level security;
revoke all on public.site_builder_pages, public.site_builder_publications, public.site_builder_revisions from public, anon, authenticated;
grant select,insert,update,delete on public.site_builder_pages,public.site_builder_publications,public.site_builder_revisions to authenticated;
grant select on public.site_builder_publications to anon;
grant usage,select on sequence public.site_builder_revisions_id_seq to authenticated;
create policy builder_pages_admin on public.site_builder_pages for all to authenticated
  using ((select auth.uid()) is not null and (select auth.jwt()->'app_metadata'->>'role') = 'admin')
  with check ((select auth.uid()) is not null and (select auth.jwt()->'app_metadata'->>'role') = 'admin');
create policy builder_revisions_admin on public.site_builder_revisions for all to authenticated
  using ((select auth.uid()) is not null and (select auth.jwt()->'app_metadata'->>'role') = 'admin')
  with check ((select auth.uid()) is not null and (select auth.jwt()->'app_metadata'->>'role') = 'admin');
create policy builder_public_read on public.site_builder_publications for select to anon,authenticated using (true);
create policy builder_publish_insert on public.site_builder_publications for insert to authenticated
  with check ((select auth.uid()) is not null and (select auth.jwt()->'app_metadata'->>'role') = 'admin');
create policy builder_publish_update on public.site_builder_publications for update to authenticated
  using ((select auth.uid()) is not null and (select auth.jwt()->'app_metadata'->>'role') = 'admin')
  with check ((select auth.uid()) is not null and (select auth.jwt()->'app_metadata'->>'role') = 'admin');
create policy builder_publish_delete on public.site_builder_publications for delete to authenticated
  using ((select auth.uid()) is not null and (select auth.jwt()->'app_metadata'->>'role') = 'admin');

-- SECURITY INVOKER preserves RLS. Row lock + expected version protects edits in
-- multiple tabs; publication, revision and draft changes commit atomically.
create function public.save_site_builder_page(p_key text,p_title text,p_document jsonb,p_expected_version bigint,p_action text default 'save')
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare current_page public.site_builder_pages; publication public.site_builder_publications;
begin
  if auth.uid() is null or coalesce(auth.jwt()->'app_metadata'->>'role','') <> 'admin' then
    raise exception 'Admin access required' using errcode='42501';
  end if;
  if p_action not in ('save','publish','unpublish','restore') or p_expected_version < 0 or p_expected_version is null then
    raise exception 'Invalid builder operation' using errcode='22023';
  end if;
  if p_document->>'schemaVersion' is distinct from '1' or jsonb_typeof(p_document->'children') is distinct from 'array' then
    raise exception 'Invalid document' using errcode='22023';
  end if;
  if length(p_key)>85 then raise exception 'Invalid page key' using errcode='22023'; end if;
  insert into public.site_builder_pages(page_key,title,draft_document)
    values(p_key,p_title,p_document) on conflict(page_key) do nothing;
  select * into current_page from public.site_builder_pages where page_key=p_key for update;
  if current_page.version <> p_expected_version then
    raise exception 'This page changed in another session. Reload before saving.' using errcode='40001';
  end if;
  update public.site_builder_pages set title=p_title,draft_document=p_document,version=version+1,updated_at=now(),updated_by=auth.uid()
    where page_key=p_key returning * into current_page;
  insert into public.site_builder_revisions(page_key,title,document,version,action)
    values(p_key,p_title,p_document,current_page.version,p_action);
  if p_action='publish' then
    insert into public.site_builder_publications(page_key,title,document,version)
      values(p_key,p_title,p_document,current_page.version)
      on conflict(page_key) do update set title=excluded.title,document=excluded.document,version=excluded.version,published_at=now();
  elsif p_action='unpublish' then
    delete from public.site_builder_publications where page_key=p_key;
  end if;
  delete from public.site_builder_revisions where page_key=p_key and id not in
    (select id from public.site_builder_revisions where page_key=p_key order by version desc limit 50);
  select * into publication from public.site_builder_publications where page_key=p_key;
  return jsonb_build_object('page',to_jsonb(current_page),'publishedVersion',publication.version,'publishedAt',publication.published_at);
end;
$$;
revoke all on function public.save_site_builder_page(text,text,jsonb,bigint,text) from public,anon;
grant execute on function public.save_site_builder_page(text,text,jsonb,bigint,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
  values('site-builder-assets','site-builder-assets',true,10485760,array['image/jpeg','image/png','image/webp','image/avif','image/gif'])
  on conflict(id) do nothing;
create policy builder_assets_admin_select on storage.objects for select to authenticated
  using (bucket_id='site-builder-assets' and (select auth.jwt()->'app_metadata'->>'role')='admin');
create policy builder_assets_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id='site-builder-assets' and (select auth.uid()) is not null and (select auth.jwt()->'app_metadata'->>'role')='admin');
-- Immutable unique upload paths; no public overwrite or deletion endpoint.
