-- 1. Kolom toevoegen (eerst nullable om bestaande rijen te kunnen vullen)
alter table public.gebruikers add column gebruikersnaam text;

-- 2. Bestaande accounts een voorlopige unieke naam geven
update public.gebruikers
set gebruikersnaam = 'gebruiker_' || left(id::text, 8)
where gebruikersnaam is null;

-- 3. Verplicht maken en uniek afdwingen (hoofdletter-ongevoelig)
alter table public.gebruikers alter column gebruikersnaam set not null;

create unique index gebruikers_gebruikersnaam_uniek
on public.gebruikers (lower(gebruikersnaam));

-- 4. Registratie-trigger uitbreiden zodat de gebruikersnaam mee opgeslagen wordt
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.gebruikers (id, naam, gebruikersnaam, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'naam',
    new.raw_user_meta_data ->> 'gebruikersnaam',
    new.email
  );
  return new;
end;
$$;

-- 5. Functie om vooraf te checken of een gebruikersnaam vrij is (mag publiek, geeft enkel true/false)
create or replace function public.is_gebruikersnaam_vrij(p_naam text)
returns boolean
language sql
security definer set search_path = ''
stable
as $$
  select not exists (
    select 1 from public.gebruikers where lower(gebruikersnaam) = lower(p_naam)
  );
$$;

grant execute on function public.is_gebruikersnaam_vrij(text) to anon, authenticated;;
