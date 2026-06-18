import { supabase } from './supabase'

// Registreren met e-mail + wachtwoord. De naam gaat mee als metadata;
// de database-trigger zet die in de tabel `gebruikers`.
export async function registreer(email: string, wachtwoord: string, naam: string) {
  return supabase.auth.signUp({
    email,
    password: wachtwoord,
    options: { data: { naam } },
  })
}

export async function login(email: string, wachtwoord: string) {
  return supabase.auth.signInWithPassword({ email, password: wachtwoord })
}

export async function logout() {
  return supabase.auth.signOut()
}
