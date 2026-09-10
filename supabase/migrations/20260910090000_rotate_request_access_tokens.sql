-- Invalidate request access links that existed before the authorization
-- boundary was tightened. New requests already receive a random UUID token.

update public.requests
set access_token = gen_random_uuid()::text;

