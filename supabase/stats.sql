-- Once Lost Media: visitor counts for the site owner's Studio.
-- Counts one visit per browser per day for the site and Bible Study, and one per person per day for Backlot.
-- No names, emails or IP addresses are stored. Only the site owner can read the totals.
-- Paste into Supabase > SQL Editor > New query and click Run. Safe to run more than once.

create table if not exists public.site_visits (
  day date not null default (now() at time zone 'America/New_York')::date,
  visitor text not null check (char_length(visitor) between 8 and 64),
  area text not null,
  user_id uuid references auth.users (id) on delete set null,
  primary key (day, visitor, area)
);
alter table public.site_visits drop constraint if exists site_visits_area_check;
alter table public.site_visits add constraint site_visits_area_check check (area in ('site', 'backlot', 'study'));
alter table public.site_visits enable row level security;
-- No policies on purpose: nobody reads or writes the table directly.
revoke all on public.site_visits from anon, authenticated;

create or replace function public.log_visit(p_visitor text, p_area text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_area not in ('site', 'backlot', 'study') or p_visitor is null or char_length(p_visitor) not between 8 and 64 then
    return;
  end if;
  if public.is_site_owner() then
    return; -- the owner's own visits don't count
  end if;
  insert into public.site_visits (visitor, area, user_id)
  values (p_visitor, p_area, auth.uid())
  on conflict do nothing;
end $$;
grant execute on function public.log_visit(text, text) to anon, authenticated;

create or replace function public.site_stats() returns json
language plpgsql stable security definer set search_path = public as $$
declare
  today date := (now() at time zone 'America/New_York')::date;
  r json;
begin
  if not public.is_site_owner() then
    raise exception 'Only the site owner can see these numbers.';
  end if;
  select json_build_object(
    'site_today',    (select count(distinct visitor) from site_visits where area = 'site' and day = today),
    'site_7',        (select count(distinct visitor) from site_visits where area = 'site' and day > today - 7),
    'site_30',       (select count(distinct visitor) from site_visits where area = 'site' and day > today - 30),
    'site_all',      (select count(distinct visitor) from site_visits where area = 'site'),
    'backlot_today', (select count(distinct coalesce(user_id::text, visitor)) from site_visits where area = 'backlot' and day = today),
    'backlot_7',     (select count(distinct coalesce(user_id::text, visitor)) from site_visits where area = 'backlot' and day > today - 7),
    'backlot_30',    (select count(distinct coalesce(user_id::text, visitor)) from site_visits where area = 'backlot' and day > today - 30),
    'backlot_all',   (select count(distinct coalesce(user_id::text, visitor)) from site_visits where area = 'backlot'),
    'study_today',   (select count(distinct visitor) from site_visits where area = 'study' and day = today),
    'study_7',       (select count(distinct visitor) from site_visits where area = 'study' and day > today - 7),
    'study_30',      (select count(distinct visitor) from site_visits where area = 'study' and day > today - 30),
    'study_all',     (select count(distinct visitor) from site_visits where area = 'study'),
    'accounts',      (select count(*) from auth.users),
    'accounts_30',   (select count(*) from auth.users where created_at > now() - interval '30 days'),
    'projects',      (select count(*) from workspaces),
    'since',         (select min(day) from site_visits)
  ) into r;
  return r;
end $$;
revoke execute on function public.site_stats() from anon;
grant execute on function public.site_stats() to authenticated;
