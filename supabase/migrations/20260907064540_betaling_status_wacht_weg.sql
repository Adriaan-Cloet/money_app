-- US-021: de status 'wacht' verdwijnt.
--
-- 'wacht' was bedoeld als "ik heb je melding gezien maar nog niets op mijn
-- rekening". In de praktijk was het een doodlopende weg: bevestig_betaling
-- werkt enkel op status 'gemeld', dus een betaling op 'wacht' kon nooit meer
-- bevestigd worden. Wachten met bevestigen vraagt trouwens geen status: een
-- gemelde betaling blijft gewoon staan tot ze bevestigd of fout gemeld wordt.

-- Eerst de bestaande rijen, anders faalt de nieuwe check.
update public.betalingen set status = 'gemeld' where status = 'wacht';

alter table public.betalingen drop constraint if exists betalingen_status_check;

alter table public.betalingen
  add constraint betalingen_status_check
  check (status in ('gemeld', 'bevestigd', 'fout'));
