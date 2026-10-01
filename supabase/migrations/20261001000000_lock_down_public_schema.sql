-- Lock down the public schema.
--
-- The app talks to Postgres only through Prisma, connecting as the `postgres`
-- owner role (bypasses RLS). It does not use Supabase Auth or the Data API, so
-- the `anon` and `authenticated` roles need no access to these tables.
--
-- 1. Enable RLS on every public table, with no policies: anon/authenticated
--    get nothing even if a grant is added later.
-- 2. Revoke the leftover TRUNCATE / TRIGGER / REFERENCES grants.
-- 3. Stop future tables created by `postgres` (e.g. `prisma db push`) from
--    receiving those grants again.

do $$
declare
  t record;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  loop
    execute format('alter table public.%I enable row level security', t.relname);
    execute format('revoke truncate, trigger, references on table public.%I from anon, authenticated', t.relname);
  end loop;
end
$$;

alter default privileges for role postgres in schema public
  revoke truncate, trigger, references on tables from anon, authenticated;
