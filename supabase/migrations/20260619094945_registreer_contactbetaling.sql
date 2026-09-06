-- De eigenaar registreert zelf een betaling van een lokaal contact (auto-bevestigd, FIFO).
create or replace function public.registreer_contactbetaling(p_contact_id uuid, p_bedrag numeric)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_mij uuid := auth.uid();
  v_rest numeric(10,2) := p_bedrag;
  r record;
  v_dekken numeric(10,2);
begin
  -- het contact moet van de ingelogde gebruiker zijn
  if not exists (
    select 1 from public.lokale_contacten where id = p_contact_id and eigenaar_id = v_mij
  ) then
    return;
  end if;
  if p_bedrag is null or p_bedrag <= 0 then
    return;
  end if;

  -- registreer de betaling voor de historiek (auto-bevestigd)
  insert into public.betalingen (ontvanger_id, betaler_contact_id, bedrag, status)
  values (v_mij, p_contact_id, p_bedrag, 'bevestigd');

  -- FIFO over de open posten van dit contact, oudste eerst
  for r in
    select id, bedrag, gedekt_bedrag
    from public.schuldposten
    where schuldeiser_id = v_mij
      and schuldenaar_contact_id = p_contact_id
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
$$;

revoke execute on function public.registreer_contactbetaling(uuid, numeric) from anon, public;
grant execute on function public.registreer_contactbetaling(uuid, numeric) to authenticated;;
