-- De schuldeiser (die geld krijgt) registreert zelf een betaling van een vriend.
-- Meteen 'bevestigd' + FIFO-toewijzing, net als registreer_contactbetaling maar
-- voor een echte gebruiker. security definer, met een controle dat het om een
-- aanvaarde vriend gaat.
create or replace function public.registreer_vriendbetaling(p_vriend_id uuid, p_bedrag numeric)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_mij uuid := auth.uid();
  v_rest numeric(10,2) := p_bedrag;
  r record;
  v_dekken numeric(10,2);
begin
  if p_bedrag is null or p_bedrag <= 0 then
    return;
  end if;

  -- de andere partij moet een aanvaarde vriend zijn
  if not exists (
    select 1 from public.vriendschappen v
    where v.status = 'aanvaard'
      and ((v.verzoeker_id = v_mij and v.ontvanger_id = p_vriend_id)
        or (v.ontvanger_id = v_mij and v.verzoeker_id = p_vriend_id))
  ) then
    return;
  end if;

  -- registreer de betaling voor de historiek (auto-bevestigd)
  insert into public.betalingen (ontvanger_id, betaler_gebruiker_id, bedrag, status)
  values (v_mij, p_vriend_id, p_bedrag, 'bevestigd');

  -- FIFO over de open posten van deze vriend, oudste eerst
  for r in
    select id, bedrag, gedekt_bedrag
    from public.schuldposten
    where schuldeiser_id = v_mij
      and schuldenaar_gebruiker_id = p_vriend_id
      and status in ('open', 'deels_betaald')
    order by datum asc, aangemaakt_op asc
  loop
    exit when v_rest <= 0;
    v_dekken := least(v_rest, r.bedrag - r.gedekt_bedrag);
    update public.schuldposten
      set gedekt_bedrag = r.gedekt_bedrag + v_dekken,
          status = case when r.gedekt_bedrag + v_dekken >= r.bedrag then 'betaald' else 'deels_betaald' end
      where id = r.id;
    v_rest := v_rest - v_dekken;
  end loop;
end;
$function$;

revoke all on function public.registreer_vriendbetaling(uuid, numeric) from public, anon;
grant execute on function public.registreer_vriendbetaling(uuid, numeric) to authenticated;;
