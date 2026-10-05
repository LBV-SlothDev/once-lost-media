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
language sql immutable as $$
  select case
    when jsonb_typeof(a) = 'object' and jsonb_typeof(b) = 'object' then (
      select coalesce(jsonb_object_agg(k,
        case when a ? k and b ? k then public.jsonb_deep_merge(a -> k, b -> k)
             when b ? k then b -> k else a -> k end), '{}'::jsonb)
      from (select jsonb_object_keys(a) as k union select jsonb_object_keys(b)) keys)
    else b end
$$;

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
