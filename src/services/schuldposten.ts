import { supabase } from './supabase'
import type { Tables, TablesInsert } from '../models/database.types'

export type Schuldpost = Tables<'schuldposten'>

// Alle posten waarvan jij de schuldeiser bent (mensen die jou nog geld moeten).
export async function haalSchuldpostenAlsSchuldeiser(userId: string) {
  return supabase
    .from('schuldposten')
    .select('*')
    .eq('schuldeiser_id', userId)
    .order('datum', { ascending: false })
}

// Alle posten van 1 lokaal contact (RLS beperkt tot je eigen posten).
export async function haalSchuldpostenVoorContact(contactId: string) {
  return supabase
    .from('schuldposten')
    .select('*')
    .eq('schuldenaar_contact_id', contactId)
    .order('datum', { ascending: false })
}

// Alle posten tegen 1 vriend (echte gebruiker) waarvan jij de schuldeiser bent.
export async function haalSchuldpostenVoorGebruiker(schuldeiserId: string, gebruikerId: string) {
  return supabase
    .from('schuldposten')
    .select('*')
    .eq('schuldeiser_id', schuldeiserId)
    .eq('schuldenaar_gebruiker_id', gebruikerId)
    .order('datum', { ascending: false })
}

// Een terugvraag tegen een echte gebruiker (vriend). RLS dwingt af dat het een vriend is.
export async function maakSchuldpostVoorGebruiker(params: {
  schuldeiserId: string
  schuldenaarGebruikerId: string
  bedrag: number
  omschrijving: string | null
  datum: string
}) {
  const nieuw: TablesInsert<'schuldposten'> = {
    schuldeiser_id: params.schuldeiserId,
    schuldenaar_gebruiker_id: params.schuldenaarGebruikerId,
    bedrag: params.bedrag,
    omschrijving: params.omschrijving,
    datum: params.datum,
  }
  return supabase.from('schuldposten').insert(nieuw).select().single()
}

// Een terugvraag tegen een lokaal contact (zelfbeheer door de eigenaar).
export async function maakSchuldpostVoorContact(params: {
  schuldeiserId: string
  schuldenaarContactId: string
  bedrag: number
  omschrijving: string | null
  datum: string
}) {
  const nieuw: TablesInsert<'schuldposten'> = {
    schuldeiser_id: params.schuldeiserId,
    schuldenaar_contact_id: params.schuldenaarContactId,
    bedrag: params.bedrag,
    omschrijving: params.omschrijving,
    datum: params.datum,
  }
  return supabase.from('schuldposten').insert(nieuw).select().single()
}
