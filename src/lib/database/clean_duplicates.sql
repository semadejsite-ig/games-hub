-- 1. Remove Duplicate Members (Keep the oldest entry)
delete from public.league_members a using public.league_members b
where a.id > b.id 
and a.user_id = b.user_id 
and a.league_id = b.league_id;

-- 2. Ensure Unique Constraint exists
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'league_members_league_user_key') then
    alter table public.league_members 
    add constraint league_members_league_user_key unique (league_id, user_id);
  end if;
end $$;
