-- Expand phase: these views are compatible with the application both before
-- and after RLS enforcement. Deploy the application after this migration and
-- before 20260909091000_rls.sql.

drop view if exists public.public_request_listings;
create view public.public_request_listings
with (security_barrier = true, security_invoker = false)
as
select
  id,
  created_at,
  category,
  description,
  city,
  request_type,
  status,
  title,
  image_url,
  image_urls,
  company_id
from public.requests
where company_id is null
  and status in ('new', 'contacting');

revoke all on table public.public_request_listings from public, anon, authenticated;
grant select on table public.public_request_listings to anon, authenticated;

-- The contractor dashboard needs request context for offers created by the
-- current user. Contact details are masked until the customer marks the offer
-- as interested or chosen.
drop view if exists public.my_offer_details;
create view public.my_offer_details
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
  end as customer_email
from public.request_offers as offer
join public.requests as request on request.id = offer.request_id
join public.companies as company on company.id = offer.company_id
where offer.owner_id = (select auth.uid());

revoke all on table public.my_offer_details from public, anon, authenticated;
grant select on table public.my_offer_details to authenticated;

