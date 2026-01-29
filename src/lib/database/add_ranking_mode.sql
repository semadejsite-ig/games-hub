-- Add ranking_mode column with default 'best'
alter table public.leagues
add column ranking_mode text not null default 'best' check (ranking_mode in ('best', 'accumulative', 'limited'));

-- Add max_attempts column (nullable, used only if mode is 'limited')
alter table public.leagues
add column max_attempts integer default null;
