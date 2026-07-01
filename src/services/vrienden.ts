import { supabase } from './supabase'

// Zoek een gebruiker op exacte gebruikersnaam (geeft enkel id + naam).
export async function zoekGebruiker(gebruikersnaam: string) {
  return supabase.rpc('zoek_gebruiker', { p_naam: gebruikersnaam })
}

export async function stuurVriendschapsverzoek(verzoekerId: string, ontvangerId: string) {
  return supabase
    .from('vriendschappen')
    .insert({ verzoeker_id: verzoekerId, ontvanger_id: ontvangerId })
}

export async function haalInkomendeVerzoeken() {
  return supabase.rpc('inkomende_verzoeken')
}

export async function haalVrienden() {
  return supabase.rpc('vriendenlijst')
}

export async function aanvaardVerzoek(vriendschapId: string) {
  return supabase.from('vriendschappen').update({ status: 'aanvaard' }).eq('id', vriendschapId)
}

// Voor weigeren van een (nog niet aanvaard) verzoek: gewoon de rij weg.
// Er zijn dan nog geen transacties, dus een simpele delete volstaat.
export async function verwijderVriendschap(vriendschapId: string) {
  return supabase.from('vriendschappen').delete().eq('id', vriendschapId)
}

// Ontvrienden van een bestaande vriend: wist eerst alle schuldposten en
// betalingen tussen jullie en dan de vriendschap. Via een security-definer
// RPC, want door RLS mag je de posten van de tegenpartij niet zelf verwijderen.
export async function ontvriend(vriendschapId: string) {
  return supabase.rpc('ontvriend', { p_vriendschap_id: vriendschapId })
}
