-- Keep the requests schema aligned with the public form: contact details are
-- optional, while the private access token remains the primary way for a
-- customer to manage an anonymous request.

alter table public.requests
  alter column customer_name drop not null,
  alter column customer_phone drop not null,
  alter column customer_email drop not null;
