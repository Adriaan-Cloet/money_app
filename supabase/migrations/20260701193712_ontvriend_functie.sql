-- Ontvrienden: wist alle transacties tussen de twee gebruikers en dan de vriendschap.
-- security definer, want door RLS mag de ene partij niet de posten/betalingen van de
-- andere partij verwijderen. De functie checkt zelf dat de aanroeper bij de vriendschap hoort.
create or replace function public.ontvriend(p_vriendschap_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_a uuid;
  v_b uuid;
begin
  select verzoeker_id, ontvanger_id into v_a, v_b
  from vriendschappen
  where id = p_vriendschap_id;

  if v_a is null then
    raise exception 'Vriendschap niet gevonden';
  end if;

  if auth.uid() <> v_a and auth.uid() <> v_b then
    raise exception 'Niet toegestaan';
  end if;

  -- Alle schuldposten tussen de twee gebruikers (beide richtingen).
  delete from schuldposten
  where (schuldeiser_id = v_a and schuldenaar_gebruiker_id = v_b)
     or (schuldeiser_id = v_b and schuldenaar_gebruiker_id = v_a);

  -- Alle betalingen tussen de twee gebruikers (beide richtingen).
  delete from betalingen
  where (ontvanger_id = v_a and betaler_gebruiker_id = v_b)
     or (ontvanger_id = v_b and betaler_gebruiker_id = v_a);

  -- Ten slotte de vriendschap zelf.
  delete from vriendschappen where id = p_vriendschap_id;
end;
$$;

revoke all on function public.ontvriend(uuid) from public, anon;
grant execute on function public.ontvriend(uuid) to authenticated;;
