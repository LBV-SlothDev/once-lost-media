-- Once Lost Media: database setup.
-- Paste this whole file into Supabase > SQL Editor > New query, then click Run.
-- It is safe to run more than once.

-- ---------- Team member names ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default ''
);
alter table public.profiles enable row level security;
drop policy if exists "team reads profiles" on public.profiles;
create policy "team reads profiles" on public.profiles for select to authenticated using (true);
drop policy if exists "people edit own profile" on public.profiles;
create policy "people edit own profile" on public.profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(coalesce(new.email, ''), '@', 1))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
insert into public.profiles (id, display_name)
  select id, split_part(coalesce(email, ''), '@', 1) from auth.users
  on conflict (id) do nothing;

-- ---------- Journal ----------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null default '',
  excerpt text not null default '',
  body text not null default '',
  cover_url text not null default '',
  author_name text not null default '',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.posts enable row level security;
drop policy if exists "anyone reads published posts" on public.posts;
create policy "anyone reads published posts" on public.posts for select using (published or auth.role() = 'authenticated');
drop policy if exists "team writes posts" on public.posts;
create policy "team writes posts" on public.posts for all to authenticated using (true) with check (true);

-- ---------- Films ----------
create table if not exists public.films (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  description text not null default '',
  year int,
  runtime int,
  video_url text not null default '',
  video_path text not null default '',
  poster_url text not null default '',
  sort_order int not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.films enable row level security;
drop policy if exists "anyone reads published films" on public.films;
create policy "anyone reads published films" on public.films for select using (published or auth.role() = 'authenticated');
drop policy if exists "team writes films" on public.films;
create policy "team writes films" on public.films for all to authenticated using (true) with check (true);

-- ---------- Backlot (screenplay, storyboards, call sheets) ----------
create table if not exists public.backlot_docs (
  path text primary key,
  coll text not null,
  data jsonb not null default '{}'::jsonb,
  updated_by uuid default auth.uid(),
  updated_at timestamptz not null default now()
);
alter table public.backlot_docs enable row level security;
drop policy if exists "team uses backlot" on public.backlot_docs;
create policy "team uses backlot" on public.backlot_docs for all to authenticated using (true) with check (true);
alter table public.backlot_docs replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.backlot_docs;
exception when duplicate_object then null; end $$;

create or replace function public.jsonb_deep_merge(a jsonb, b jsonb) returns jsonb
language plpgsql immutable as $$
declare k text; v jsonb; r jsonb;
begin
  if a is null or jsonb_typeof(a) <> 'object' or jsonb_typeof(b) <> 'object' then return b; end if;
  r := a;
  for k, v in select * from jsonb_each(b) loop
    if r ? k and jsonb_typeof(r -> k) = 'object' and jsonb_typeof(v) = 'object' then
      r := jsonb_set(r, array[k], public.jsonb_deep_merge(r -> k, v));
    else
      r := r || jsonb_build_object(k, v);
    end if;
  end loop;
  return r;
end $$;

create or replace function public.backlot_update(p_path text, p_patch jsonb) returns void
language sql security invoker as $$
  update public.backlot_docs
     set data = public.jsonb_deep_merge(data, p_patch), updated_by = auth.uid(), updated_at = now()
   where path = p_path;
$$;

-- ---------- File storage ----------
-- "media" holds images (covers, posters); "films" holds movie files. Both are public to watch.
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('films', 'films', true) on conflict (id) do nothing;

drop policy if exists "team uploads media" on storage.objects;
create policy "team uploads media" on storage.objects for insert to authenticated with check (bucket_id in ('media', 'films'));
drop policy if exists "team updates media" on storage.objects;
create policy "team updates media" on storage.objects for update to authenticated using (bucket_id in ('media', 'films'));
drop policy if exists "team deletes media" on storage.objects;
create policy "team deletes media" on storage.objects for delete to authenticated using (bucket_id in ('media', 'films'));
drop policy if exists "team lists media" on storage.objects;
create policy "team lists media" on storage.objects for select to authenticated using (bucket_id in ('media', 'films'));

-- ---------- Access for the website ----------
grant usage on schema public to anon, authenticated;
grant select on public.posts, public.films to anon;
grant select, insert, update, delete on public.posts, public.films, public.backlot_docs, public.profiles to authenticated;
grant execute on function public.backlot_update(text, jsonb) to authenticated;
grant execute on function public.jsonb_deep_merge(jsonb, jsonb) to authenticated;

-- ---------- Backlot version history ----------
create table if not exists public.backlot_versions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  label text not null default '',
  auto boolean not null default false,
  scene_count int not null default 0,
  pages text not null default '',
  data jsonb not null default '{}'::jsonb
);
create index if not exists backlot_versions_created_at on public.backlot_versions (created_at desc);
alter table public.backlot_versions enable row level security;
drop policy if exists "team uses versions" on public.backlot_versions;
create policy "team uses versions" on public.backlot_versions for all to authenticated using (true) with check (true);
grant select, insert, update, delete on public.backlot_versions to authenticated;
