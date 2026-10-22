-- Run only in the ephemeral CI PostgreSQL service, never against live Supabase.
begin;
create role anon nologin;
create role authenticated nologin;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claims',true)::jsonb->>'sub','')::uuid$$;
create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)$$;
grant usage on schema auth,public to anon,authenticated;
grant execute on function auth.uid(),auth.jwt() to anon,authenticated;
create schema storage;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid,bucket_id text,name text);
alter table storage.objects enable row level security;
\ir ../db/visual-page-builder.sql
select set_config('request.jwt.claims','{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","app_metadata":{"role":"admin"}}',true);
set local role authenticated;
select public.save_site_builder_page('home','Home','{"schemaVersion":1,"children":[]}',0,'save');
do $$begin
  if (select count(*) from public.site_builder_publications)<>0 then raise exception 'Draft leaked';end if;
  begin
    perform public.save_site_builder_page('home','Stale','{"schemaVersion":1,"children":[]}',0,'save');
    raise exception 'Stale update succeeded';
  exception when serialization_failure then null;end;
end$$;
select public.save_site_builder_page('home','Published','{"schemaVersion":1,"children":[],"marker":"public"}',1,'publish');
select public.save_site_builder_page('home','Private title','{"schemaVersion":1,"children":[],"marker":"private"}',2,'save');
reset role;
set local role anon;
do $$begin
  if (select document->>'marker' from public.site_builder_publications where page_key='home')<>'public' then raise exception 'Publication changed with draft';end if;
  begin perform 1 from public.site_builder_pages;raise exception 'Anonymous draft access';exception when insufficient_privilege then null;end;
  begin perform 1 from public.site_builder_revisions;raise exception 'Anonymous history access';exception when insufficient_privilege then null;end;
  begin perform 1 from public.site_builder_blocks;raise exception 'Anonymous block access';exception when insufficient_privilege then null;end;
  begin perform public.save_site_builder_page('home','Anon','{"schemaVersion":1,"children":[]}',3,'save');raise exception 'Anonymous RPC access';exception when insufficient_privilege then null;end;
end$$;
reset role;
select set_config('request.jwt.claims','{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","app_metadata":{"role":"customer"},"user_metadata":{"role":"admin"}}',true);
set local role authenticated;
do $$begin
  if (select count(*) from public.site_builder_pages)<>0 then raise exception 'Customer can see drafts';end if;
  if (select count(*) from public.site_builder_revisions)<>0 then raise exception 'Customer can see revisions';end if;
  if (select count(*) from public.site_builder_blocks)<>0 then raise exception 'Customer can see reusable blocks';end if;
  begin perform public.save_site_builder_page('home','Attack','{"schemaVersion":1,"children":[]}',3,'publish');raise exception 'Customer RPC authorization bypass';exception when insufficient_privilege then null;end;
  begin insert into public.site_builder_publications(page_key,title,document,version) values('store','Attack','{}',1);raise exception 'Customer direct publication bypass';exception when insufficient_privilege then null;end;
end$$;
reset role;
select set_config('request.jwt.claims','{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","app_metadata":{"role":"admin"}}',true);
set local role authenticated;
select public.save_site_builder_page('home','Published','{"schemaVersion":1,"children":[],"marker":"public"}',3,'restore');
select public.save_site_builder_page('home','Published','{"schemaVersion":1,"children":[],"marker":"public"}',4,'unpublish');
do $$declare v int;begin
  if exists(select 1 from public.site_builder_publications where page_key='home') then raise exception 'Unpublish failed';end if;
  if (select count(*) from public.site_builder_revisions where page_key='home')<>5 then raise exception 'Revision missing';end if;
  for v in 5..55 loop perform public.save_site_builder_page('home','Home','{"schemaVersion":1,"children":[]}',v,'save');end loop;
  if (select count(*) from public.site_builder_revisions where page_key='home')<>50 then raise exception 'Revision retention failed';end if;
end$$;
reset role;
rollback;
