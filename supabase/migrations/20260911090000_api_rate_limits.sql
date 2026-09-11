-- Durable API rate limits shared by every Vercel function instance.
create table if not exists private.api_rate_limits (
  bucket_key text primary key,
  request_count integer not null check (request_count > 0),
  window_started_at timestamptz not null,
  updated_at timestamptz not null
);

alter table private.api_rate_limits enable row level security;
revoke all on table private.api_rate_limits from public, anon, authenticated;

create index if not exists api_rate_limits_updated_at_idx
on private.api_rate_limits (updated_at);

create or replace function public.consume_api_rate_limit(
  p_bucket_key text,
  p_max_requests integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  now_at timestamptz := clock_timestamp();
  current_count integer;
  current_window_started_at timestamptz;
begin
  if length(p_bucket_key) <> 64
    or p_max_requests < 1
    or p_window_seconds < 1
    or p_window_seconds > 604800
  then
    raise exception 'Invalid rate limit arguments';
  end if;

  insert into private.api_rate_limits as existing (
    bucket_key,
    request_count,
    window_started_at,
    updated_at
  )
  values (p_bucket_key, 1, now_at, now_at)
  on conflict (bucket_key) do update
  set
    request_count = case
      when existing.window_started_at
        + pg_catalog.make_interval(secs => p_window_seconds) <= now_at
      then 1
      else existing.request_count + 1
    end,
    window_started_at = case
      when existing.window_started_at
        + pg_catalog.make_interval(secs => p_window_seconds) <= now_at
      then now_at
      else existing.window_started_at
    end,
    updated_at = now_at
  returning existing.request_count, existing.window_started_at
  into current_count, current_window_started_at;

  allowed := current_count <= p_max_requests;
  retry_after_seconds := case
    when allowed then 0
    else greatest(
      1,
      ceil(
        extract(
          epoch from (
            current_window_started_at
            + pg_catalog.make_interval(secs => p_window_seconds)
            - now_at
          )
        )
      )::integer
    )
  end;

  return next;
end;
$$;

revoke all on function public.consume_api_rate_limit(text, integer, integer)
from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer)
to service_role;

comment on function public.consume_api_rate_limit(text, integer, integer) is
  'Atomically consumes one server-side API rate-limit slot.';
