-- De ontvanger (schuldeiser) bevestigt een gemelde betaling.
-- Het bedrag wordt FIFO (oudste open posten eerst) toegewezen aan de posten van die betaler.
create or replace function public.bevestig_betaling(p_betaling_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_ontvanger uuid;
  v_betaler uuid;
  v_rest numeric(10,2);
  r record;
  v_dekken numeric(10,2);
begin
  select ontvanger_id, betaler_gebruiker_id, bedrag
    into v_ontvanger, v_betaler, v_rest
  from public.betalingen
  where id = p_betaling_id and status = 'gemeld';

  -- enkel de ontvanger mag bevestigen; betaling moet bestaan en 'gemeld' zijn
  if v_ontvanger is null or v_ontvanger <> auth.uid() then
    return;
  end if;

  update public.betalingen set status = 'bevestigd' where id = p_betaling_id;

  -- enkel zinvol als de betaler een echte gebruiker is
  if v_betaler is null then
    return;
  end if;

  for r in
    select id, bedrag, gedekt_bedrag
    from public.schuldposten
    where schuldeiser_id = v_ontvanger
      and schuldenaar_gebruiker_id = v_betaler
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

revoke execute on function public.bevestig_betaling(uuid) from anon, public;
grant execute on function public.bevestig_betaling(uuid) to authenticated;;
