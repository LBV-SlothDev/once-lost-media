-- Bible Study pages and comments.
-- Run once in Supabase: SQL Editor -> New query -> paste this file -> Run.
-- Safe to run again.

-- ---------- Drafts stay private now that anyone can sign up ----------
-- Before, any signed-in person could read draft journal posts and films.
drop policy if exists "anyone reads published posts" on public.posts;
create policy "anyone reads published posts" on public.posts for select
  using (published or public.is_site_owner());
drop policy if exists "anyone reads published films" on public.films;
create policy "anyone reads published films" on public.films for select
  using (published or public.is_site_owner());

-- ---------- Bible studies ----------
create table if not exists public.studies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null default '',
  scripture text not null default '',
  excerpt text not null default '',
  body text not null default '',
  questions text not null default '',
  cover_url text not null default '',
  author_name text not null default '',
  comments_open boolean not null default true,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.studies enable row level security;
drop policy if exists "anyone reads published studies" on public.studies;
create policy "anyone reads published studies" on public.studies for select
  using (published or public.is_site_owner());
drop policy if exists "owner writes studies" on public.studies;
create policy "owner writes studies" on public.studies for all to authenticated
  using (public.is_site_owner()) with check (public.is_site_owner());
grant select on public.studies to anon, authenticated;
grant insert, update, delete on public.studies to authenticated;

-- ---------- Comments ----------
create table if not exists public.study_comments (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name text not null default '',
  body text not null check (char_length(body) between 1 and 2000),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists study_comments_study on public.study_comments (study_id, created_at);
create index if not exists study_comments_user on public.study_comments (user_id, created_at);
alter table public.study_comments enable row level security;

drop policy if exists "read visible comments" on public.study_comments;
create policy "read visible comments" on public.study_comments for select using (
  public.is_site_owner()
  or (user_id = auth.uid())
  or (not hidden and exists (select 1 from public.studies s where s.id = study_id and s.published))
);
drop policy if exists "signed-in people comment" on public.study_comments;
create policy "signed-in people comment" on public.study_comments for insert to authenticated with check (
  user_id = auth.uid()
  and exists (select 1 from public.studies s where s.id = study_id and s.published and s.comments_open)
);
drop policy if exists "owner hides comments" on public.study_comments;
create policy "owner hides comments" on public.study_comments for update to authenticated
  using (public.is_site_owner()) with check (public.is_site_owner());
drop policy if exists "delete own or owner" on public.study_comments;
create policy "delete own or owner" on public.study_comments for delete to authenticated
  using (user_id = auth.uid() or public.is_site_owner());

-- People can only send the study and the text; everything else is filled in here.
revoke all on public.study_comments from anon, authenticated;
grant select on public.study_comments to anon, authenticated;
grant insert (study_id, body) on public.study_comments to authenticated;
grant update (hidden) on public.study_comments to authenticated;
grant delete on public.study_comments to authenticated;

create or replace function public.study_comment_fill() returns trigger
language plpgsql security definer set search_path = public as $$
declare recent int;
begin
  new.user_id := auth.uid();
  if new.user_id is null then raise exception 'Sign in to comment.'; end if;
  new.body := btrim(regexp_replace(new.body, '\n{3,}', E'\n\n', 'g'));
  if char_length(new.body) = 0 then raise exception 'Write something before posting.'; end if;
  if char_length(new.body) > 2000 then raise exception 'Comments can be up to 2,000 characters.'; end if;
  select count(*) into recent from public.study_comments
    where user_id = new.user_id and created_at > now() - interval '10 minutes';
  if recent >= 5 and not public.is_site_owner() then
    raise exception 'You''re commenting very fast. Please wait a few minutes and try again.';
  end if;
  select coalesce(nullif(btrim(p.display_name), ''), split_part(u.email, '@', 1), 'Friend')
    into new.author_name
    from auth.users u left join public.profiles p on p.id = u.id
    where u.id = new.user_id;
  new.hidden := false;
  new.created_at := now();
  return new;
end $$;
drop trigger if exists study_comment_fill on public.study_comments;
create trigger study_comment_fill before insert on public.study_comments
  for each row execute function public.study_comment_fill();

-- Comment counts for the Bible Study list (visible comments only).
create or replace function public.study_comment_counts()
returns table (study_id uuid, n bigint)
language sql stable security definer set search_path = public as $$
  select c.study_id, count(*) from public.study_comments c
  join public.studies s on s.id = c.study_id and s.published
  where not c.hidden group by c.study_id;
$$;
grant execute on function public.study_comment_counts() to anon, authenticated;
