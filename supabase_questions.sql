-- Create Questions table
create table questions (
  id uuid default gen_random_uuid() primary key,
  text text not null,
  options jsonb not null, -- Array of strings ["Op A", "Op B", "Op C", "Op D"]
  correct_option integer not null, -- Index 0-3
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard', 'million')),
  reference text, -- Biblical reference (e.g., "Gênesis 1:1")
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table questions enable row level security;

create policy "Questions are viewable by everyone." on questions
  for select using (true);

-- Only authenticated users (or specific roles in future) can insert questions
create policy "Authenticated users can insert questions." on questions
  for insert with check (auth.role() = 'authenticated');

-- Comment:
-- To use the Gemini API, we will create an API Route that:
-- 1. Receives a prompt/topic.
-- 2. Calls Google Gemini.
-- 3. Returns the JSON with question/options/answer.
-- 4. User reviews and saves to this table.
