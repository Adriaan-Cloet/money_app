drop function if exists public.vriendenlijst();

create function public.vriendenlijst()
returns table (gebruiker_id uuid, gebruikersnaam text, vriendschap_id uuid)
language sql security definer set search_path = '' stable
as $$
  select g.id, g.gebruikersnaam, v.id
  from public.vriendschappen v
  join public.gebruikers g
    on g.id = case when v.verzoeker_id = auth.uid() then v.ontvanger_id else v.verzoeker_id end
  where v.status = 'aanvaard'
    and (v.verzoeker_id = auth.uid() or v.ontvanger_id = auth.uid())
  order by g.gebruikersnaam;
$$;

revoke execute on function public.vriendenlijst() from anon, public;
grant execute on function public.vriendenlijst() to authenticated;;
