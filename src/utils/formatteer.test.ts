import { describe, it, expect } from 'vitest'
import { formatEuro, formatDatum } from './formatteer'

describe('formatEuro', () => {
  it('zet een bedrag om naar euro met komma', () => {
    expect(formatEuro(12.5)).toBe('€ 12,50')
  })

  it('toont altijd twee decimalen', () => {
    expect(formatEuro(8)).toBe('€ 8,00')
  })

  it('laat het minteken weg, want het teken staat in de tekst ernaast', () => {
    expect(formatEuro(-12.5)).toBe('€ 12,50')
  })

  it('rondt af op twee decimalen', () => {
    expect(formatEuro(0.005)).toBe('€ 0,01')
    expect(formatEuro(1.234)).toBe('€ 1,23')
  })

  it('toont nul zonder minteken', () => {
    expect(formatEuro(0)).toBe('€ 0,00')
    expect(formatEuro(-0)).toBe('€ 0,00')
  })
})

describe('formatDatum', () => {
  it('draait de ISO-datum om naar dag-maand-jaar', () => {
    expect(formatDatum('2026-09-06')).toBe('06-09-2026')
  })

  it('behoudt de voorloopnullen', () => {
    expect(formatDatum('2026-01-01')).toBe('01-01-2026')
  })
})
