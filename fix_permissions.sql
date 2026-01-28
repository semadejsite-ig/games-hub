-- Opção 1: Desativar temporariamente a segurança (Mais rápido para DEV)
alter table questions disable row level security;

-- Opção 2: Ou, se preferir manter ativado, crie uma política que permite tudo (para facilitar o Admin)
-- drop policy if exists "Authenticated users can insert questions." on questions;
-- create policy "Allow public insert" on questions for insert with check (true);
