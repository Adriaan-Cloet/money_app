// supabase-js gooit geen fout maar geeft altijd { data, error } terug. React
// Query kijkt net naar een gegooide fout om te weten dat een query mislukt is.
// Zonder dit tussenstukje zou een gepauzeerd Supabase-project dus als een
// geslaagde query met `null` binnenkomen, en zou de offline-banner uit stap 4
// nooit verschijnen.
type Antwoord<T> = { data: T; error: null } | { data: null; error: Error }

export async function ontpak<T>(belofte: PromiseLike<Antwoord<T>>): Promise<T> {
  const { data, error } = await belofte
  if (error) throw error
  return data
}

// Een delete die door RLS geweigerd wordt, geeft geen fout: er verdwijnen enkel
// 0 rijen. Daarom vraagt de servicelaag de verwijderde rijen op met .select() en
// controleren we hier of er echt iets weg is. Zonder dit meldt het scherm
// "gelukt" terwijl de rij gewoon blijft staan.
export async function ontpakVerwijderd<T>(
  belofte: PromiseLike<Antwoord<T[]>>,
  reden: string,
): Promise<void> {
  const rijen = await ontpak(belofte)
  if (rijen.length === 0) throw new Error(reden)
}
