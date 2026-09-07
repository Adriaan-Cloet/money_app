import { describe, it, expect } from 'vitest'
import { normaliseerIban, formatIban, isGeldigeIban } from './iban'

describe('normaliseerIban', () => {
  it('haalt spaties weg en zet om naar hoofdletters', () => {
    expect(normaliseerIban('be68 5390 0754 7034')).toBe('BE68539007547034')
  })

  it('haalt ook punten en streepjes weg, want die plakken mensen erbij', () => {
    expect(normaliseerIban('BE68-5390.0754 7034')).toBe('BE68539007547034')
  })
})

describe('formatIban', () => {
  it('zet groepjes van vier', () => {
    expect(formatIban('BE68539007547034')).toBe('BE68 5390 0754 7034')
  })

  it('laat een laatste kortere groep gewoon staan', () => {
    expect(formatIban('NL91ABNA0417164300')).toBe('NL91 ABNA 0417 1643 00')
  })

  it('geeft een lege tekst terug voor een lege waarde', () => {
    expect(formatIban('')).toBe('')
  })
})

describe('isGeldigeIban', () => {
  it('aanvaardt een geldige Belgische IBAN, met of zonder spaties', () => {
    expect(isGeldigeIban('BE68 5390 0754 7034')).toBe(true)
    expect(isGeldigeIban('be68539007547034')).toBe(true)
  })

  it('aanvaardt buitenlandse IBANs met letters in het nummer', () => {
    expect(isGeldigeIban('NL91ABNA0417164300')).toBe(true)
    expect(isGeldigeIban('DE89370400440532013000')).toBe(true)
  })

  it('weigert een verkeerd controlegetal', () => {
    // Zelfde nummer als hierboven, één cijfer omgewisseld.
    expect(isGeldigeIban('BE68 5390 0754 7043')).toBe(false)
  })

  it('weigert wat niet op een IBAN lijkt', () => {
    expect(isGeldigeIban('')).toBe(false)
    expect(isGeldigeIban('5390 0754 7034')).toBe(false)
    expect(isGeldigeIban('BE68 5390 0754 70$4')).toBe(false)
    expect(isGeldigeIban('BE68 5390')).toBe(false)
  })
})
