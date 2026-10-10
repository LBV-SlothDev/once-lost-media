-- Once Lost Media: ready-made Bible Study audio ("Prepare audio" on a study page).
-- Anyone can play the files; only the site owner can add, replace or remove them.
-- Paste into Supabase > SQL Editor > New query and click Run. Safe to run more than once.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('study-audio', 'study-audio', true, 10485760, array['audio/mpeg', 'application/json'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "owner adds study audio" on storage.objects;
create policy "owner adds study audio" on storage.objects for insert to authenticated
  with check (bucket_id = 'study-audio' and public.is_site_owner());
drop policy if exists "owner updates study audio" on storage.objects;
create policy "owner updates study audio" on storage.objects for update to authenticated
  using (bucket_id = 'study-audio' and public.is_site_owner());
drop policy if exists "owner removes study audio" on storage.objects;
create policy "owner removes study audio" on storage.objects for delete to authenticated
  using (bucket_id = 'study-audio' and public.is_site_owner());
drop policy if exists "owner lists study audio" on storage.objects;
create policy "owner lists study audio" on storage.objects for select to authenticated
  using (bucket_id = 'study-audio' and public.is_site_owner());
