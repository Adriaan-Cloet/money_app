-- Tabel met app-data per gebruiker, gekoppeld aan de ingebouwde auth.users
create table public.gebruikers (
  id uuid primary key references auth.users(id) on delete cascade,
  naam text,
  email text,
  aangemaakt_op timestamptz not null default now()
);

-- Maakt automatisch een rij in public.gebruikers aan zodra iemand registreert
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.gebruikers (id, naam, email)
  values (new.id, new.raw_user_meta_data ->> 'naam', new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Row Level Security: enkel je eigen profiel zien en bewerken
alter table public.gebruikers enable row level security;

create policy "gebruiker ziet eigen profiel"
on public.gebruikers for select
using (auth.uid() = id);

create policy "gebruiker bewerkt eigen profiel"
on public.gebruikers for update
using (auth.uid() = id)
with check (auth.uid() = id);;
