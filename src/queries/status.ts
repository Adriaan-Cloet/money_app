// Elke pagina staat voor dezelfde vraag: er is nog geen data, wat zet je dan op
// het scherm? Vroeger was dat overal `laden ? 'Laden...' : ...`, maar met een
// cache die offline blijft staan zijn er meer gevallen dan twee.
//
// De regel die alles stuurt: is er data, dan tonen we die. Ook oude data uit de
// cache, ook terwijl een verversing loopt of net mislukt is. Een lijst van
// gisteren is bruikbaarder dan een foutmelding.
type QueryToestand = {
  data: unknown
  fetchStatus: 'fetching' | 'paused' | 'idle'
  isError: boolean
}

// Geeft de tekst die in de plaats van de lijst komt, of null als er data is.
export function legeStatusTekst(query: QueryToestand): string | null {
  if (query.data !== undefined) return null

  // 'paused' betekent: React Query wil ophalen maar je bent offline. Er is ook
  // niets bewaard, dus hier valt echt niets te tonen. De banner erboven legt
  // al uit waarom.
  if (query.fetchStatus === 'paused') return 'Niets bewaard om offline te tonen.'

  if (query.fetchStatus === 'fetching') return 'Laden...'
  if (query.isError) return 'Laden mislukt.'

  // Idle zonder data en zonder fout: de query staat uit, bijvoorbeeld omdat er
  // nog geen gebruiker bekend is.
  return 'Laden...'
}
