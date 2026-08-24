-- FIX: Add public read policies for content tables + keep authenticated write policies.
-- Run this in Supabase → SQL Editor to fix projects not showing on main page.

-- ============================================
-- PUBLIC READ POLICIES (for portfolio visitors)
-- ============================================

-- Projects: public read
drop policy if exists "public read projects" on projects;
create policy "public read projects" on projects for select using (true);

-- Blogs: public read (only published posts shown via code, but policy allows read)
drop policy if exists "public read blogs" on blogs;
create policy "public read blogs" on blogs for select using (true);

-- Settings: public read
drop policy if exists "public read settings" on settings;
create policy "public read settings" on settings for select using (true);

-- Services: public read
drop policy if exists "public read services" on services;
create policy "public read services" on services for select using (true);

-- Process: public read
drop policy if exists "public read process" on process;
create policy "public read process" on process for select using (true);

-- Experience: public read
drop policy if exists "public read experience" on experience;
create policy "public read experience" on experience for select using (true);

-- Testimonials: public read
drop policy if exists "public read testimonials" on testimonials;
create policy "public read testimonials" on testimonials for select using (true);

-- Sections: public read
drop policy if exists "public read sections" on sections;
create policy "public read sections" on sections for select using (true);

-- Messages: keep authenticated-only (admin only)
-- No public read for messages.

-- ============================================
-- AUTHENTICATED WRITE POLICIES (CRUD for admin)
-- ============================================

-- Projects: authenticated CRUD (insert/update/delete)
-- SELECT already covered by public read above.
-- Insert/Update/Delete already exist from init.sql, but let's ensure they work.

-- If the existing policies use auth.role() = 'authenticated' and that doesn't work,
-- we can also add auth.uid() IS NOT NULL as an alternative check.
-- Let's update the write policies to be more robust:

drop policy if exists "admins insert projects" on projects;
create policy "admins insert projects" on projects for insert
  with check (auth.uid() is not null);

drop policy if exists "admins update projects" on projects;
create policy "admins update projects" on projects for update
  using (auth.uid() is not null);

drop policy if exists "admins delete projects" on projects;
create policy "admins delete projects" on projects for delete
  using (auth.uid() is not null);

-- Blogs: authenticated write
drop policy if exists "admins insert blogs" on blogs;
create policy "admins insert blogs" on blogs for insert
  with check (auth.uid() is not null);

drop policy if exists "admins update blogs" on blogs;
create policy "admins update blogs" on blogs for update
  using (auth.uid() is not null);

drop policy if exists "admins delete blogs" on blogs;
create policy "admins delete blogs" on blogs for delete
  using (auth.uid() is not null);

-- Messages: authenticated write
drop policy if exists "admins update messages" on messages;
create policy "admins update messages" on messages for update
  using (auth.uid() is not null);

drop policy if exists "admins delete messages" on messages;
create policy "admins delete messages" on messages for delete
  using (auth.uid() is not null);

-- Settings: authenticated write
drop policy if exists "admins insert settings" on settings;
create policy "admins insert settings" on settings for insert
  with check (auth.uid() is not null);

drop policy if exists "admins update settings" on settings;
create policy "admins update settings" on settings for update
  using (auth.uid() is not null);

drop policy if exists "admins delete settings" on settings;
create policy "admins delete settings" on settings for delete
  using (auth.uid() is not null);

-- Services: authenticated write
drop policy if exists "admins insert services" on services;
create policy "admins insert services" on services for insert
  with check (auth.uid() is not null);

drop policy if exists "admins update services" on services;
create policy "admins update services" on services for update
  using (auth.uid() is not null);

drop policy if exists "admins delete services" on services;
create policy "admins delete services" on services for delete
  using (auth.uid() is not null);

-- Process: authenticated write
drop policy if exists "admins insert process" on process;
create policy "admins insert process" on process for insert
  with check (auth.uid() is not null);

drop policy if exists "admins update process" on process;
create policy "admins update process" on process for update
  using (auth.uid() is not null);

drop policy if exists "admins delete process" on process;
create policy "admins delete process" on process for delete
  using (auth.uid() is not null);

-- Experience: authenticated write
drop policy if exists "admins insert experience" on experience;
create policy "admins insert experience" on experience for insert
  with check (auth.uid() is not null);

drop policy if exists "admins update experience" on experience;
create policy "admins update experience" on experience for update
  using (auth.uid() is not null);

drop policy if exists "admins delete experience" on experience;
create policy "admins delete experience" on experience for delete
  using (auth.uid() is not null);

-- Testimonials: authenticated write
drop policy if exists "admins insert testimonials" on testimonials;
create policy "admins insert testimonials" on testimonials for insert
  with check (auth.uid() is not null);

drop policy if exists "admins update testimonials" on testimonials;
create policy "admins update testimonials" on testimonials for update
  using (auth.uid() is not null);

drop policy if exists "admins delete testimonials" on testimonials;
create policy "admins delete testimonials" on testimonials for delete
  using (auth.uid() is not null);

-- Sections: authenticated write
drop policy if exists "admins insert sections" on sections;
create policy "admins insert sections" on sections for insert
  with check (auth.uid() is not null);

drop policy if exists "admins update sections" on sections;
create policy "admins update sections" on sections for update
  using (auth.uid() is not null);

drop policy if exists "admins delete sections" on sections;
create policy "admins delete sections" on sections for delete
  using (auth.uid() is not null);
