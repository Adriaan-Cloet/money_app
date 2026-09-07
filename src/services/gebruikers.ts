import { supabase } from './supabase'

// Filter op je eigen id: vrienden-profielen zijn nu ook zichtbaar, dus zonder
// filter zou single() over meerdere rijen struikelen.
export async function haalMijnProfiel(userId: string) {
  return supabase
    .from('gebruikers')
    .select('gebruikersnaam, iban, rekeninghouder')
    .eq('id', userId)
    .single()
}

// De unieke index op lower(gebruikersnaam) is de echte bewaker; een vrij-check
// vooraf is enkel om een nettere melding te kunnen tonen.
export async function wijzigGebruikersnaam(userId: string, gebruikersnaam: string) {
  return supabase.from('gebruikers').update({ gebruikersnaam }).eq('id', userId).select().single()
}

// De twee velden gaan samen weg of samen mee: een rekeninghouder zonder nummer
// zegt niets. Leeg wordt null en niet een lege tekst, anders zou de
// vorm-constraint in de database erover vallen.
export async function wijzigBetaalgegevens(
  userId: string,
  iban: string | null,
  rekeninghouder: string | null,
) {
  return supabase
    .from('gebruikers')
    .update({ iban, rekeninghouder })
    .eq('id', userId)
    .select()
    .single()
}
