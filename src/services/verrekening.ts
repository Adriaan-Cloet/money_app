import type { Tables } from '../models/database.types'

// Alleen de velden die de verrekening nodig heeft. Twee redenen: een test hoeft
// geen volledige databaserij van 13 velden na te bouwen, en dit bestand sleept
// de Supabase-client niet mee (schuldposten.ts doet dat wel, en die gooit een
// fout zonder env-variabelen). Via Pick blijft het wel vastgeklonken aan het
// schema, dus een hernoemde kolom valt door de typecheck.
export type PostVoorVerrekening = Pick<
  Tables<'schuldposten'>,
  'status' | 'bedrag' | 'gedekt_bedrag'
>

export type BetalingVoorVerrekening = Pick<Tables<'betalingen'>, 'status' | 'bedrag'>

// Wat er van een schuldpost nog openstaat.
// Betaald en geweigerd tellen niet mee, ongeacht wat er gedekt is.
export const openstaand = (post: PostVoorVerrekening) =>
  post.status === 'betaald' || post.status === 'geweigerd' ? 0 : post.bedrag - post.gedekt_bedrag

export const somOpenstaand = (posten: PostVoorVerrekening[]) =>
  posten.reduce((som, post) => som + openstaand(post), 0)

// Een gemelde betaling is nog niet bevestigd door de ontvanger. 'wacht' is
// hetzelfde geval: de ontvanger heeft ze gezien maar nog niet aanvaard.
export const isOnbevestigd = (betaling: BetalingVoorVerrekening) =>
  betaling.status === 'gemeld' || betaling.status === 'wacht'

export const somOnbevestigd = (betalingen: BetalingVoorVerrekening[]) =>
  betalingen.filter(isOnbevestigd).reduce((som, betaling) => som + betaling.bedrag, 0)

// Het saldo met een vriend. Positief betekent dat jij nog geld krijgt.
export function saldoMetVriend(invoer: {
  zijMoetenJou: PostVoorVerrekening[]
  jijMoetHen: PostVoorVerrekening[]
  uitgaand: BetalingVoorVerrekening[]
  inkomend: BetalingVoorVerrekening[]
}) {
  return (
    somOpenstaand(invoer.zijMoetenJou) -
    somOpenstaand(invoer.jijMoetHen) +
    somOnbevestigd(invoer.uitgaand) -
    // US-021 haalt deze regel weg. Een onbevestigde betaling hoort enkel het
    // saldo van de betaler te verlagen; voor de ontvanger blijft de schuld open
    // tot hij bevestigt. Nu wordt ze aan beide kanten verrekend, waardoor de
    // ander van je home-scherm verdwijnt. Bewust nog niet gewijzigd: US-020
    // verhuist alleen, het verandert geen gedrag.
    somOnbevestigd(invoer.inkomend)
  )
}

// Voor het home-scherm is per post ook nodig wie de tegenpartij is.
export type PostVoorNetting = PostVoorVerrekening &
  Pick<
    Tables<'schuldposten'>,
    'schuldeiser_id' | 'schuldenaar_contact_id' | 'schuldenaar_gebruiker_id'
  >

export type BetalingVoorNetting = BetalingVoorVerrekening &
  Pick<Tables<'betalingen'>, 'betaler_gebruiker_id' | 'ontvanger_id'>

// Eén regel op het home-scherm: wat je per persoon nog krijgt (positief) of moet (negatief).
export type Regel = { type: 'contact' | 'vriend'; id: string; naam: string; bedrag: number }

const ONBEKEND = 'Onbekend'

// Bedragen hieronder zijn afrondingsruis van de centenberekening, geen schuld.
const RUIS = 0.001

// Zet alle posten en betalingen om in één regel per persoon, gesaldeerd.
// Wie op nul uitkomt, valt weg.
export function regelsPerPersoon(invoer: {
  mij: string
  contacten: { id: string; naam: string }[]
  vrienden: { gebruiker_id: string; gebruikersnaam: string }[]
  alsSchuldeiser: PostVoorNetting[]
  alsSchuldenaar: PostVoorNetting[]
  betalingen: BetalingVoorNetting[]
}): Regel[] {
  const naamPerContact = new Map(invoer.contacten.map((c) => [c.id, c.naam]))
  const naamPerVriend = new Map(invoer.vrienden.map((v) => [v.gebruiker_id, v.gebruikersnaam]))

  const net = new Map<string, Regel>()
  const tel = (type: Regel['type'], id: string, naam: string, delta: number) => {
    const sleutel = `${type}:${id}`
    const huidig = net.get(sleutel)
    net.set(sleutel, { type, id, naam, bedrag: (huidig?.bedrag ?? 0) + delta })
  }

  // Wat anderen jou nog moeten, telt op.
  for (const post of invoer.alsSchuldeiser) {
    if (post.schuldenaar_contact_id) {
      const id = post.schuldenaar_contact_id
      tel('contact', id, naamPerContact.get(id) ?? ONBEKEND, openstaand(post))
    } else if (post.schuldenaar_gebruiker_id) {
      const id = post.schuldenaar_gebruiker_id
      tel('vriend', id, naamPerVriend.get(id) ?? ONBEKEND, openstaand(post))
    }
  }

  // Wat jij anderen moet, trekt af.
  for (const post of invoer.alsSchuldenaar) {
    const id = post.schuldeiser_id
    tel('vriend', id, naamPerVriend.get(id) ?? ONBEKEND, -openstaand(post))
  }

  for (const betaling of invoer.betalingen) {
    if (!isOnbevestigd(betaling)) continue
    if (betaling.betaler_gebruiker_id === invoer.mij) {
      const id = betaling.ontvanger_id
      tel('vriend', id, naamPerVriend.get(id) ?? ONBEKEND, betaling.bedrag)
    } else if (betaling.ontvanger_id === invoer.mij && betaling.betaler_gebruiker_id) {
      // US-021 haalt deze tak weg. Zolang jij als ontvanger niet bevestigd hebt,
      // hoort de schuld open te blijven staan. Nu zakt de regel naar nul en
      // verdwijnt de persoon van je home-scherm door de RUIS-filter hieronder.
      // Bewust nog niet gewijzigd: US-020 verhuist alleen, het verandert niets.
      const id = betaling.betaler_gebruiker_id
      tel('vriend', id, naamPerVriend.get(id) ?? ONBEKEND, -betaling.bedrag)
    }
  }

  return [...net.values()]
    .filter((regel) => Math.abs(regel.bedrag) > RUIS)
    .sort((a, b) => b.bedrag - a.bedrag)
}

export const totaalKrijgt = (regels: Regel[]) =>
  regels.filter((r) => r.bedrag > 0).reduce((som, r) => som + r.bedrag, 0)

export const totaalMoet = (regels: Regel[]) =>
  regels.filter((r) => r.bedrag < 0).reduce((som, r) => som - r.bedrag, 0)
