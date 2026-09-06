-- Enkel de schuldenaar (echte gebruiker) mag een openstaande post op zijn naam weigeren.
create or replace function public.weiger_post(p_post_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.schuldposten
  set status = 'geweigerd'
  where id = p_post_id
    and schuldenaar_gebruiker_id = auth.uid()
    and status = 'open';
end;
$$;

revoke execute on function public.weiger_post(uuid) from anon, public;
grant execute on function public.weiger_post(uuid) to authenticated;;
