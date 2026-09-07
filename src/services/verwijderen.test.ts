import { describe, it, expect } from 'vitest'
import { magPostWeg, magBetalingWeg, type BetalingVoorVerwijderen } from './verwijderen'

const MIJ = 'mij'
const ANDER = 'ander'

const betaling = (b: Partial<BetalingVoorVerwijderen>): BetalingVoorVerwijderen => ({
  status: 'gemeld',
  betaler_gebruiker_id: MIJ,
  ontvanger_id: ANDER,
  ...b,
})

describe('magPostWeg', () => {
  it('laat een post zonder dekking weg', () => {
    expect(magPostWeg({ gedekt_bedrag: 0 })).toBe(true)
  })

  it('blokkeert een post waar deels op betaald is', () => {
    expect(magPostWeg({ gedekt_bedrag: 0.01 })).toBe(false)
  })

  it('blokkeert een volledig betaalde post', () => {
    expect(magPostWeg({ gedekt_bedrag: 50 })).toBe(false)
  })
})

describe('magBetalingWeg', () => {
  it('laat de betaler zijn eigen gemelde betaling weghalen', () => {
    expect(magBetalingWeg(betaling({ status: 'gemeld' }), MIJ)).toBe(true)
  })

  it('laat de betaler ook een foutgemelde betaling weghalen', () => {
    expect(magBetalingWeg(betaling({ status: 'fout' }), MIJ)).toBe(true)
  })

  it('blokkeert een bevestigde betaling, die is al FIFO toegewezen', () => {
    expect(magBetalingWeg(betaling({ status: 'bevestigd' }), MIJ)).toBe(false)
  })

  it('blokkeert de ontvanger op een melding van de tegenpartij', () => {
    const vanDeAnder = betaling({ betaler_gebruiker_id: ANDER, ontvanger_id: MIJ })
    expect(magBetalingWeg(vanDeAnder, MIJ)).toBe(false)
  })

  it('ziet bij een lokaal contact de ontvanger als de maker', () => {
    const vanContact = betaling({ betaler_gebruiker_id: null, ontvanger_id: MIJ })
    expect(magBetalingWeg(vanContact, MIJ)).toBe(true)
  })
})
