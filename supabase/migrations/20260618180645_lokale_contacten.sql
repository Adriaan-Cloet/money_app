-- Personen zonder account, enkel zichtbaar voor de eigenaar
create table public.lokale_contacten (
  id uuid primary key default gen_random_uuid(),
  eigenaar_id uuid not null references public.gebruikers(id) on delete cascade,
  naam text not null,
  -- leeg tot het contact ooit aan een echt account gekoppeld wordt (later)
  gekoppeld_gebruiker_id uuid references public.gebruikers(id) on delete set null,
  aangemaakt_op timestamptz not null default now()
);

alter table public.lokale_contacten enable row level security;

-- De eigenaar mag zijn eigen contacten volledig beheren (zien, toevoegen, wijzigen, verwijderen)
create policy "eigenaar beheert eigen contacten"
on public.lokale_contacten for all
using (auth.uid() = eigenaar_id)
with check (auth.uid() = eigenaar_id);;
