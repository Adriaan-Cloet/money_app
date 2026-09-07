import { describe, it, expect } from 'vitest'
import { legeStatusTekst } from './status'

describe('legeStatusTekst', () => {
  it('zwijgt zodra er data is, ook al loopt er nog een verversing', () => {
    expect(legeStatusTekst({ data: [], fetchStatus: 'fetching', isError: false })).toBeNull()
  })

  it('zwijgt bij oude data uit de cache waarvan de verversing mislukte', () => {
    expect(legeStatusTekst({ data: [{ id: '1' }], fetchStatus: 'idle', isError: true })).toBeNull()
  })

  it('zegt dat er niets bewaard is als je offline bent zonder cache', () => {
    expect(legeStatusTekst({ data: undefined, fetchStatus: 'paused', isError: false })).toBe(
      'Niets bewaard om offline te tonen.',
    )
  })

  it('toont laden zolang de eerste ophaling loopt', () => {
    expect(legeStatusTekst({ data: undefined, fetchStatus: 'fetching', isError: false })).toBe(
      'Laden...',
    )
  })

  it('toont een fout als de ophaling mislukte en er niets in de cache staat', () => {
    expect(legeStatusTekst({ data: undefined, fetchStatus: 'idle', isError: true })).toBe(
      'Laden mislukt.',
    )
  })
})
