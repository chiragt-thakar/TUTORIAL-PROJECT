-- Zero to Hero — minimal cross-device progress sync
--
-- Run this once in the Supabase SQL editor for a new free-tier project.
-- Deliberately minimal, by design: this is a personal, single-user learning
-- tool with nothing sensitive behind it, not a production auth system.
--   * Passwords are stored and compared in PLAIN TEXT. No hashing, no email
--     verification, no password reset flow. Do not reuse a real password here.
--   * The only lockdown beyond that is on the `users` table itself: Row Level
--     Security is enabled with zero policies, so the anon key can never list
--     emails/passwords directly over the REST API — the only way in is the
--     `login` / `signup` functions below. `progress` and `notes` are wide
--     open to the anon key on purpose, matching the "don't over-engineer
--     this" brief.

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password text not null,
  created_at timestamptz not null default now()
);

-- One row per user, holding the same JSON shape as the local ProgressData.
create table if not exists progress (
  user_id uuid primary key references users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- One row per (user, lesson) for the lesson notes feature.
create table if not exists notes (
  user_id uuid not null references users(id) on delete cascade,
  lesson_id text not null,
  body text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table users enable row level security;
-- No policies on `users` on purpose: RLS on + zero policies = the anon key
-- cannot select/insert/update it directly. Only the security-definer
-- functions below can touch it.

alter table progress enable row level security;
create policy "progress read" on progress for select using (true);
create policy "progress insert" on progress for insert with check (true);
create policy "progress update" on progress for update using (true);

alter table notes enable row level security;
create policy "notes read" on notes for select using (true);
create policy "notes insert" on notes for insert with check (true);
create policy "notes update" on notes for update using (true);

create or replace function signup(p_email text, p_password text)
returns table(user_id uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_email is null or p_password is null or length(p_password) < 1 then
    raise exception 'email and password are required';
  end if;
  if exists (select 1 from users where email = lower(p_email)) then
    raise exception 'an account with this email already exists';
  end if;
  return query insert into users (email, password) values (lower(p_email), p_password) returning users.id;
end;
$$;

create or replace function login(p_email text, p_password text)
returns table(user_id uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query select users.id from users where email = lower(p_email) and password = p_password;
end;
$$;

grant execute on function signup(text, text) to anon;
grant execute on function login(text, text) to anon;
