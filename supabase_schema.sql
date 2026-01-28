-- 1. Create Teams table FIRST (because profiles references it)
create table teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  color text, -- hex code
  total_score bigint default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Profiles table
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone,
  
  -- Game specific fields
  total_xp integer default 0,
  team_id uuid references teams(id)
);

-- 3. Create Matches/Scores table
create table game_matches (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) not null,
  game_id text not null, -- 'show-do-milhao', 'wordle', etc.
  score integer not null,
  metadata jsonb, -- Extra details (e.g. level reached)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable RLS
alter table profiles enable row level security;
alter table teams enable row level security;
alter table game_matches enable row level security;

-- 5. Policies
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

create policy "Teams are viewable by everyone." on teams
  for select using (true);

create policy "Game matches are viewable by everyone." on game_matches
  for select using (true);

create policy "Users can insert their own matches." on game_matches
  for insert with check (auth.uid() = user_id);

-- 6. Triggers
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. Seed Data
insert into teams (name, color) values 
('Jovens', '#3b82f6'), -- Blue
('Adolescentes', '#eab308'), -- Yellow
('Varões', '#22c55e'), -- Green
('Senhoras', '#ef4444'); -- Red
