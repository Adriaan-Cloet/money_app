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

// Een gemelde betaling is nog niet bevestigd door de ontvanger. Blijft in dat
// geval staan tot ze bevestigd of fout gemeld wordt; er is geen tussenstatus
// meer om "wachten" mee uit te drukken (US-021).
export const isOnbevestigd = (betaling: BetalingVoorVerrekening) => betaling.status === 'gemeld'

export const somOnbevestigd = (betalingen: BetalingVoorVerrekening[]) =>
  betalingen.filter(isOnbevestigd).reduce((som, betaling) => som + betaling.bedrag, 0)

// Het saldo met een vriend. Positief betekent dat jij nog geld krijgt.
export function saldoMetVriend(invoer: {
  zijMoetenJou: PostVoorVerrekening[]
  jijMoetHen: PostVoorVerrekening[]
  uitgaand: BetalingVoorVerrekening[]
  inkomend: BetalingVoorVerrekening[]
}) {
  // Let op de asymmetrie: `uitgaand` telt mee, `inkomend` niet. Een melding die
  // jij deed mag je eigen schuld meteen verlagen, want jij weet dat je betaald
  // hebt. Een melding van de tegenpartij is voor jou nog maar een bewering; die
  // schuld blijft volledig open tot jij ze bevestigt (US-021).
  return (
    somOpenstaand(invoer.zijMoetenJou) -
    somOpenstaand(invoer.jijMoetHen) +
    somOnbevestigd(invoer.uitgaand)
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

// Eén regel op het home-scherm: wat je per persoon nog krijgt (positief) of
// moet (negatief), plus wat er tussen jullie nog op een beslissing wacht.
export type Regel = {
  type: 'contact' | 'vriend'
  id: string
  naam: string
  bedrag: number
  // Hoeveel betalingen deze persoon meldde die jij nog moet bevestigen.
  teBevestigen: number
  // Jij meldde zelf een betaling waar zij nog niets mee deden.
  wachtOpBevestiging: boolean
}

// Een persoon met een openstaande actie hoort op home te blijven staan, ook als
// zijn saldo op nul uitkomt. Anders verdwijnt de vriend van je scherm net
// wanneer er iets van jou verwacht wordt (US-021).
const heeftActie = (regel: Regel) => regel.teBevestigen > 0 || regel.wachtOpBevestiging

export const ONBEKEND = 'Onbekend'

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

  // Haalt de regel van deze persoon op, of begint er een. De aanroeper past
  // daarna aan wat hij weet: een bedrag, of een openstaande actie.
  const regelVan = (type: Regel['type'], id: string, naam: string) => {
    const sleutel = `${type}:${id}`
    let regel = net.get(sleutel)
    if (!regel) {
      regel = { type, id, naam, bedrag: 0, teBevestigen: 0, wachtOpBevestiging: false }
      net.set(sleutel, regel)
    }
    return regel
  }

  const tel = (type: Regel['type'], id: string, naam: string, delta: number) => {
    regelVan(type, id, naam).bedrag += delta
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
    // Enkel jouw eigen meldingen verlagen wat jij nog moet. Meldingen van de
    // tegenpartij laten het bedrag staan tot jij bevestigt; die zie je terug in
    // het blok "Te bevestigen" (US-021).
    if (betaling.betaler_gebruiker_id === invoer.mij) {
      const id = betaling.ontvanger_id
      const regel = regelVan('vriend', id, naamPerVriend.get(id) ?? ONBEKEND)
      regel.bedrag += betaling.bedrag
      regel.wachtOpBevestiging = true
    } else if (betaling.ontvanger_id === invoer.mij && betaling.betaler_gebruiker_id) {
      const id = betaling.betaler_gebruiker_id
      regelVan('vriend', id, naamPerVriend.get(id) ?? ONBEKEND).teBevestigen += 1
    }
  }

  return [...net.values()]
    .filter((regel) => Math.abs(regel.bedrag) > RUIS || heeftActie(regel))
    .sort((a, b) => b.bedrag - a.bedrag)
}

// Rond nul: er staat niets meer open tussen jullie. De regel hangt er dan enkel
// nog omdat er een actie loopt, dus hoort er geen plus of min bij.
export const isVereffend = (regel: Regel) => Math.abs(regel.bedrag) <= RUIS

export const totaalKrijgt = (regels: Regel[]) =>
  regels.filter((r) => r.bedrag > 0).reduce((som, r) => som + r.bedrag, 0)

export const totaalMoet = (regels: Regel[]) =>
  regels.filter((r) => r.bedrag < 0).reduce((som, r) => som - r.bedrag, 0)
