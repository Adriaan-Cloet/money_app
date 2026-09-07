import { useCallback, useSyncExternalStore } from 'react'
import { onlineManager, useQueryClient } from '@tanstack/react-query'

// Offline is enkel lezen. Schrijven blijft online-only, met een melding in
// plaats van een wachtrij (beslissing van 6 september 2026).
export class GeenVerbindingFout extends Error {
  constructor() {
    super('Geen verbinding. Dit lukt pas als je weer online bent.')
    this.name = 'GeenVerbindingFout'
  }
}

// Elke mutatie begint hiermee. React Query zou een schrijfactie zonder
// verbinding uit zichzelf pauzeren en later alsnog uitvoeren, en dat is precies
// de wachtrij die we niet willen: die vraagt idempotentie en conflictafhandeling.
// Daarom staat networkMode op 'always' en weigeren we hier zelf, meteen en
// zichtbaar.
export function vereisVerbinding() {
  if (!onlineManager.isOnline()) throw new GeenVerbindingFout()
}

// Let op: supabase-js geeft bij een mislukte oproep een plat object terug, geen
// echte Error en geen PostgrestError-instantie. instanceof werkt daar dus niet
// op, vandaar dat we naar de velden kijken.
//
// Het onderscheid dat we nodig hebben: postgrest-js vangt een mislukte fetch op
// en maakt daar een fout van met een lege code. Een echt antwoord van de
// database heeft altijd een code, zoals '23505' bij een dubbele naam of
// 'PGRST116' als er geen rij is. Geen code betekent dus: er is nooit een
// deftig antwoord binnengekomen. Dat dekt zowel een weggevallen netwerk als een
// gepauzeerd Supabase-project, dat een foutpagina zonder code teruggeeft.
export function isOnbereikbaar(fout: unknown): boolean {
  if (fout instanceof GeenVerbindingFout) return true
  if (typeof fout !== 'object' || fout === null) return false
  const code = (fout as { code?: unknown }).code
  return code === undefined || code === ''
}

// navigator.onLine, maar via de onlineManager van React Query. Zo kijken de
// banner en de queries naar exact dezelfde bron: er kan geen scherm "offline"
// tonen terwijl React Query intussen wel aan het ophalen is.
export function useIsOnline() {
  return useSyncExternalStore(
    (herteken) => onlineManager.subscribe(herteken),
    () => onlineManager.isOnline(),
    () => true,
  )
}

function useCacheAbonnement() {
  const queryClient = useQueryClient()
  // Met useCallback, anders zou useSyncExternalStore zich bij elke render
  // opnieuw abonneren.
  return useCallback(
    (herteken: () => void) => queryClient.getQueryCache().subscribe(herteken),
    [queryClient],
  )
}

// Wanneer we voor het laatst verse data van de server kregen. Dit tijdstip
// overleeft een herstart, want het wordt mee bewaard in IndexedDB.
export function useLaatstBijgewerkt(): number | null {
  const queryClient = useQueryClient()
  const abonneer = useCacheAbonnement()

  // useSyncExternalStore vergelijkt de teruggegeven waarde met de vorige, dus
  // die moet een getal of null zijn. Een nieuw object per keer zou een
  // eindeloze lus geven.
  return useSyncExternalStore(abonneer, () => {
    let nieuwste = 0
    for (const query of queryClient.getQueryCache().getAll()) {
      if (query.state.status === 'success' && query.state.dataUpdatedAt > nieuwste) {
        nieuwste = query.state.dataUpdatedAt
      }
    }
    return nieuwste === 0 ? null : nieuwste
  })
}

// Je bent online volgens de browser, maar de server antwoordt niet. Zo voelt een
// gepauzeerd Supabase-project hetzelfde aan als offline in plaats van als een
// scherm vol fouten.
export function useServerOnbereikbaar() {
  const queryClient = useQueryClient()
  const abonneer = useCacheAbonnement()

  return useSyncExternalStore(abonneer, () =>
    queryClient
      .getQueryCache()
      .getAll()
      .some((query) => query.state.status === 'error' && isOnbereikbaar(query.state.error)),
  )
}
