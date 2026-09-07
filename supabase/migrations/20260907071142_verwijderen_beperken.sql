-- US-022: wie mag een transactie verwijderen, en wanneer.
--
-- De regel staat hier en niet enkel in de UI, want een policy is niet te
-- omzeilen. Twee van de drie policies zijn RESTRICTIVE: die worden met AND bij
-- de bestaande "beheert eigen"-policies gevoegd, zodat die niet opengebroken
-- moeten worden in aparte select-, insert- en update-policies.
--
-- Let op bij het lezen van fouten: een delete die door RLS geweigerd wordt,
-- geeft geen fout maar wist stil 0 rijen. De clientcode kijkt daarom naar het
-- aantal teruggegeven rijen.

-- Een post waar al op betaald is, heeft dekking die via FIFO is toegewezen bij
-- het bevestigen van een betaling. Die weghalen laat geld achter dat nergens
-- meer heen kan. De uitweg is een tegenboeking: een nieuwe post in de andere
-- richting met het foute bedrag.
create policy "post verwijderen enkel zonder dekking"
on public.schuldposten as restrictive for delete
using (gedekt_bedrag = 0);

-- Een bevestigde betaling is al FIFO toegewezen aan posten en blijft dus staan.
-- Verder mag enkel de maker van de betaling ze weghalen. Wie dat is, hangt af
-- van hoe ze ontstond: via maakBetaling is dat de betaler, via
-- registreer_contactbetaling en registreer_vriendbetaling de ontvanger. Bij die
-- laatste twee is de status altijd 'bevestigd', dus die vallen sowieso al af.
create policy "betaling verwijderen enkel door de maker en niet bevestigd"
on public.betalingen as restrictive for delete
using (
  status <> 'bevestigd'
  and auth.uid() = coalesce(betaler_gebruiker_id, ontvanger_id)
);

-- De betaler had tot nu enkel select en insert. Zonder deze policy is er voor
-- hem geen enkele delete toegelaten en zou de restrictieve policy hierboven
-- niets uithalen.
create policy "betaler verwijdert eigen betaling"
on public.betalingen for delete
using (auth.uid() = betaler_gebruiker_id);
