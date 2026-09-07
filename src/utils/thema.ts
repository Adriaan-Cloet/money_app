import { useState } from 'react'

export type Thema = 'licht' | 'donker' | 'systeem'

// Zelfde sleutel als in het scriptje in index.html. Wijzigt die hier, wijzig
// hem daar ook, anders staat de app bij het opstarten in het verkeerde thema.
export const THEMA_SLEUTEL = 'paymeback:thema'

export const THEMA_LABEL: Record<Thema, string> = {
  licht: 'Licht',
  donker: 'Donker',
  systeem: 'Systeem',
}

const isThema = (waarde: unknown): waarde is Thema =>
  waarde === 'licht' || waarde === 'donker' || waarde === 'systeem'

// Alles rond localStorage staat in een try: in een privevenster of met
// geblokkeerde site-data gooit al het lezen ervan.
export function leesThema(): Thema {
  try {
    const bewaard = localStorage.getItem(THEMA_SLEUTEL)
    return isThema(bewaard) ? bewaard : 'systeem'
  } catch {
    return 'systeem'
  }
}

const systeemVraagtDonker = () => window.matchMedia('(prefers-color-scheme: dark)').matches

export const isDonker = (thema: Thema) =>
  thema === 'donker' || (thema === 'systeem' && systeemVraagtDonker())

// De klasse op <html> is het enige wat de CSS ziet; alle kleuren hangen eraan.
export function pasThemaToe(thema: Thema) {
  document.documentElement.classList.toggle('donker', isDonker(thema))
}

export function bewaarThema(thema: Thema) {
  try {
    localStorage.setItem(THEMA_SLEUTEL, thema)
  } catch {
    // Niets kunnen bewaren is geen reden om de keuze nu niet toe te passen.
  }
  pasThemaToe(thema)
}

// Bij het opstarten een keer aanroepen, vanuit main.tsx. Het scriptje in
// index.html zet de klasse al voor de eerste tekening; dit hangt er de luister
// aan zodat de app meevolgt als het systeem tijdens het gebruik omschakelt.
// Dat moet buiten React, want anders zou het enkel werken zolang de
// instellingenpagina open staat.
export function startThema() {
  pasThemaToe(leesThema())
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (leesThema() === 'systeem') pasThemaToe('systeem')
  })
}

// Voor de instellingenpagina. De keuze wordt meteen bewaard en toegepast; er is
// geen "opslaan"-knop, want je ziet het resultaat achter de modal al gebeuren.
export function useThema() {
  const [thema, setThema] = useState<Thema>(leesThema)

  function kies(nieuw: Thema) {
    bewaarThema(nieuw)
    setThema(nieuw)
  }

  return { thema, kies }
}
