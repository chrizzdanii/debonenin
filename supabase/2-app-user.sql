-- DEBONE Digital Hub - a restricted database user for the website (recommended).
-- Run this in Supabase AFTER 1-schema.sql: SQL Editor -> New query -> paste -> Run.
--
-- BEFORE YOU RUN IT: change CHANGE_THIS_PASSWORD below to a long random password
-- (letters and numbers only, at least 24 characters). Keep it for your Vercel settings.
--
-- Why: the website only needs to read and write its own tables. This user cannot create or
-- delete tables, cannot touch other Supabase data, and cannot bypass the security rules.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'dv_app') then
    create role dv_app login password 'CHANGE_THIS_PASSWORD' nosuperuser nocreatedb nocreaterole noinherit nobypassrls;
  end if;
end $$;

grant usage on schema public to dv_app;
grant select, insert, update, delete on all tables in schema public to dv_app;
grant usage, select on all sequences in schema public to dv_app;
alter default privileges in schema public grant select, insert, update, delete on tables to dv_app;
alter default privileges in schema public grant usage, select on sequences to dv_app;

-- Row Level Security is on, so dv_app needs an explicit rule saying it may use each table.
do $$
declare t text;
begin
  foreach t in array array['users','tx','pay','reqs','prices','settings','admin_log','results','transfers','sess','rate','locks'] loop
    execute format('drop policy if exists dv_app_all on public.%I', t);
    execute format('create policy dv_app_all on public.%I for all to dv_app using (true) with check (true)', t);
  end loop;
end $$;
