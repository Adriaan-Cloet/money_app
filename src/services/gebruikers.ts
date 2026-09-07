import { supabase } from './supabase'

// Filter op je eigen id: vrienden-profielen zijn nu ook zichtbaar, dus zonder
// filter zou single() over meerdere rijen struikelen.
export async function haalMijnGebruikersnaam(userId: string) {
  return supabase.from('gebruikers').select('gebruikersnaam').eq('id', userId).single()
}

// De unieke index op lower(gebruikersnaam) is de echte bewaker; een vrij-check
// vooraf is enkel om een nettere melding te kunnen tonen.
export async function wijzigGebruikersnaam(userId: string, gebruikersnaam: string) {
  return supabase.from('gebruikers').update({ gebruikersnaam }).eq('id', userId).select().single()
}
