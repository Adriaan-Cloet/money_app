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
