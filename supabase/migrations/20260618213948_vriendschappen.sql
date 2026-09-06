-- Vriendschap tussen twee gebruikers, met verzoek/aanvaard-flow.
create table public.vriendschappen (
  id uuid primary key default gen_random_uuid(),
  verzoeker_id uuid not null references public.gebruikers(id) on delete cascade,
  ontvanger_id uuid not null references public.gebruikers(id) on delete cascade,
  status text not null default 'in_afwachting' check (status in ('in_afwachting','aanvaard')),
  aangemaakt_op timestamptz not null default now(),
  constraint niet_jezelf check (verzoeker_id <> ontvanger_id)
);

-- Eén relatie per paar, ongeacht de richting (voorkomt dubbele/omgekeerde verzoeken).
create unique index vriendschap_uniek_paar
on public.vriendschappen (least(verzoeker_id, ontvanger_id), greatest(verzoeker_id, ontvanger_id));

alter table public.vriendschappen enable row level security;

create policy "betrokkenen zien vriendschap"
on public.vriendschappen for select
using (auth.uid() = verzoeker_id or auth.uid() = ontvanger_id);

create policy "verzoek sturen"
on public.vriendschappen for insert
with check (auth.uid() = verzoeker_id);

create policy "ontvanger aanvaardt"
on public.vriendschappen for update
using (auth.uid() = ontvanger_id)
with check (auth.uid() = ontvanger_id);

create policy "betrokkenen verwijderen"
on public.vriendschappen for delete
using (auth.uid() = verzoeker_id or auth.uid() = ontvanger_id);

-- Helper: zijn auth.uid() en p_ander aanvaarde vrienden? (security definer, omzeilt RLS netjes)
create or replace function public.is_vriend(p_ander uuid)
returns boolean
language sql security definer set search_path = '' stable
as $$
  select exists (
    select 1 from public.vriendschappen v
    where v.status = 'aanvaard'
      and ((v.verzoeker_id = auth.uid() and v.ontvanger_id = p_ander)
        or (v.ontvanger_id = auth.uid() and v.verzoeker_id = p_ander))
  );
$$;

-- Vrienden mogen elkaars profiel zien.
create policy "zie profiel van vrienden"
on public.gebruikers for select
using (public.is_vriend(id));

-- Zoek een gebruiker op exacte gebruikersnaam (om een verzoek te sturen). Geeft enkel id + naam.
create or replace function public.zoek_gebruiker(p_naam text)
returns table (id uuid, gebruikersnaam text)
language sql security definer set search_path = '' stable
as $$
  select g.id, g.gebruikersnaam
  from public.gebruikers g
  where lower(g.gebruikersnaam) = lower(p_naam)
    and g.id <> auth.uid()
  limit 1;
$$;

-- Inkomende verzoeken (jij bent de ontvanger), met de naam van de verzoeker.
create or replace function public.inkomende_verzoeken()
returns table (vriendschap_id uuid, verzoeker_id uuid, gebruikersnaam text)
language sql security definer set search_path = '' stable
as $$
  select v.id, v.verzoeker_id, g.gebruikersnaam
  from public.vriendschappen v
  join public.gebruikers g on g.id = v.verzoeker_id
  where v.ontvanger_id = auth.uid() and v.status = 'in_afwachting'
  order by v.aangemaakt_op desc;
$$;

-- Je aanvaarde vrienden.
create or replace function public.vriendenlijst()
returns table (gebruiker_id uuid, gebruikersnaam text)
language sql security definer set search_path = '' stable
as $$
  select g.id, g.gebruikersnaam
  from public.vriendschappen v
  join public.gebruikers g
    on g.id = case when v.verzoeker_id = auth.uid() then v.ontvanger_id else v.verzoeker_id end
  where v.status = 'aanvaard'
    and (v.verzoeker_id = auth.uid() or v.ontvanger_id = auth.uid())
  order by g.gebruikersnaam;
$$;

-- Functies enkel voor ingelogde gebruikers.
revoke execute on function public.is_vriend(uuid) from anon, public;
revoke execute on function public.zoek_gebruiker(text) from anon, public;
revoke execute on function public.inkomende_verzoeken() from anon, public;
revoke execute on function public.vriendenlijst() from anon, public;
grant execute on function public.is_vriend(uuid) to authenticated;
grant execute on function public.zoek_gebruiker(text) to authenticated;
grant execute on function public.inkomende_verzoeken() to authenticated;
grant execute on function public.vriendenlijst() to authenticated;;
