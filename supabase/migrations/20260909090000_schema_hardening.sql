-- Establish the invariants required by the RLS policies.
-- This migration is safe for the current production snapshot: it does not
-- delete or reassign legacy rows.

alter table public.requests
  alter column access_token set default gen_random_uuid()::text;

update public.requests
set access_token = gen_random_uuid()::text
where access_token is null or btrim(access_token) = '';

alter table public.requests
  alter column access_token set not null;

create unique index if not exists requests_access_token_uidx
  on public.requests (access_token);

create index if not exists companies_owner_id_idx
  on public.companies (owner_id);

create index if not exists companies_public_catalog_idx
  on public.companies (created_at desc)
  where status = 'published';

create index if not exists requests_customer_id_created_at_idx
  on public.requests (customer_id, created_at desc);

create index if not exists requests_company_id_created_at_idx
  on public.requests (company_id, created_at desc);

create index if not exists requests_public_marketplace_idx
  on public.requests (created_at desc)
  where company_id is null and status in ('new', 'contacting');

create index if not exists request_offers_owner_id_created_at_idx
  on public.request_offers (owner_id, created_at desc);

create index if not exists request_offers_request_id_idx
  on public.request_offers (request_id);

create index if not exists request_offers_company_id_idx
  on public.request_offers (company_id);

create unique index if not exists request_offers_request_company_uidx
  on public.request_offers (request_id, company_id);

create index if not exists company_images_company_id_idx
  on public.company_images (company_id);

-- There is one known legacy orphan in company_images. NOT VALID preserves it,
-- while still enforcing the relationship for every new or changed row.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'company_images_company_id_fkey'
      and conrelid = 'public.company_images'::regclass
  ) then
    alter table public.company_images
      add constraint company_images_company_id_fkey
      foreign key (company_id)
      references public.companies (id)
      on delete cascade
      not valid;
  end if;
end
$$;

