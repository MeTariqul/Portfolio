-- Portfolio CMS schema — run in Supabase → SQL Editor (idempotent, safe to re-run).
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
  "desc" text not null default '',
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

-- Section content — mirrors the home page sections (DB wins over en.json when non-empty)

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  "desc" text not null default '',
  tags text[] not null default '{}',
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists process (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  "desc" text not null default '',
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists experience (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  org text not null default '',
  period text not null default '',
  "desc" text not null default '',
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  name text not null default '',
  role text not null default '',
  rating int not null default 5,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

-- Singleton sections (hero / about) stored as jsonb keyed rows
create table if not exists sections (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table messages enable row level security;
alter table blogs enable row level security;
alter table projects enable row level security;
alter table settings enable row level security;
alter table services enable row level security;
alter table process enable row level security;
alter table experience enable row level security;
alter table testimonials enable row level security;
alter table sections enable row level security;

-- Messages: admin-only (no public read)
drop policy if exists "admins read messages" on messages;
drop policy if exists "admins update messages" on messages;
drop policy if exists "admins delete messages" on messages;
create policy "admins read messages" on messages for select using (auth.uid() is not null);
create policy "admins update messages" on messages for update using (auth.uid() is not null);
create policy "admins delete messages" on messages for delete using (auth.uid() is not null);

-- Blogs: public read, authenticated write
drop policy if exists "public read blogs" on blogs;
create policy "public read blogs" on blogs for select using (true);
drop policy if exists "admins insert blogs" on blogs;
drop policy if exists "admins update blogs" on blogs;
drop policy if exists "admins delete blogs" on blogs;
create policy "admins insert blogs" on blogs for insert with check (auth.uid() is not null);
create policy "admins update blogs" on blogs for update using (auth.uid() is not null);
create policy "admins delete blogs" on blogs for delete using (auth.uid() is not null);

-- Projects: public read, authenticated write
drop policy if exists "public read projects" on projects;
create policy "public read projects" on projects for select using (true);
drop policy if exists "admins insert projects" on projects;
drop policy if exists "admins update projects" on projects;
drop policy if exists "admins delete projects" on projects;
create policy "admins insert projects" on projects for insert with check (auth.uid() is not null);
create policy "admins update projects" on projects for update using (auth.uid() is not null);
create policy "admins delete projects" on projects for delete using (auth.uid() is not null);

-- Settings: public read, authenticated write
drop policy if exists "public read settings" on settings;
create policy "public read settings" on settings for select using (true);
drop policy if exists "admins insert settings" on settings;
drop policy if exists "admins update settings" on settings;
drop policy if exists "admins delete settings" on settings;
create policy "admins insert settings" on settings for insert with check (auth.uid() is not null);
create policy "admins update settings" on settings for update using (auth.uid() is not null);
create policy "admins delete settings" on settings for delete using (auth.uid() is not null);

-- Services: public read, authenticated write
drop policy if exists "public read services" on services;
create policy "public read services" on services for select using (true);
drop policy if exists "admins insert services" on services;
drop policy if exists "admins update services" on services;
drop policy if exists "admins delete services" on services;
create policy "admins insert services" on services for insert with check (auth.uid() is not null);
create policy "admins update services" on services for update using (auth.uid() is not null);
create policy "admins delete services" on services for delete using (auth.uid() is not null);

-- Process: public read, authenticated write
drop policy if exists "public read process" on process;
create policy "public read process" on process for select using (true);
drop policy if exists "admins insert process" on process;
drop policy if exists "admins update process" on process;
drop policy if exists "admins delete process" on process;
create policy "admins insert process" on process for insert with check (auth.uid() is not null);
create policy "admins update process" on process for update using (auth.uid() is not null);
create policy "admins delete process" on process for delete using (auth.uid() is not null);

-- Experience: public read, authenticated write
drop policy if exists "public read experience" on experience;
create policy "public read experience" on experience for select using (true);
drop policy if exists "admins insert experience" on experience;
drop policy if exists "admins update experience" on experience;
drop policy if exists "admins delete experience" on experience;
create policy "admins insert experience" on experience for insert with check (auth.uid() is not null);
create policy "admins update experience" on experience for update using (auth.uid() is not null);
create policy "admins delete experience" on experience for delete using (auth.uid() is not null);

-- Testimonials: public read, authenticated write
drop policy if exists "public read testimonials" on testimonials;
create policy "public read testimonials" on testimonials for select using (true);
drop policy if exists "admins insert testimonials" on testimonials;
drop policy if exists "admins update testimonials" on testimonials;
drop policy if exists "admins delete testimonials" on testimonials;
create policy "admins insert testimonials" on testimonials for insert with check (auth.uid() is not null);
create policy "admins update testimonials" on testimonials for update using (auth.uid() is not null);
create policy "admins delete testimonials" on testimonials for delete using (auth.uid() is not null);

-- Sections: public read, authenticated write
drop policy if exists "public read sections" on sections;
create policy "public read sections" on sections for select using (true);
drop policy if exists "admins insert sections" on sections;
drop policy if exists "admins update sections" on sections;
drop policy if exists "admins delete sections" on sections;
create policy "admins insert sections" on sections for insert with check (auth.uid() is not null);
create policy "admins update sections" on sections for update using (auth.uid() is not null);
create policy "admins delete sections" on sections for delete using (auth.uid() is not null);

-- Seed default settings (contact info shown on the site — editable in /admin)
insert into settings (key, value) values
  ('contact', '{"email":"hello@metariqul.dev","location":"Savar, Dhaka, Bangladesh","availability":"Currently open to freelance & full-time opportunities"}'::jsonb)
on conflict (key) do nothing;

-- Seed all site copy (en.json snapshot + marquee/wordDividers/skills rings) and hero/about sections.
-- NOTE: the full snapshot is generated by `node scripts/seed-content.mjs` (kept in sync with en.json);
-- this row is only a marker so the tables are never empty on fresh installs.
insert into settings (key, value) values
  ('site_content', '{"meta":{"title":"Md. Tariqul Islam — Full-Stack Web Developer"},"marquee":{"items":["React","Next.js","TypeScript","Node.js","PostgreSQL","Prisma","Redis","Tailwind CSS","Three.js","Framer Motion","AI / LLM","Vercel","Cloudflare"]},"wordDividers":{"build":["Build","Create","Ship"],"design":["Design","Code","Repeat"]},"skills":{"rings":{"frontend":["React","Next.js","TypeScript","Tailwind","Framer Motion","Three.js","shadcn/ui","Zustand"],"backend":["Node.js","PostgreSQL","Prisma","Redis","REST","JWT","Vercel","Cloudflare"],"ai":["OpenAI","Gemini","LangChain","OCR","PDF","RAG","Pipelines","Prompt Eng"],"python":["Python","FastAPI","Django","pandas","NumPy","Selenium","BeautifulSoup","Scikit-learn"]}}}'::jsonb)
on conflict (key) do nothing;

-- Seed hero + about sections (roles/status/subtitle + stats/badges/terminal lines)
insert into sections (key, value) values
  ('hero', '{"roles":["Full-Stack Developer","Next.js & React","Python & AI","SaaS Builder"],"subtitle":"I build fast, cinematic and AI-powered web experiences — real products, not tutorials. Currently crafting a universe of apps from Savar, Dhaka.","status":"CSE @ Gono Bishwabidyalay"}'::jsonb),
  ('about', '{"stats":[{"value":15,"suffix":"+","label":"Public projects"},{"value":32,"suffix":"+","label":"Technologies"},{"value":2,"suffix":"+","label":"Years freelancing"}],"badges":["Next.js 15","React 19","TypeScript","Tailwind v4","Three.js","Python","FastAPI","Django","PostgreSQL","Prisma","Redis","AI / LLM","Node.js","Framer Motion","Vercel","Cloudflare"],"terminalLines":["> whoami","Md. Tariqul Islam — Full-Stack Web Developer","> location","Savar, Dhaka, Bangladesh (UTC+6)","> education","B.Sc. in CSE @ Gono Bishwabidyalay (2023 → 2027)","> stack","Next.js · React · TypeScript · Node.js · PostgreSQL · Prisma · Redis","> python","FastAPI · Django · pandas · NumPy · Selenium · BeautifulSoup · scikit-learn","> philosophy","I build real products that ship — not tutorial demos. If it doesn\'t work, it doesn\'t exist.","> focus","Web engineering, AI workflows and performance — shipped, measured, iterated.","> status","Currently open to freelance & full-time opportunities ✓"]}'::jsonb)
on conflict (key) do nothing;

-- Crazy Time: hidden posts (only accessible via navbar button, not in sitemap/blog)
create table if not exists crazy_time (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  content text not null default '',
  image_url text not null default '',
  file_url text not null default '',
  file_name text not null default '',
  youtube_url text not null default '',
  doc_url text not null default '',
  category text not null default 'Tech Tips',
  created_at timestamptz not null default now()
);

-- Crazy Time: public read, authenticated write
drop policy if exists "public read crazy_time" on crazy_time;
create policy "public read crazy_time" on crazy_time for select using (true);
drop policy if exists "admins insert crazy_time" on crazy_time;
drop policy if exists "admins update crazy_time" on crazy_time;
drop policy if exists "admins delete crazy_time" on crazy_time;
create policy "admins insert crazy_time" on crazy_time for insert with check (auth.uid() is not null);
create policy "admins update crazy_time" on crazy_time for update using (auth.uid() is not null);
create policy "admins delete crazy_time" on crazy_time for delete using (auth.uid() is not null);