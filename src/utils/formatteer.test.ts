import { describe, it, expect } from 'vitest'
import { formatEuro, formatDatum, formatTijd } from './formatteer'

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

describe('formatTijd', () => {
  // Geen vaste uitkomst controleren: toLocaleTimeString volgt de tijdzone van
  // de machine, dus '14:30' hier zou elders falen. De vorm is wat telt.
  it('geeft uren en minuten met een dubbele punt', () => {
    expect(formatTijd(Date.UTC(2026, 8, 6, 14, 30))).toMatch(/^\d{2}:\d{2}$/)
  })

  it('houdt de voorloopnul in het uur', () => {
    expect(formatTijd(Date.UTC(2026, 8, 6, 9, 5))).toMatch(/^\d{2}:\d{2}$/)
  })
})
