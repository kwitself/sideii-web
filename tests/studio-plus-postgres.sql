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
\ir ../supabase/migrations/20261025100149_visual_studio_complete.sql
select set_config('request.jwt.claims','{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","app_metadata":{"role":"admin"}}',true);
set local role authenticated;
select public.save_site_builder_page('page:plan','Live','{"schemaVersion":1,"children":[],"marker":"live"}',0,'publish');
select public.schedule_site_builder_page('page:plan','Planned','{"schemaVersion":1,"children":[],"marker":"scheduled"}',1,now()+interval '1 hour');
select public.save_site_builder_page('page:plan','Draft','{"schemaVersion":1,"children":[],"marker":"private"}',2,'save');
do $$begin
 if (select document->>'marker' from public.site_builder_schedules where page_key='page:plan')<>'scheduled' then raise exception 'Schedule mutated with draft';end if;
 begin perform public.schedule_site_builder_page('page:plan','Bad','{"schemaVersion":1,"children":[]}',3,now());raise exception 'Past schedule succeeded';exception when invalid_parameter_value then null;end;
 begin perform public.schedule_site_builder_page('page:plan','Stale','{"schemaVersion":1,"children":[]}',1,now()+interval '1 hour');raise exception 'Stale schedule succeeded';exception when serialization_failure then null;end;
 insert into public.site_builder_assets(path,name,folder) values('images/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.png','Artwork','Album');
end$$;
reset role;set local role anon;
do $$begin
 if exists(select 1 from public.site_builder_schedules) then raise exception 'Future publication leaked';end if;
 if (select document->>'marker' from public.site_builder_publications where page_key='page:plan')<>'live' then raise exception 'Live content changed early';end if;
 begin perform 1 from public.site_builder_assets;raise exception 'Anonymous media metadata access';exception when insufficient_privilege then null;end;
end$$;
reset role;
select set_config('request.jwt.claims','{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","app_metadata":{"role":"customer"},"user_metadata":{"role":"admin"}}',true);
set local role authenticated;
do $$begin
 if exists(select 1 from public.site_builder_schedules) or exists(select 1 from public.site_builder_assets) then raise exception 'Customer private data access';end if;
 begin perform public.schedule_site_builder_page('page:plan','Attack','{"schemaVersion":1,"children":[]}',3,now()+interval '1 hour');raise exception 'Customer schedule access';exception when insufficient_privilege then null;end;
end$$;
reset role;
select set_config('request.jwt.claims','{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","app_metadata":{"role":"admin"}}',true);
set local role authenticated;
update public.site_builder_schedules set publish_at=now()-interval '1 minute' where page_key='page:plan';
reset role;set local role anon;
do $$begin if (select document->>'marker' from public.site_builder_schedules where page_key='page:plan')<>'scheduled' then raise exception 'Due publication not visible';end if;end$$;
reset role;set local role authenticated;
select public.schedule_site_builder_page('page:plan','Next','{"schemaVersion":1,"children":[],"marker":"next"}',3,now()+interval '1 hour');
do $$begin if (select document->>'marker' from public.site_builder_publications where page_key='page:plan')<>'scheduled' then raise exception 'Replan lost due content';end if;end$$;
select public.schedule_site_builder_page('page:plan','Next','{"schemaVersion":1,"children":[],"marker":"next"}',4,null);
do $$begin
 if exists(select 1 from public.site_builder_schedules where page_key='page:plan') then raise exception 'Cancel failed';end if;
 if (select document->>'marker' from public.site_builder_publications where page_key='page:plan')<>'scheduled' then raise exception 'Cancel altered publication';end if;
end$$;
select public.schedule_site_builder_page('page:plan','Future','{"schemaVersion":1,"children":[]}',5,now()+interval '1 hour');
select public.save_site_builder_page('page:plan','Manual','{"schemaVersion":1,"children":[],"marker":"manual"}',6,'publish');
do $$begin if exists(select 1 from public.site_builder_schedules where page_key='page:plan') then raise exception 'Manual publish did not cancel plan';end if;end$$;
select public.save_site_builder_page('block:shared','Shared','{"schemaVersion":1,"children":[]}',0,'publish');
select public.save_site_builder_page('page:parent','Parent','{"schemaVersion":1,"children":[{"type":"shared","props":{"key":"block:shared"},"children":[]}]}',0,'publish');
do $$begin
 begin perform public.save_site_builder_page('block:shared','Shared','{"schemaVersion":1,"children":[]}',1,'unpublish');raise exception 'Referenced block unpublished';exception when foreign_key_violation then null;end;
 begin perform public.save_site_builder_page('block:recursive','Bad','{"schemaVersion":1,"children":[{"type":"shared","props":{"key":"block:shared"},"children":[]}]}',0,'publish');raise exception 'Recursive block published';exception when check_violation then null;end;
 begin perform public.save_site_builder_page('page:missing','Bad','{"schemaVersion":1,"children":[{"type":"shared","props":{"key":"block:missing"},"children":[]}]}',0,'publish');raise exception 'Missing block published';exception when check_violation then null;end;
end$$;
select public.save_site_builder_page('page:parent','Parent','{"schemaVersion":1,"children":[]}',1,'unpublish');
select public.save_site_builder_page('block:shared','Shared','{"schemaVersion":1,"children":[]}',1,'unpublish');
reset role;rollback;
