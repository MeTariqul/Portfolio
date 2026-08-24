-- Admin password recovery system
-- Run in Supabase → SQL Editor (idempotent, safe to re-run).

-- Password reset tokens table
create table if not exists password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text not null unique,
  expires_at timestamptz not null default (now() + interval '1 hour'),
  used boolean not null default false,
  created_at timestamptz not null default now()
);

alter table password_reset_tokens enable row level security;

-- Only service role can access (no public read/write)
-- The server actions use the service-role client which bypasses RLS

-- Seed recovery_emails setting (empty by default)
insert into settings (key, value) values
  ('recovery_emails', '{"emails":[]}'::jsonb)
on conflict (key) do nothing;
