import { QueryClient } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { get, set, del } from 'idb-keyval'

// Hoe lang gecachte data bewaard blijft. Dit is de kern van "offline lezen":
// zonder dit gooit React Query een query weg zodra geen enkel scherm ze nog
// gebruikt, en dan sta je bij een herstart zonder verbinding alsnog voor een
// leeg scherm.
const WEEK = 1000 * 60 * 60 * 24 * 7

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // gcTime moet minstens even lang zijn als maxAge hieronder. Staat hij
      // korter, dan ruimt React Query de data op vlak na het terugzetten uit
      // IndexedDB en was het persisteren voor niets.
      gcTime: WEEK,

      // Na 10 seconden geldt data als verouderd. Kort genoeg om bij het
      // terugkeren naar de app verse cijfers te halen, lang genoeg om niet bij
      // elk tabje wisselen opnieuw te bevragen.
      staleTime: 10_000,

      // De twee momenten waarop we verse data willen: je komt terug in de app,
      // of je verbinding is terug. Refetch bij focus is meteen de oplossing
      // voor "je ziet wijzigingen pas na een harde reload".
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,

      // Eén nieuwe poging volstaat. Bij een gepauzeerd Supabase-project willen
      // we snel in de foutstatus staan, want daar hangt de banner aan vast.
      // Blijven proberen zou de banner seconden lang uitstellen.
      retry: 1,
    },
    mutations: {
      // Schrijfacties nooit stil opnieuw proberen. De beslissing van 6 september
      // is dat schrijven online-only blijft, met een duidelijke melding.
      retry: false,

      // Standaard pauzeert React Query een mutatie zonder verbinding en voert
      // ze later alsnog uit. Dat is een wachtrij, en die willen we niet.
      // 'always' laat de mutatie gewoon lopen; vereisVerbinding() in de
      // mutatiefunctie weigert dan meteen met een leesbare melding.
      networkMode: 'always',
    },
  },
})

const CACHE_SLEUTEL = 'paymeback-query-cache'

// React Query verwacht een opslag met getItem/setItem/removeItem. idb-keyval
// levert net die drie bewerkingen op IndexedDB. localStorage kon ook, maar dat
// is synchroon en beperkt tot ongeveer 5 MB.
export const persister = createAsyncStoragePersister({
  key: CACHE_SLEUTEL,
  storage: {
    getItem: (sleutel) => get(sleutel).then((waarde) => waarde ?? null),
    setItem: (sleutel, waarde) => set(sleutel, waarde),
    removeItem: (sleutel) => del(sleutel),
  },
})

// Verhoog dit nummer als de vorm van de gecachte data wijzigt. Alles wat onder
// een oud nummer bewaard is, wordt dan genegeerd in plaats van verkeerd getoond.
export const CACHE_VERSIE = 'v1'

export const CACHE_MAX_LEEFTIJD = WEEK

// Bij uitloggen moet alles weg. De cache overleeft nu een herstart, dus zonder
// dit ziet de volgende gebruiker op hetzelfde toestel de bedragen van de vorige.
export async function wisCache() {
  queryClient.clear()
  await del(CACHE_SLEUTEL)
}

// Wie de cache is, houden we los bij in localStorage. Dat moet apart, want we
// moeten het al weten voor we de cache tonen, en het moet leesbaar zijn zonder
// eerst heel IndexedDB in te lezen.
const EIGENAAR_SLEUTEL = 'paymeback-cache-eigenaar'

// Enkel wissen bij uitloggen is niet genoeg. Wordt de app gekilld tijdens het
// uitloggen, of logt iemand anders in op hetzelfde toestel, dan staat de cache
// van de vorige gebruiker er bij de start nog. Daarom bij elke sessiewijziging
// vergelijken wie de cache is met wie er nu ingelogd is.
export async function bewaakCacheEigenaar(gebruikerId: string | null) {
  if (localStorage.getItem(EIGENAAR_SLEUTEL) === gebruikerId) return

  await wisCache()

  if (gebruikerId) localStorage.setItem(EIGENAAR_SLEUTEL, gebruikerId)
  else localStorage.removeItem(EIGENAAR_SLEUTEL)
}
