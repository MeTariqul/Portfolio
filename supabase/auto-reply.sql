-- Auto-reply + manual reply settings — run in Supabase SQL Editor (idempotent).

-- Add replied column to messages table (safe to re-run)
DO $$ BEGIN
  ALTER TABLE messages ADD COLUMN replied boolean not null default false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Seed auto_reply setting (enabled by default)
insert into settings (key, value)
values ('auto_reply', '{"enabled": true}'::jsonb)
on conflict (key) do nothing;
