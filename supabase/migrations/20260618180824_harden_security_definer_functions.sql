-- Voorkom dat deze SECURITY DEFINER-functies los via de Data API (anon/authenticated) oproepbaar zijn.
-- De trigger blijft werken: triggeruitvoering hangt niet af van EXECUTE-rechten van de API-rollen.
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.rls_auto_enable() from anon, authenticated, public;;
