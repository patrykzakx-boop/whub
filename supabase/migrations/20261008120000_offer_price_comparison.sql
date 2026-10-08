-- Store comparable offer prices while preserving the original free-text field
-- for legacy records created before this migration.

alter table public.request_offers
  add column if not exists price_amount numeric(12, 2),
  add column if not exists price_description text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'request_offers_price_amount_check'
      and conrelid = 'public.request_offers'::regclass
  ) then
    alter table public.request_offers
      add constraint request_offers_price_amount_check
      check (price_amount is null or (price_amount > 0 and price_amount <= 100000000));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'request_offers_price_description_check'
      and conrelid = 'public.request_offers'::regclass
  ) then
    alter table public.request_offers
      add constraint request_offers_price_description_check
      check (price_description is null or char_length(price_description) <= 160);
  end if;
end
$$;

create index if not exists request_offers_request_price_idx
  on public.request_offers (request_id, price_amount)
  where price_amount is not null;

comment on column public.request_offers.price_amount is
  'Comparable offer amount in PLN.';

comment on column public.request_offers.price_description is
  'Optional explanation of what is included in the price.';

create or replace view public.my_offer_details
with (security_barrier = true, security_invoker = false)
as
select
  offer.id,
  offer.request_id,
  offer.company_id,
  offer.message,
  offer.price_estimate,
  offer.availability,
  offer.status,
  offer.created_at,
  company.name as company_name,
  request.title as request_title,
  request.city as request_city,
  request.category as request_category,
  request.request_type,
  request.created_at as request_created_at,
  request.image_url as request_image_url,
  request.status as request_status,
  case
    when offer.status in ('interested', 'chosen', 'accepted')
      then request.customer_name
    else null
  end as customer_name,
  case
    when offer.status in ('interested', 'chosen', 'accepted')
      then request.customer_phone
    else null
  end as customer_phone,
  case
    when offer.status in ('interested', 'chosen', 'accepted')
      then request.customer_email
    else null
  end as customer_email,
  offer.price_amount,
  offer.price_description
from public.request_offers as offer
join public.requests as request on request.id = offer.request_id
join public.companies as company on company.id = offer.company_id
where offer.owner_id = (select auth.uid());

revoke all on table public.my_offer_details from public, anon, authenticated;
grant select on table public.my_offer_details to authenticated;
