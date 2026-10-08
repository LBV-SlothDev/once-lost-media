-- Backlot HD voices (ElevenLabs). Run once in Supabase: SQL Editor -> New query -> paste -> Run. Safe to run again.

-- Private storage for spoken lines, so each line is only paid for once.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tts-cache', 'tts-cache', false, 5242880, array['audio/mpeg'])
on conflict (id) do nothing;

-- Who may use (and spend) HD voice credits: the site owner and the Once Lost Media home team.
create or replace function public.can_use_hd_voices() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_site_owner() or exists (
    select 1 from public.workspace_members m
    join public.workspaces w on w.id = m.workspace_id
    where w.is_home and m.user_id = auth.uid()
  );
$$;
grant execute on function public.can_use_hd_voices() to authenticated;
