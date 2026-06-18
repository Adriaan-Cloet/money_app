import { supabase } from './supabase'
import type { Tables, TablesInsert } from '../models/database.types'

export type LokaalContact = Tables<'lokale_contacten'>

// RLS zorgt dat je enkel je eigen contacten terugkrijgt en wijzigt.
export async function haalLokaleContacten() {
  return supabase.from('lokale_contacten').select('*').order('naam', { ascending: true })
}

export async function maakLokaalContact(naam: string, eigenaarId: string) {
  const nieuw: TablesInsert<'lokale_contacten'> = { naam, eigenaar_id: eigenaarId }
  return supabase.from('lokale_contacten').insert(nieuw).select().single()
}

export async function wijzigLokaalContact(id: string, naam: string) {
  return supabase.from('lokale_contacten').update({ naam }).eq('id', id).select().single()
}

export async function verwijderLokaalContact(id: string) {
  return supabase.from('lokale_contacten').delete().eq('id', id)
}
