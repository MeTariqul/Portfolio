-- Portfolio CMS schema — run ONCE in Supabase → SQL Editor.
-- Public pages read via the service-role key (bypasses RLS);
-- admin CRUD runs through the signed-in session (authenticated role).

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now(),
  read boolean not null default false
);

create table if not exists blogs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  date text not null default '',
  read_time int not null default 5,
  category text not null default 'Engineering',
  featured boolean not null default false,
  gradient text not null default 'from-violet-600 via-fuchsia-500 to-cyan-400',
  blocks jsonb not null default '[]'::jsonb,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  desc text not null default '',
  tags text[] not null default '{}',
  category text not null default 'Featured',
  link text not null default '',
  github text not null default '',
  featured boolean not null default false,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table messages enable row level security;
alter table blogs enable row level security;
alter table projects enable row level security;
alter table settings enable row level security;

create policy "admins read messages" on messages for select using (auth.role() = 'authenticated');
create policy "admins update messages" on messages for update using (auth.role() = 'authenticated');
create policy "admins delete messages" on messages for delete using (auth.role() = 'authenticated');

create policy "admins read blogs" on blogs for select using (auth.role() = 'authenticated');
create policy "admins insert blogs" on blogs for insert with check (auth.role() = 'authenticated');
create policy "admins update blogs" on blogs for update using (auth.role() = 'authenticated');
create policy "admins delete blogs" on blogs for delete using (auth.role() = 'authenticated');

create policy "admins read projects" on projects for select using (auth.role() = 'authenticated');
create policy "admins insert projects" on projects for insert with check (auth.role() = 'authenticated');
create policy "admins update projects" on projects for update using (auth.role() = 'authenticated');
create policy "admins delete projects" on projects for delete using (auth.role() = 'authenticated');

create policy "admins read settings" on settings for select using (auth.role() = 'authenticated');
create policy "admins insert settings" on settings for insert with check (auth.role() = 'authenticated');
create policy "admins update settings" on settings for update using (auth.role() = 'authenticated');
create policy "admins delete settings" on settings for delete using (auth.role() = 'authenticated');

-- Seed default settings (contact info shown on the site — editable in /admin)
insert into settings (key, value) values
  ('contact', '{"email":"hello@metariqul.dev","location":"Savar, Dhaka, Bangladesh","availability":"Currently open to freelance & full-time opportunities"}'::jsonb)
on conflict (key) do nothing;