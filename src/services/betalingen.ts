import { supabase } from './supabase'
import type { Tables, TablesInsert } from '../models/database.types'

export type Betaling = Tables<'betalingen'>

// De schuldenaar (echte gebruiker) meldt een betaling met een vrij bedrag aan de ontvanger.
export async function maakBetaling(betalerId: string, ontvangerId: string, bedrag: number) {
  const nieuw: TablesInsert<'betalingen'> = {
    betaler_gebruiker_id: betalerId,
    ontvanger_id: ontvangerId,
    bedrag,
  }
  return supabase.from('betalingen').insert(nieuw).select().single()
}

// Betalingen die deze vriend aan mij meldde (ik ben ontvanger).
export async function haalInkomendeBetalingen(meId: string, vriendId: string) {
  return supabase
    .from('betalingen')
    .select('*')
    .eq('ontvanger_id', meId)
    .eq('betaler_gebruiker_id', vriendId)
    .order('aangemaakt_op', { ascending: false })
}

// Betalingen die ik aan deze vriend meldde (ik ben betaler).
export async function haalUitgaandeBetalingen(meId: string, vriendId: string) {
  return supabase
    .from('betalingen')
    .select('*')
    .eq('betaler_gebruiker_id', meId)
    .eq('ontvanger_id', vriendId)
    .order('aangemaakt_op', { ascending: false })
}

// Al mijn betalingen (als betaler of ontvanger), voor de voorlopige verrekening op het dashboard.
export async function haalMijnBetalingen(meId: string) {
  return supabase
    .from('betalingen')
    .select('*')
    .or(`betaler_gebruiker_id.eq.${meId},ontvanger_id.eq.${meId}`)
}

// Ontvanger bevestigt -> FIFO-toewijzing (database-functie).
export async function bevestigBetaling(betalingId: string) {
  return supabase.rpc('bevestig_betaling', { p_betaling_id: betalingId })
}

// Eigenaar registreert zelf een betaling van een lokaal contact (auto-bevestigd + FIFO).
export async function registreerContactbetaling(contactId: string, bedrag: number) {
  return supabase.rpc('registreer_contactbetaling', { p_contact_id: contactId, p_bedrag: bedrag })
}

// Ontvanger zet een gemelde betaling op 'wacht' of 'fout' (RLS: enkel de ontvanger).
export async function zetBetalingStatus(betalingId: string, status: 'wacht' | 'fout') {
  return supabase.from('betalingen').update({ status }).eq('id', betalingId)
}
