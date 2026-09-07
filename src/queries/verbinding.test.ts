import { describe, it, expect } from 'vitest'
import { GeenVerbindingFout, isOnbereikbaar } from './verbinding'

// Deze functie beslist of de banner verschijnt. Ze staat of valt bij de vorm
// die supabase-js teruggeeft, en die is verraderlijk: bij { data, error } is de
// fout een plat object, geen Error en geen PostgrestError-instantie.
describe('isOnbereikbaar', () => {
  it('herkent een mislukte fetch aan de lege code', () => {
    expect(isOnbereikbaar({ message: 'FetchError: Failed to fetch', code: '' })).toBe(true)
  })

  it('herkent een antwoord zonder code, zoals van een gepauzeerd project', () => {
    expect(isOnbereikbaar({ message: 'Project is paused' })).toBe(true)
  })

  it('laat een dubbele naam door als gewone databasefout', () => {
    expect(isOnbereikbaar({ message: 'duplicate key value', code: '23505' })).toBe(false)
  })

  it('laat een ontbrekende rij door als gewone databasefout', () => {
    expect(isOnbereikbaar({ message: 'no rows returned', code: 'PGRST116' })).toBe(false)
  })

  it('telt onze eigen offline-fout mee', () => {
    expect(isOnbereikbaar(new GeenVerbindingFout())).toBe(true)
  })

  it('valt niet over null of een losse tekst', () => {
    expect(isOnbereikbaar(null)).toBe(false)
    expect(isOnbereikbaar('stuk')).toBe(false)
    expect(isOnbereikbaar(undefined)).toBe(false)
  })
})
