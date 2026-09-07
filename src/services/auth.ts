import { supabase } from './supabase'

// Registreren met e-mail + wachtwoord. De gebruikersnaam gaat mee als metadata;
// de database-trigger zet die in de tabel `gebruikers`.
export async function registreer(email: string, wachtwoord: string, gebruikersnaam: string) {
  return supabase.auth.signUp({
    email,
    password: wachtwoord,
    options: { data: { gebruikersnaam } },
  })
}

// Dezelfde regel bij registreren als bij wijzigen. Stond eerder los in Auth.tsx;
// zonder een gedeelde plek zou je jezelf via Instellingen een naam kunnen geven
// die je bij registratie niet had gekregen.
export const GEBRUIKERSNAAM_PATROON = /^[A-Za-z0-9_]{3,20}$/
export const GEBRUIKERSNAAM_UITLEG = 'Gebruikersnaam: 3-20 tekens, enkel letters, cijfers en _.'

// Checkt vooraf of een gebruikersnaam nog vrij is (database-functie, geeft true/false).
export async function gebruikersnaamVrij(gebruikersnaam: string) {
  return supabase.rpc('is_gebruikersnaam_vrij', { p_naam: gebruikersnaam })
}

export async function login(email: string, wachtwoord: string) {
  return supabase.auth.signInWithPassword({ email, password: wachtwoord })
}

export async function logout() {
  return supabase.auth.signOut()
}

// Supabase stuurt een bevestigingsmail naar het nieuwe adres. Het adres wijzigt
// pas als die link aangeklikt is, dus na deze oproep staat er in de sessie nog
// altijd het oude.
export async function wijzigEmail(email: string) {
  return supabase.auth.updateUser({ email })
}

export async function wijzigWachtwoord(wachtwoord: string) {
  return supabase.auth.updateUser({ password: wachtwoord })
}
