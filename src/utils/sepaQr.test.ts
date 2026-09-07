import { describe, it, expect } from 'vitest'
import { bouwSepaPayload, qrProbleem, aantalBytes, EPC_MAX_BEDRAG, MAX_BYTES } from './sepaQr'

const basis = { naam: 'Adriaan Cloet', iban: 'BE68 5390 0754 7034', bedrag: 12.5 }

describe('bouwSepaPayload', () => {
  it('zet de twaalf regels in de volgorde van de standaard', () => {
    const regels = bouwSepaPayload(basis).split('\n')
    expect(regels).toHaveLength(12)
    expect(regels[0]).toBe('BCD')
    expect(regels[1]).toBe('002')
    expect(regels[2]).toBe('1')
    expect(regels[3]).toBe('SCT')
    expect(regels[4]).toBe('') // BIC mag leeg bij versie 002
    expect(regels[5]).toBe('Adriaan Cloet')
    expect(regels[6]).toBe('BE68539007547034')
    expect(regels[7]).toBe('EUR12.50')
  })

  it('bewaart de IBAN zonder spaties', () => {
    expect(bouwSepaPayload(basis).split('\n')[6]).toBe('BE68539007547034')
  })

  it('geeft het bedrag altijd twee decimalen', () => {
    expect(bouwSepaPayload({ ...basis, bedrag: 12 }).split('\n')[7]).toBe('EUR12.00')
    expect(bouwSepaPayload({ ...basis, bedrag: 0.5 }).split('\n')[7]).toBe('EUR0.50')
  })

  it('zet de vrije mededeling op regel elf, niet op de gestructureerde regel', () => {
    const regels = bouwSepaPayload({ ...basis, mededeling: 'Pizza' }).split('\n')
    expect(regels[9]).toBe('')
    expect(regels[10]).toBe('Pizza')
  })

  it('haalt accenten eraf in plaats van de letter weg te gooien', () => {
    expect(bouwSepaPayload({ ...basis, naam: 'Adriaan Cloët' }).split('\n')[5]).toBe(
      'Adriaan Cloet',
    )
  })

  it('kapt een te lange naam af op zeventig tekens', () => {
    const lang = 'a'.repeat(100)
    expect(bouwSepaPayload({ ...basis, naam: lang }).split('\n')[5]).toHaveLength(70)
  })
})

describe('qrProbleem', () => {
  it('geeft null als alles klopt', () => {
    expect(qrProbleem(basis)).toBeNull()
  })

  it('weigert een ongeldige IBAN', () => {
    expect(qrProbleem({ ...basis, iban: 'BE68 5390 0754 7043' })).toMatch(/rekeningnummer/)
  })

  it('weigert een leeg of te klein bedrag', () => {
    expect(qrProbleem({ ...basis, bedrag: 0 })).toMatch(/bedrag/)
    expect(qrProbleem({ ...basis, bedrag: Number.NaN })).toMatch(/bedrag/)
  })

  it('weigert boven het maximum van de standaard', () => {
    expect(qrProbleem({ ...basis, bedrag: EPC_MAX_BEDRAG + 1 })).toMatch(/te groot/)
    expect(qrProbleem({ ...basis, bedrag: EPC_MAX_BEDRAG })).toBeNull()
  })

  it('laat het bedrag boven de vuistregel van 250 euro gewoon door', () => {
    expect(qrProbleem({ ...basis, bedrag: 900 })).toBeNull()
  })
})

// qrProbleem controleert de bytegrens niet, en deze test legt uit waarom: zelfs
// het slechtste geval blijft er ruim onder. Wordt een van de grenzen ooit
// opgerekt, dan valt deze test om en moet de controle er alsnog bij.
describe('de bytegrens', () => {
  it('is onbereikbaar zolang naam en mededeling afgekapt worden', () => {
    const langst = bouwSepaPayload({
      naam: 'y'.repeat(100),
      iban: 'BE68539007547034xxxxxxxxxxxxxxxxxx',
      bedrag: EPC_MAX_BEDRAG,
      mededeling: 'x'.repeat(200),
    })
    expect(aantalBytes(langst)).toBeLessThanOrEqual(MAX_BYTES)
  })
})
