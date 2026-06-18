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
