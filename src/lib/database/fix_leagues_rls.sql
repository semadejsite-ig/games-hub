-- Helper function to check membership without recursion (Security Definer bypasses RLS)
create or replace function public.is_league_member(_league_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.league_members
    where league_id = _league_id
    and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Re-apply policies using the function

-- LEAGUES Policies
drop policy if exists "Anyone can view leagues they are member of" on public.leagues;
create policy "Anyone can view leagues they are member of"
on public.leagues for select
using (
  auth.uid() = owner_id
  or 
  public.is_league_member(id)
);

-- LEAGUE_MEMBERS Policies
drop policy if exists "Deeply allow reading members if you are in the league" on public.league_members;
create policy "Deeply allow reading members if you are in the league"
on public.league_members for select
using (
  -- I can see members if I am a member of that league OR if I own that league
  public.is_league_member(league_id)
  or
  exists (select 1 from public.leagues where id = league_id and owner_id = auth.uid())
);
