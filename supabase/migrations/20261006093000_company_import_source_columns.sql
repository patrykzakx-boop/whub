-- Preserve the directory-specific source and profile columns in the staging area.

alter table public.company_leads
  add column if not exists primary_profile text,
  add column if not exists source_type text;

alter table public.company_leads
  drop constraint if exists company_leads_primary_profile_check,
  add constraint company_leads_primary_profile_check
    check (primary_profile is null or char_length(primary_profile) <= 120),
  drop constraint if exists company_leads_source_type_check,
  add constraint company_leads_source_type_check
    check (source_type is null or char_length(source_type) <= 120);
