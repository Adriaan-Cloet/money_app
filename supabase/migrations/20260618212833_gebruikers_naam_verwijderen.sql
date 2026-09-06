-- Weergavenaam vervalt: we werken enkel met de unieke gebruikersnaam.
alter table public.gebruikers drop column naam;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.gebruikers (id, gebruikersnaam, email)
  values (new.id, new.raw_user_meta_data ->> 'gebruikersnaam', new.email);
  return new;
end;
$$;;
