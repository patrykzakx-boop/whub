-- Whub authorization boundary.
-- Public marketplace rows are exposed only through public_request_listings;
-- the underlying requests table contains contact details and access tokens.

create schema if not exists private;
revoke all on schema private from public;

create or replace function private.is_company_owner(target_company_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.companies as company
    where company.id = target_company_id
      and company.owner_id = (select auth.uid())
  );
$$;

create or replace function private.is_request_customer(target_request_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.requests as request
    where request.id = target_request_id
      and request.customer_id = (select auth.uid())
  );
$$;

create or replace function private.is_target_company_owner(target_request_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.requests as request
    join public.companies as company on company.id = request.company_id
    where request.id = target_request_id
      and company.owner_id = (select auth.uid())
  );
$$;

create or replace function private.can_customer_view_company(target_company_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.request_offers as offer
    join public.requests as request on request.id = offer.request_id
    where offer.company_id = target_company_id
      and request.customer_id = (select auth.uid())
  );
$$;

revoke all on function private.is_company_owner(bigint) from public;
revoke all on function private.is_request_customer(bigint) from public;
revoke all on function private.is_target_company_owner(bigint) from public;
revoke all on function private.can_customer_view_company(bigint) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_company_owner(bigint) to authenticated;
grant execute on function private.is_request_customer(bigint) to authenticated;
grant execute on function private.is_target_company_owner(bigint) to authenticated;
grant execute on function private.can_customer_view_company(bigint) to authenticated;

alter table public.companies enable row level security;
alter table public.requests enable row level security;
alter table public.request_offers enable row level security;
alter table public.company_images enable row level security;
alter table public.request_images enable row level security;

-- Remove every previous policy on the application tables. Keeping an old
-- permissive policy would silently weaken the rules below because policies of
-- the same command are OR-ed together.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'companies',
        'requests',
        'request_offers',
        'company_images',
        'request_images'
      )
  loop
    execute format(
      'drop policy %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end
$$;

revoke all on table public.companies from anon, authenticated;
revoke all on table public.requests from anon, authenticated;
revoke all on table public.request_offers from anon, authenticated;
revoke all on table public.company_images from anon, authenticated;
revoke all on table public.request_images from anon, authenticated;

grant select on table public.companies to anon, authenticated;
grant insert (
  name, city, description, phone, email, website, logo_url, address, region,
  founded_year, emplyees, service_area, materials, welding_methods, lat, lng,
  place_id, mobile_service, status, owner_id, services, google_place_id,
  google_rating, google_reviews_count, google_maps_url
) on public.companies to authenticated;
grant update (
  name, city, description, phone, email, website, logo_url, address, region,
  founded_year, emplyees, service_area, materials, welding_methods, lat, lng,
  place_id, mobile_service, status, services, google_place_id, google_rating,
  google_reviews_count, google_maps_url
) on public.companies to authenticated;
grant delete on table public.companies to authenticated;

grant select on table public.requests to authenticated;
grant update (status, contractor_status) on table public.requests to authenticated;

grant select on table public.request_offers to authenticated;

grant select on table public.company_images to anon, authenticated;
grant insert, delete on table public.company_images to authenticated;

create policy companies_public_read
on public.companies
for select
to anon
using (status = 'published');

create policy companies_authenticated_read
on public.companies
for select
to authenticated
using (
  status = 'published'
  or owner_id = (select auth.uid())
  or private.can_customer_view_company(id)
);

create policy companies_owner_insert
on public.companies
for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy companies_owner_update
on public.companies
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy companies_owner_delete
on public.companies
for delete
to authenticated
using (owner_id = (select auth.uid()));

create policy requests_customer_or_target_read
on public.requests
for select
to authenticated
using (
  customer_id = (select auth.uid())
  or private.is_target_company_owner(id)
);

create policy requests_customer_or_target_update
on public.requests
for update
to authenticated
using (
  customer_id = (select auth.uid())
  or private.is_target_company_owner(id)
)
with check (
  customer_id = (select auth.uid())
  or private.is_target_company_owner(id)
);

create policy request_offers_participant_read
on public.request_offers
for select
to authenticated
using (
  owner_id = (select auth.uid())
  or private.is_request_customer(request_id)
);

create policy company_images_public_read
on public.company_images
for select
to anon
using (
  exists (
    select 1
    from public.companies as company
    where company.id = company_images.company_id
      and company.status = 'published'
  )
);

create policy company_images_authenticated_read
on public.company_images
for select
to authenticated
using (
  exists (
    select 1
    from public.companies as company
    where company.id = company_images.company_id
      and company.status = 'published'
  )
  or private.is_company_owner(company_id)
);

create policy company_images_owner_insert
on public.company_images
for insert
to authenticated
with check (private.is_company_owner(company_id));

create policy company_images_owner_update
on public.company_images
for update
to authenticated
using (private.is_company_owner(company_id))
with check (private.is_company_owner(company_id));

create policy company_images_owner_delete
on public.company_images
for delete
to authenticated
using (private.is_company_owner(company_id));

-- The access views were created in the expand phase. Reassert their grants
-- after revoking privileges on the base tables.
revoke all on table public.public_request_listings from public, anon, authenticated;
grant select on table public.public_request_listings to anon, authenticated;

revoke all on table public.my_offer_details from public, anon, authenticated;
grant select on table public.my_offer_details to authenticated;

create or replace function private.enforce_request_status_actor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  caller_role text := (select auth.jwt() ->> 'role');
  caller_is_customer boolean;
  caller_is_target_owner boolean;
begin
  if caller_role = 'service_role' then
    return new;
  end if;

  caller_is_customer := old.customer_id = caller_id;
  caller_is_target_owner := private.is_target_company_owner(old.id);

  if new.status is distinct from old.status and not caller_is_customer then
    raise insufficient_privilege using
      message = 'Only the request customer may change request status.';
  end if;

  if new.contractor_status is distinct from old.contractor_status
     and not caller_is_target_owner then
    raise insufficient_privilege using
      message = 'Only the target company owner may change contractor status.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_request_status_actor on public.requests;
create trigger enforce_request_status_actor
before update on public.requests
for each row
execute function private.enforce_request_status_actor();

revoke all on function private.enforce_request_status_actor() from public;

-- All current buckets belong to Whub, so reset object policies as one unit.
-- Public buckets remain publicly downloadable; these policies control writes.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
  loop
    execute format('drop policy %I on storage.objects', policy_record.policyname);
  end loop;
end
$$;

create policy whub_request_images_upload
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'request_images'
  and coalesce((metadata ->> 'size')::bigint, 0) <= 5242880
  and coalesce(metadata ->> 'mimetype', '') like 'image/%'
);

create policy whub_company_assets_upload
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('logos', 'company_logos', 'company_images')
  and coalesce((metadata ->> 'size')::bigint, 0) <= 8388608
  and coalesce(metadata ->> 'mimetype', '') like 'image/%'
  and (storage.foldername(name))[1] ~ '^[0-9]+$'
  and private.is_company_owner(((storage.foldername(name))[1])::bigint)
);

create policy whub_company_assets_select
on storage.objects
for select
to authenticated
using (
  bucket_id in ('logos', 'company_logos', 'company_images')
  and (storage.foldername(name))[1] ~ '^[0-9]+$'
  and private.is_company_owner(((storage.foldername(name))[1])::bigint)
);

create policy whub_company_assets_update
on storage.objects
for update
to authenticated
using (
  bucket_id in ('logos', 'company_logos', 'company_images')
  and (storage.foldername(name))[1] ~ '^[0-9]+$'
  and private.is_company_owner(((storage.foldername(name))[1])::bigint)
)
with check (
  bucket_id in ('logos', 'company_logos', 'company_images')
  and coalesce((metadata ->> 'size')::bigint, 0) <= 8388608
  and coalesce(metadata ->> 'mimetype', '') like 'image/%'
  and (storage.foldername(name))[1] ~ '^[0-9]+$'
  and private.is_company_owner(((storage.foldername(name))[1])::bigint)
);

create policy whub_company_assets_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('logos', 'company_logos', 'company_images')
  and (storage.foldername(name))[1] ~ '^[0-9]+$'
  and private.is_company_owner(((storage.foldername(name))[1])::bigint)
);
