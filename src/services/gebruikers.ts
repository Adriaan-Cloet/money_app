import { supabase } from './supabase'

// RLS geeft enkel je eigen rij terug, dus single() haalt jouw profiel op.
export async function haalMijnGebruikersnaam() {
  return supabase.from('gebruikers').select('gebruikersnaam').single()
}
