alter table public.requests
add column if not exists image_urls text[] default '{}';
