alter table public.users enable row level security;
alter table public.documents enable row level security;
alter table public.signatures enable row level security;

create policy "own_docs" on public.documents for select using (auth.uid() = user_id);
create policy "insert_docs" on public.documents for insert with check (auth.uid() = user_id or user_id is null);
create policy "update_own_docs" on public.documents for update using (auth.uid() = user_id);

-- Validação pública via servidor (service role). Não exponha select aberto no client.
-- create policy "validate_public" on public.documents for select using (true);

create policy "own_user" on public.users for select using (auth.jwt() ->> 'email' = email);
create policy "insert_user" on public.users for insert with check (true);

create policy "doc_owner" on public.signatures for all using (
  exists (select 1 from public.documents d where d.id = document_id and d.user_id = auth.uid())
);
