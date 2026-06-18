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

// Een terugvraag tegen een lokaal contact (zelfbeheer door de eigenaar).
// De echte-gebruiker-variant volgt zodra de discovery-flow beslist is.
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
