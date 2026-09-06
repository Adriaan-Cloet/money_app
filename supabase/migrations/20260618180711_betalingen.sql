-- Een betaling met een vrij bedrag, los van een specifieke post.
-- De betaler is OFWEL een echte gebruiker OFWEL een lokaal contact (zelfbeheer door de eigenaar).
create table public.betalingen (
  id uuid primary key default gen_random_uuid(),
  ontvanger_id uuid not null references public.gebruikers(id) on delete cascade,
  betaler_gebruiker_id uuid references public.gebruikers(id) on delete cascade,
  betaler_contact_id uuid references public.lokale_contacten(id) on delete cascade,
  bedrag numeric(10,2) not null check (bedrag > 0),
  datum date not null default current_date,
  status text not null default 'gemeld' check (status in ('gemeld','bevestigd','wacht','fout')),
  aangemaakt_op timestamptz not null default now(),
  constraint betaler_precies_een check (
    (betaler_gebruiker_id is not null)::int
    + (betaler_contact_id is not null)::int = 1
  )
);

alter table public.betalingen enable row level security;

-- De ontvanger (schuldeiser) ziet en beheert betalingen aan hem.
-- Dit dekt ook de lokaal-contact-flow: de eigenaar is de ontvanger en registreert zelf.
create policy "ontvanger beheert betalingen"
on public.betalingen for all
using (auth.uid() = ontvanger_id)
with check (auth.uid() = ontvanger_id);

-- Een betaler die een echte gebruiker is, ziet zijn eigen betalingen en kan ze melden.
create policy "betaler ziet eigen betalingen"
on public.betalingen for select
using (auth.uid() = betaler_gebruiker_id);

create policy "betaler meldt betaling"
on public.betalingen for insert
with check (auth.uid() = betaler_gebruiker_id);;
