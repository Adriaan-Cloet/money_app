create unique index lokale_contacten_eigenaar_naam_uniek
on public.lokale_contacten (eigenaar_id, lower(naam));;
