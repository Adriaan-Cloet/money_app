import { useMutation, useQuery } from '@tanstack/react-query'
import {
  haalMijnBetalingen,
  haalInkomendeBetalingen,
  haalUitgaandeBetalingen,
  maakBetaling,
  bevestigBetaling,
  meldBetalingFout,
  verwijderBetaling,
  registreerContactbetaling,
  registreerVriendbetaling,
} from '../services/betalingen'
import { sleutels } from './sleutels'
import { ontpak, ontpakVerwijderd } from './ontpak'
import { useMij } from './mij'
import { useVerversGeld } from './invalidatie'
import { vereisVerbinding } from './verbinding'

// Al mijn betalingen in beide richtingen, voor de verrekening op het home-scherm.
export function useMijnBetalingen() {
  const mij = useMij()
  return useQuery({
    queryKey: sleutels.mijnBetalingen(mij),
    queryFn: () => ontpak(haalMijnBetalingen(mij!)),
    enabled: mij !== null,
  })
}

export function useInkomendeBetalingen(vriendId: string | undefined) {
  const mij = useMij()
  return useQuery({
    queryKey: sleutels.inkomendeBetalingen(mij, vriendId ?? ''),
    queryFn: () => ontpak(haalInkomendeBetalingen(mij!, vriendId!)),
    enabled: mij !== null && vriendId !== undefined,
  })
}

export function useUitgaandeBetalingen(vriendId: string | undefined) {
  const mij = useMij()
  return useQuery({
    queryKey: sleutels.uitgaandeBetalingen(mij, vriendId ?? ''),
    queryFn: () => ontpak(haalUitgaandeBetalingen(mij!, vriendId!)),
    enabled: mij !== null && vriendId !== undefined,
  })
}

// Zelfde patroon als bij de posten: elke geldbeweging ververst posten en
// betalingen samen, want bevestigen wijzigt via FIFO ook het gedekt_bedrag.
function useBetalingMutatie<Invoer, Resultaat>(actie: (invoer: Invoer) => Promise<Resultaat>) {
  const verversGeld = useVerversGeld()
  return useMutation({
    mutationFn: async (invoer: Invoer): Promise<Resultaat> => {
      vereisVerbinding()
      return actie(invoer)
    },
    onSuccess: verversGeld,
  })
}

// De schuldenaar meldt zelf dat hij betaald heeft. Blijft 'gemeld' tot de
// ontvanger bevestigt.
export function useMaakBetaling() {
  const mij = useMij()
  return useBetalingMutatie(
    async ({ ontvangerId, bedrag }: { ontvangerId: string; bedrag: number }) => {
      if (!mij) throw new Error('Niet ingelogd.')
      return ontpak(maakBetaling(mij, ontvangerId, bedrag))
    },
  )
}

export function useBevestigBetaling() {
  return useBetalingMutatie((betalingId: string) => ontpak(bevestigBetaling(betalingId)))
}

// Enkel de maker, en enkel zolang de betaling niet bevestigd is. Zie
// magBetalingWeg voor de regel en de RLS-policy die ze afdwingt.
export function useVerwijderBetaling() {
  return useBetalingMutatie((betalingId: string) =>
    ontpakVerwijderd(
      verwijderBetaling(betalingId),
      'Verwijderen lukte niet. Deze betaling is intussen bevestigd.',
    ),
  )
}

export function useMeldBetalingFout() {
  return useBetalingMutatie((betalingId: string) => ontpak(meldBetalingFout(betalingId)))
}

// De schuldeiser registreert zelf dat er betaald is. Auto-bevestigd, dus meteen
// FIFO toegewezen.
export function useRegistreerContactbetaling() {
  return useBetalingMutatie(({ contactId, bedrag }: { contactId: string; bedrag: number }) =>
    ontpak(registreerContactbetaling(contactId, bedrag)),
  )
}

export function useRegistreerVriendbetaling() {
  return useBetalingMutatie(({ vriendId, bedrag }: { vriendId: string; bedrag: number }) =>
    ontpak(registreerVriendbetaling(vriendId, bedrag)),
  )
}
