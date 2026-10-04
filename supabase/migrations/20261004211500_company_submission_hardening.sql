-- Prevent accidental duplicate company submissions from repeated clicks or tabs.
create unique index if not exists companies_owner_normalized_name_uidx
  on public.companies (owner_id, lower(btrim(name)))
  where owner_id is not null;
