import { describe, it, expect } from 'vitest'
import {
  openstaand,
  somOpenstaand,
  isOnbevestigd,
  somOnbevestigd,
  saldoMetVriend,
  regelsPerPersoon,
  totaalKrijgt,
  totaalMoet,
  type PostVoorVerrekening,
  type BetalingVoorVerrekening,
  type PostVoorNetting,
} from './verrekening'

// Korte hulpfuncties zodat elke test alleen benoemt wat er toe doet.
const post = (p: Partial<PostVoorVerrekening>): PostVoorVerrekening => ({
  status: 'open',
  bedrag: 0,
  gedekt_bedrag: 0,
  ...p,
})

const betaling = (b: Partial<BetalingVoorVerrekening>): BetalingVoorVerrekening => ({
  status: 'gemeld',
  bedrag: 0,
  ...b,
})

const geenBetalingen = { uitgaand: [], inkomend: [] }

describe('openstaand', () => {
  it('geeft het volle bedrag bij een post waar nog niets op betaald is', () => {
    expect(openstaand(post({ status: 'open', bedrag: 50 }))).toBe(50)
  })

  it('trekt de FIFO-dekking af bij een deels betaalde post', () => {
    expect(openstaand(post({ status: 'deels_betaald', bedrag: 50, gedekt_bedrag: 20 }))).toBe(30)
  })

  it('telt een betaalde post als nul', () => {
    expect(openstaand(post({ status: 'betaald', bedrag: 50, gedekt_bedrag: 50 }))).toBe(0)
  })

  it('telt een geweigerde post als nul, ook al is er niets gedekt', () => {
    expect(openstaand(post({ status: 'geweigerd', bedrag: 50, gedekt_bedrag: 0 }))).toBe(0)
  })

  it('geeft nul als de dekking het bedrag precies bereikt maar de status nog open staat', () => {
    expect(openstaand(post({ status: 'open', bedrag: 50, gedekt_bedrag: 50 }))).toBe(0)
  })

  it('rekent met centen', () => {
    expect(openstaand(post({ status: 'deels_betaald', bedrag: 12.5, gedekt_bedrag: 2.5 }))).toBe(10)
  })
})

describe('somOpenstaand', () => {
  it('telt op over meerdere posten en slaat afgehandelde over', () => {
    const posten = [
      post({ status: 'open', bedrag: 30 }),
      post({ status: 'deels_betaald', bedrag: 50, gedekt_bedrag: 20 }),
      post({ status: 'betaald', bedrag: 100, gedekt_bedrag: 100 }),
      post({ status: 'geweigerd', bedrag: 999 }),
    ]
    expect(somOpenstaand(posten)).toBe(60)
  })

  it('geeft nul bij een lege lijst', () => {
    expect(somOpenstaand([])).toBe(0)
  })
})

describe('isOnbevestigd', () => {
  it('telt gemeld en wacht als onbevestigd', () => {
    expect(isOnbevestigd(betaling({ status: 'gemeld' }))).toBe(true)
    expect(isOnbevestigd(betaling({ status: 'wacht' }))).toBe(true)
  })

  it('telt bevestigd en fout niet als onbevestigd', () => {
    expect(isOnbevestigd(betaling({ status: 'bevestigd' }))).toBe(false)
    expect(isOnbevestigd(betaling({ status: 'fout' }))).toBe(false)
  })
})

describe('somOnbevestigd', () => {
  it('telt enkel de gemelde en wachtende betalingen op', () => {
    const betalingen = [
      betaling({ status: 'gemeld', bedrag: 10 }),
      betaling({ status: 'wacht', bedrag: 5 }),
      betaling({ status: 'bevestigd', bedrag: 100 }),
      betaling({ status: 'fout', bedrag: 50 }),
    ]
    expect(somOnbevestigd(betalingen)).toBe(15)
  })
})

describe('saldoMetVriend', () => {
  it('is positief als zij jou meer moeten dan jij hen', () => {
    const saldo = saldoMetVriend({
      zijMoetenJou: [post({ bedrag: 50 })],
      jijMoetHen: [post({ bedrag: 20 })],
      ...geenBetalingen,
    })
    expect(saldo).toBe(30)
  })

  it('is negatief als jij hen meer moet dan zij jou', () => {
    const saldo = saldoMetVriend({
      zijMoetenJou: [post({ bedrag: 20 })],
      jijMoetHen: [post({ bedrag: 50 })],
      ...geenBetalingen,
    })
    expect(saldo).toBe(-30)
  })

  it('is nul als beide kanten elkaar opheffen', () => {
    const saldo = saldoMetVriend({
      zijMoetenJou: [post({ bedrag: 40 })],
      jijMoetHen: [post({ bedrag: 40 })],
      ...geenBetalingen,
    })
    expect(saldo).toBe(0)
  })

  it('laat geweigerde posten aan beide kanten buiten beschouwing', () => {
    const saldo = saldoMetVriend({
      zijMoetenJou: [post({ status: 'geweigerd', bedrag: 500 }), post({ bedrag: 10 })],
      jijMoetHen: [post({ status: 'geweigerd', bedrag: 900 })],
      ...geenBetalingen,
    })
    expect(saldo).toBe(10)
  })

  it('rekent met de dekking van deels betaalde posten', () => {
    const saldo = saldoMetVriend({
      zijMoetenJou: [post({ status: 'deels_betaald', bedrag: 50, gedekt_bedrag: 30 })],
      jijMoetHen: [],
      ...geenBetalingen,
    })
    expect(saldo).toBe(20)
  })

  it('verlaagt je schuld met een betaling die jij meldde', () => {
    const saldo = saldoMetVriend({
      zijMoetenJou: [],
      jijMoetHen: [post({ bedrag: 50 })],
      uitgaand: [betaling({ status: 'gemeld', bedrag: 20 })],
      inkomend: [],
    })
    expect(saldo).toBe(-30)
  })

  // Bewust geen test op onbevestigde betalingen die jij moet ontvangen.
  // Dat gedrag is nu fout en US-021 draait het om; die story schrijft de test
  // eerst, ziet hem rood staan en haalt dan de regel weg.
})

const MIJ = 'mij'
const ANNA = 'anna'
const contact = (id: string, naam: string) => ({ id, naam })
const vriend = (gebruiker_id: string, gebruikersnaam: string) => ({ gebruiker_id, gebruikersnaam })

const nettingPost = (p: Partial<PostVoorNetting>): PostVoorNetting => ({
  status: 'open',
  bedrag: 0,
  gedekt_bedrag: 0,
  schuldeiser_id: MIJ,
  schuldenaar_contact_id: null,
  schuldenaar_gebruiker_id: null,
  ...p,
})

const leeg = {
  mij: MIJ,
  contacten: [],
  vrienden: [],
  alsSchuldeiser: [],
  alsSchuldenaar: [],
  betalingen: [],
}

describe('regelsPerPersoon', () => {
  it('maakt een positieve regel voor een lokaal contact dat jou geld moet', () => {
    const regels = regelsPerPersoon({
      ...leeg,
      contacten: [contact('c1', 'Jan')],
      alsSchuldeiser: [nettingPost({ bedrag: 25, schuldenaar_contact_id: 'c1' })],
    })
    expect(regels).toEqual([{ type: 'contact', id: 'c1', naam: 'Jan', bedrag: 25 }])
  })

  it('maakt een negatieve regel voor een vriend aan wie jij geld moet', () => {
    const regels = regelsPerPersoon({
      ...leeg,
      vrienden: [vriend(ANNA, 'Anna')],
      alsSchuldenaar: [nettingPost({ bedrag: 40, schuldeiser_id: ANNA })],
    })
    expect(regels).toEqual([{ type: 'vriend', id: ANNA, naam: 'Anna', bedrag: -40 }])
  })

  it('saldeert beide richtingen met dezelfde vriend tot één regel', () => {
    const regels = regelsPerPersoon({
      ...leeg,
      vrienden: [vriend(ANNA, 'Anna')],
      alsSchuldeiser: [nettingPost({ bedrag: 50, schuldenaar_gebruiker_id: ANNA })],
      alsSchuldenaar: [nettingPost({ bedrag: 30, schuldeiser_id: ANNA })],
    })
    expect(regels).toEqual([{ type: 'vriend', id: ANNA, naam: 'Anna', bedrag: 20 }])
  })

  it('laat iemand weg zodra beide richtingen elkaar precies opheffen', () => {
    const regels = regelsPerPersoon({
      ...leeg,
      vrienden: [vriend(ANNA, 'Anna')],
      alsSchuldeiser: [nettingPost({ bedrag: 30, schuldenaar_gebruiker_id: ANNA })],
      alsSchuldenaar: [nettingPost({ bedrag: 30, schuldeiser_id: ANNA })],
    })
    expect(regels).toEqual([])
  })

  it('houdt een contact en een vriend met hetzelfde id uit elkaar', () => {
    const regels = regelsPerPersoon({
      ...leeg,
      contacten: [contact('x', 'Contact X')],
      vrienden: [vriend('x', 'Vriend X')],
      alsSchuldeiser: [
        nettingPost({ bedrag: 10, schuldenaar_contact_id: 'x' }),
        nettingPost({ bedrag: 20, schuldenaar_gebruiker_id: 'x' }),
      ],
    })
    expect(regels).toHaveLength(2)
    expect(regels.map((r) => r.type)).toEqual(['vriend', 'contact'])
  })

  it('noemt iemand Onbekend als de naam niet gevonden wordt', () => {
    const regels = regelsPerPersoon({
      ...leeg,
      alsSchuldeiser: [nettingPost({ bedrag: 5, schuldenaar_contact_id: 'weg' })],
    })
    expect(regels[0].naam).toBe('Onbekend')
  })

  it('sorteert van wat je het meest krijgt naar wat je het meest moet', () => {
    const regels = regelsPerPersoon({
      ...leeg,
      vrienden: [vriend('a', 'A'), vriend('b', 'B'), vriend('c', 'C')],
      alsSchuldeiser: [
        nettingPost({ bedrag: 10, schuldenaar_gebruiker_id: 'a' }),
        nettingPost({ bedrag: 60, schuldenaar_gebruiker_id: 'b' }),
      ],
      alsSchuldenaar: [nettingPost({ bedrag: 30, schuldeiser_id: 'c' })],
    })
    expect(regels.map((r) => r.bedrag)).toEqual([60, 10, -30])
  })

  it('telt een betaling die jij meldde bij je saldo op', () => {
    const regels = regelsPerPersoon({
      ...leeg,
      vrienden: [vriend(ANNA, 'Anna')],
      alsSchuldenaar: [nettingPost({ bedrag: 50, schuldeiser_id: ANNA })],
      betalingen: [
        { status: 'gemeld', bedrag: 20, betaler_gebruiker_id: MIJ, ontvanger_id: ANNA },
      ],
    })
    expect(regels).toEqual([{ type: 'vriend', id: ANNA, naam: 'Anna', bedrag: -30 }])
  })

  it('negeert bevestigde betalingen, want die zitten al in gedekt_bedrag', () => {
    const regels = regelsPerPersoon({
      ...leeg,
      vrienden: [vriend(ANNA, 'Anna')],
      alsSchuldenaar: [nettingPost({ bedrag: 50, schuldeiser_id: ANNA })],
      betalingen: [
        { status: 'bevestigd', bedrag: 20, betaler_gebruiker_id: MIJ, ontvanger_id: ANNA },
      ],
    })
    expect(regels).toEqual([{ type: 'vriend', id: ANNA, naam: 'Anna', bedrag: -50 }])
  })

  it('negeert geweigerde posten volledig', () => {
    const regels = regelsPerPersoon({
      ...leeg,
      vrienden: [vriend(ANNA, 'Anna')],
      alsSchuldeiser: [
        nettingPost({ status: 'geweigerd', bedrag: 999, schuldenaar_gebruiker_id: ANNA }),
      ],
    })
    expect(regels).toEqual([])
  })

  // Bewust geen test op een onbevestigde betaling die jij moet ontvangen.
  // Dat is de bug die US-021 rechtzet: de vriend verdwijnt nu van home.
})

describe('totaalKrijgt en totaalMoet', () => {
  const regels = [
    { type: 'vriend' as const, id: 'a', naam: 'A', bedrag: 30 },
    { type: 'vriend' as const, id: 'b', naam: 'B', bedrag: 20 },
    { type: 'contact' as const, id: 'c', naam: 'C', bedrag: -15 },
  ]

  it('telt enkel de positieve regels op', () => {
    expect(totaalKrijgt(regels)).toBe(50)
  })

  it('geeft wat je moet als positief getal', () => {
    expect(totaalMoet(regels)).toBe(15)
  })

  it('geeft nul bij een lege lijst', () => {
    expect(totaalKrijgt([])).toBe(0)
    expect(totaalMoet([])).toBe(0)
  })
})
