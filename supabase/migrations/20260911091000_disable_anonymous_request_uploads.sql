-- Request images are uploaded only with short-lived signed upload tokens issued
-- by the application API. Anonymous users no longer receive blanket INSERT.
update storage.buckets
set
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'request_images';

drop policy if exists whub_request_images_upload on storage.objects;
