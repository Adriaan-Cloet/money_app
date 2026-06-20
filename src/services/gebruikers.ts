import { supabase } from './supabase'

// Filter op je eigen id: vrienden-profielen zijn nu ook zichtbaar, dus zonder
// filter zou single() over meerdere rijen struikelen.
export async function haalMijnGebruikersnaam(userId: string) {
  return supabase.from('gebruikers').select('gebruikersnaam').eq('id', userId).single()
}
