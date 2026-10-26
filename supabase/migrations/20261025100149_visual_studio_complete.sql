-- Optional settings; no current content or publication is changed.
alter table public.site_builder_pages drop constraint site_builder_pages_page_key_check;
alter table public.site_builder_pages add constraint site_builder_pages_page_key_check
  check(length(page_key)<=85 and (page_key in ('home','store','product','site') or page_key ~ '^(page|block):[a-z0-9]+(-[a-z0-9]+)*$'));
alter table public.site_builder_revisions drop constraint site_builder_revisions_action_check;
alter table public.site_builder_revisions add constraint site_builder_revisions_action_check check(action in ('save','publish','unpublish','restore','schedule','cancel_schedule'));

create table public.site_builder_schedules (
 page_key text primary key references public.site_builder_pages(page_key),title text not null,
 document jsonb not null check(octet_length(document::text)<=500000),version bigint not null,
 publish_at timestamptz not null,created_at timestamptz not null default now()
);
alter table public.site_builder_schedules enable row level security;
revoke all on public.site_builder_schedules from public,anon,authenticated;
grant select on public.site_builder_schedules to anon;
grant select,insert,update,delete on public.site_builder_schedules to authenticated;
create policy builder_schedule_due on public.site_builder_schedules for select to anon,authenticated using(publish_at<=now());
create policy builder_schedule_admin on public.site_builder_schedules for all to authenticated
 using((select auth.uid()) is not null and (select auth.jwt()->'app_metadata'->>'role')='admin')
 with check((select auth.uid()) is not null and (select auth.jwt()->'app_metadata'->>'role')='admin');
create index builder_schedule_due_idx on public.site_builder_schedules(publish_at);

create table public.site_builder_assets (
 path text primary key check(path ~ '^images/[a-f0-9-]{36}\.(jpg|jpeg|png|webp|avif|gif)$'),
 name text not null check(length(name) between 1 and 160),folder text not null default '' check(length(folder)<=80),
 created_at timestamptz not null default now()
);
alter table public.site_builder_assets enable row level security;
revoke all on public.site_builder_assets from public,anon,authenticated;
grant select,insert,update on public.site_builder_assets to authenticated;
create policy builder_media_admin on public.site_builder_assets for all to authenticated
 using((select auth.uid()) is not null and (select auth.jwt()->'app_metadata'->>'role')='admin')
 with check((select auth.uid()) is not null and (select auth.jwt()->'app_metadata'->>'role')='admin');
create index builder_media_folder_idx on public.site_builder_assets(folder,created_at desc);
insert into public.site_builder_assets(path,name)
 select name,split_part(name,'/',2) from storage.objects where bucket_id='site-builder-assets' and name ~ '^images/[a-f0-9-]{36}\.(jpg|jpeg|png|webp|avif|gif)$' on conflict do nothing;
create function public.site_builder_asset_folders() returns table(folder text) language sql stable security invoker set search_path='' as $$
 select distinct a.folder from public.site_builder_assets a order by a.folder limit 1000
$$;
revoke all on function public.site_builder_asset_folders() from public,anon;
grant execute on function public.site_builder_asset_folders() to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('site-builder-fonts','site-builder-fonts',true,2097152,array['font/woff2']) on conflict(id) do nothing;
create policy builder_font_admin_select on storage.objects for select to authenticated using(bucket_id='site-builder-fonts' and (select auth.uid()) is not null and (select auth.jwt()->'app_metadata'->>'role')='admin');
create policy builder_font_admin_insert on storage.objects for insert to authenticated with check(bucket_id='site-builder-fonts' and name ~ '^[a-f0-9-]{36}\.woff2$' and (select auth.uid()) is not null and (select auth.jwt()->'app_metadata'->>'role')='admin');

create function public.check_site_builder_links(p_key text,p_document jsonb) returns void language plpgsql security invoker set search_path='' as $$
declare ref text;
begin
 for ref in select value->'props'->>'key' from jsonb_path_query(p_document,'$.** ? (@.type == "shared")') as linked(value) loop
  if p_key like 'block:%' or p_key='site' or ref is null or not exists (
    select 1 from public.site_builder_publications where page_key=ref
    union all select 1 from public.site_builder_schedules where page_key=ref and publish_at<=now()
  ) then raise exception 'Publish the linked section first; nested shared sections are forbidden' using errcode='23514';end if;
 end loop;
end$$;
revoke all on function public.check_site_builder_links(text,jsonb) from public,anon;
grant execute on function public.check_site_builder_links(text,jsonb) to authenticated;

create or replace function public.save_site_builder_page(p_key text,p_title text,p_document jsonb,p_expected_version bigint,p_action text default 'save')
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare current_page public.site_builder_pages; publication public.site_builder_publications; due public.site_builder_schedules;
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
  -- Serialize the small number of administrator writes, including reference checks.
  perform pg_advisory_xact_lock(1288330047);
  if p_action='publish' then perform public.check_site_builder_links(p_key,p_document);end if;
  if p_action='unpublish' and p_key like 'block:%' and exists (
    select 1 from (
      select distinct on (page_key) page_key,document from (
        select page_key,document,version from public.site_builder_publications
        union all select page_key,document,version from public.site_builder_schedules where publish_at<=now()
      ) effective order by page_key,version desc
    ) live where jsonb_path_exists(live.document,'$.** ? (@.type == "shared" && @.props.key == $key)',jsonb_build_object('key',p_key))
    union all select 1 from public.site_builder_schedules future where publish_at>now() and jsonb_path_exists(future.document,'$.** ? (@.type == "shared" && @.props.key == $key)',jsonb_build_object('key',p_key))
  ) then raise exception 'Linked section is still in use' using errcode='23503';end if;
  select * into due from public.site_builder_schedules where page_key=p_key and publish_at<=now();
  if found then
    insert into public.site_builder_publications(page_key,title,document,version,published_at)
      values(due.page_key,due.title,due.document,due.version,due.publish_at)
      on conflict(page_key) do update set title=excluded.title,document=excluded.document,version=excluded.version,published_at=excluded.published_at where public.site_builder_publications.version<excluded.version;
    delete from public.site_builder_schedules where page_key=p_key;
  end if;
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
  if p_action in ('publish','unpublish') then delete from public.site_builder_schedules where page_key=p_key;end if;
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

create function public.schedule_site_builder_page(p_key text,p_title text,p_document jsonb,p_expected_version bigint,p_publish_at timestamptz default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or coalesce(auth.jwt()->'app_metadata'->>'role','')<>'admin' then raise exception 'Admin required' using errcode='42501';end if;
 if p_publish_at is not null and (p_publish_at<now()+interval '1 minute' or p_publish_at>now()+interval '366 days') then raise exception 'Invalid publication time' using errcode='22023';end if;
 perform pg_advisory_xact_lock(1288330047);
 if p_publish_at is not null then perform public.check_site_builder_links(p_key,p_document);end if;
 result:=public.save_site_builder_page(p_key,p_title,p_document,p_expected_version,'save');
 update public.site_builder_revisions set action=case when p_publish_at is null then 'cancel_schedule' else 'schedule' end where page_key=p_key and version=(result->'page'->>'version')::bigint;
 if p_publish_at is null then
  delete from public.site_builder_schedules where page_key=p_key and publish_at>now();
 else
  insert into public.site_builder_schedules(page_key,title,document,version,publish_at)
   values(p_key,p_title,p_document,(result->'page'->>'version')::bigint,p_publish_at)
   on conflict(page_key) do update set title=excluded.title,document=excluded.document,version=excluded.version,publish_at=excluded.publish_at,created_at=now();
 end if;
 return result;
end$$;
revoke all on function public.schedule_site_builder_page(text,text,jsonb,bigint,timestamptz) from public,anon;
grant execute on function public.schedule_site_builder_page(text,text,jsonb,bigint,timestamptz) to authenticated;
