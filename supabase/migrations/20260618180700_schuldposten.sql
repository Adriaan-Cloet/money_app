-- Een voorgeschoten bedrag dat de schuldeiser terugvraagt van een schuldenaar.
-- De schuldenaar is OFWEL een echte gebruiker OFWEL een lokaal contact.
create table public.schuldposten (
  id uuid primary key default gen_random_uuid(),
  schuldeiser_id uuid not null references public.gebruikers(id) on delete cascade,
  schuldenaar_gebruiker_id uuid references public.gebruikers(id) on delete cascade,
  schuldenaar_contact_id uuid references public.lokale_contacten(id) on delete cascade,
  bedrag numeric(10,2) not null check (bedrag > 0),
  omschrijving text,
  datum date not null default current_date,
  status text not null default 'open' check (status in ('open','geweigerd','deels_betaald','betaald')),
  gedekt_bedrag numeric(10,2) not null default 0 check (gedekt_bedrag >= 0),
  heropend boolean not null default false,
  heropening_uitleg text,
  aangemaakt_op timestamptz not null default now(),
  -- precies een van beide schuldenaar-velden moet ingevuld zijn
  constraint schuldenaar_precies_een check (
    (schuldenaar_gebruiker_id is not null)::int
    + (schuldenaar_contact_id is not null)::int = 1
  )
);

alter table public.schuldposten enable row level security;

-- De schuldeiser maakt en beheert zijn eigen posten
create policy "schuldeiser beheert eigen posten"
on public.schuldposten for all
using (auth.uid() = schuldeiser_id)
with check (auth.uid() = schuldeiser_id);

-- Een schuldenaar die een echte gebruiker is, ziet de posten op zijn naam
create policy "schuldenaar ziet posten op zijn naam"
on public.schuldposten for select
using (auth.uid() = schuldenaar_gebruiker_id);;
