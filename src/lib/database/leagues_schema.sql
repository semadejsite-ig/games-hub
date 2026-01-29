-- Create LEAGUES table
create table public.leagues (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  name text not null,
  code text not null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  constraint leagues_pkey primary key (id),
  constraint leagues_code_key unique (code)
);

-- Create LEAGUE_MEMBERS table
create table public.league_members (
  id uuid not null default gen_random_uuid (),
  joined_at timestamp with time zone not null default now(),
  league_id uuid not null references public.leagues (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  constraint league_members_pkey primary key (id),
  constraint league_members_league_user_key unique (league_id, user_id)
);

-- Enable RLS
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;

-- Policies for LEAGUES
create policy "Anyone can view leagues they are member of"
on public.leagues for select
using (
  auth.uid() in (
    select user_id from public.league_members where league_id = id
  )
  or 
  auth.uid() = owner_id
);

create policy "Users can create leagues"
on public.leagues for insert
with check (auth.uid() = owner_id);

create policy "Owners can delete their leagues"
on public.leagues for delete
using (auth.uid() = owner_id);

-- Policies for LEAGUE_MEMBERS
create policy "Deeply allow reading members if you are in the league"
on public.league_members for select
using (
  league_id in (
    select id from public.leagues
    where owner_id = auth.uid()
    or id in (select league_id from public.league_members where user_id = auth.uid())
  )
);

create policy "Users can join leagues (insert themselves)"
on public.league_members for insert
with check (auth.uid() = user_id);

create policy "Users can leave leagues (delete themselves)"
on public.league_members for delete
using (auth.uid() = user_id);
