-- Successful authentication clears the email-specific failed-attempt bucket.
create or replace function public.reset_api_rate_limit(p_bucket_key text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from private.api_rate_limits
  where bucket_key = p_bucket_key
    and length(p_bucket_key) = 64;
$$;

revoke all on function public.reset_api_rate_limit(text)
from public, anon, authenticated;
grant execute on function public.reset_api_rate_limit(text)
to service_role;

comment on function public.reset_api_rate_limit(text) is
  'Clears a server-side API rate-limit bucket after successful authentication.';
