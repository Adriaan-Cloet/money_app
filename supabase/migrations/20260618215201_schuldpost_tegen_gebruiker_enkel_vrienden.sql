-- Een schuldpost tegen een echte gebruiker mag enkel als die een aanvaarde vriend is.
-- (Tegen een lokaal contact is schuldenaar_gebruiker_id null, dus dan geldt de regel niet.)
alter policy "schuldeiser beheert eigen posten"
on public.schuldposten
with check (
  auth.uid() = schuldeiser_id
  and (schuldenaar_gebruiker_id is null or public.is_vriend(schuldenaar_gebruiker_id))
);;
