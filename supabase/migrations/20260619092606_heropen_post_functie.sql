-- Enkel de schuldeiser mag een geweigerde post heropenen, met uitleg, en maar 1x.
create or replace function public.heropen_post(p_post_id uuid, p_uitleg text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.schuldposten
  set status = 'open', heropend = true, heropening_uitleg = p_uitleg
  where id = p_post_id
    and schuldeiser_id = auth.uid()
    and status = 'geweigerd'
    and heropend = false;
end;
$$;

revoke execute on function public.heropen_post(uuid, text) from anon, public;
grant execute on function public.heropen_post(uuid, text) to authenticated;;
