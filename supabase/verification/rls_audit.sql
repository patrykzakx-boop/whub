-- Read-only post-deployment audit for the Whub RLS migration.

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class as c
join pg_namespace as n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'companies',
    'requests',
    'request_offers',
    'company_images',
    'request_images'
  )
order by c.relname;

select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where (schemaname = 'public' and tablename in (
  'companies',
  'requests',
  'request_offers',
  'company_images',
  'request_images'
)) or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, policyname;

select
  grantee,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and table_name in (
    'companies',
    'requests',
    'request_offers',
    'company_images',
    'request_images',
    'public_request_listings',
    'my_offer_details'
  )
order by table_name, grantee, privilege_type;

select
  table_name,
  ordinal_position,
  column_name
from information_schema.columns
where table_schema = 'public'
  and table_name in ('public_request_listings', 'my_offer_details')
order by table_name, ordinal_position;

select
  count(*) filter (where access_token is null or btrim(access_token) = '')
    as missing_access_tokens,
  count(*) - count(distinct access_token) as duplicate_access_tokens
from public.requests;

select count(*) as legacy_orphan_company_images
from public.company_images as image
left join public.companies as company on company.id = image.company_id
where company.id is null;

