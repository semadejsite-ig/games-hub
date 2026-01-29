-- Function to find a league by code (Bypassing RLS)
create or replace function public.get_league_by_code(_code text)
returns table (id uuid, name text) 
language plpgsql 
security definer 
as $$
begin
  return query
  select l.id, l.name
  from public.leagues l
  where l.code = _code;
end;
$$;
