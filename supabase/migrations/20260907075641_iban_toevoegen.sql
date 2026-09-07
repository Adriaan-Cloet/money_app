-- US-024: een rekeningnummer bij een gebruiker en bij een lokaal contact.
--
-- De IBAN wordt zonder spaties en in hoofdletters bewaard; de app zet er bij het
-- tonen zelf groepjes van vier van. De check bewaakt enkel de vorm, niet het
-- controlegetal: mod-97 hoort in de app (src/utils/iban.ts), want een falende
-- check-constraint geeft de gebruiker geen bruikbare uitleg.
--
-- Geen aparte zichtbaarheidsinstelling: de policy "zie profiel van vrienden"
-- (migratie 20260618213948) geeft aanvaarde vrienden al select op deze tabel,
-- dus de IBAN volgt automatisch mee. Beslist op 6 september 2026.

alter table public.gebruikers
  add column iban text,
  add column rekeninghouder text;

alter table public.gebruikers
  add constraint gebruikers_iban_vorm
  check (iban is null or iban ~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$');

-- Een lokaal contact heeft geen account, dus dit nummer beheer je zelf. Dat is
-- net de groep van wie je het rekeningnummer niet vanzelf krijgt.
alter table public.lokale_contacten
  add column iban text;

alter table public.lokale_contacten
  add constraint lokale_contacten_iban_vorm
  check (iban is null or iban ~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$');

-- De vriendenlijst geeft de IBAN mee, zodat VriendDetail geen tweede datacall
-- nodig heeft voor iets wat toch al bij de naam hoort. Return type wijzigt, dus
-- drop and create; zelfde aanpak als bij vriendschap_id in juni.
drop function if exists public.vriendenlijst();

create function public.vriendenlijst()
returns table (
  gebruiker_id uuid,
  gebruikersnaam text,
  vriendschap_id uuid,
  iban text,
  rekeninghouder text
)
language sql security definer set search_path = '' stable
as $$
  select g.id, g.gebruikersnaam, v.id, g.iban, g.rekeninghouder
  from public.vriendschappen v
  join public.gebruikers g
    on g.id = case when v.verzoeker_id = auth.uid() then v.ontvanger_id else v.verzoeker_id end
  where v.status = 'aanvaard'
    and (v.verzoeker_id = auth.uid() or v.ontvanger_id = auth.uid())
  order by g.gebruikersnaam;
$$;

revoke execute on function public.vriendenlijst() from anon, public;
grant execute on function public.vriendenlijst() to authenticated;
