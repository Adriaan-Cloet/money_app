import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PostgrestError } from '@supabase/supabase-js'
import {
  haalLokaleContacten,
  haalLokaalContact,
  maakLokaalContact,
  wijzigLokaalContact,
  verwijderLokaalContact,
  lokaalContactFout,
} from '../services/lokaleContacten'
import { sleutels } from './sleutels'
import { ontpak } from './ontpak'
import { useMij } from './mij'
import { vereisVerbinding } from './verbinding'
import { ALGEMENE_FOUT, foutCode, verbindingFoutTekst } from './fouten'

// De hooks in dit bestand roepen gewoon de bestaande functies uit
// services/lokaleContacten.ts aan. Die blijven ongewijzigd: services praten met
// Supabase, queries regelen cache, laadstatus en verversen.

export function useLokaleContacten() {
  const mij = useMij()
  return useQuery({
    queryKey: sleutels.contacten(mij),
    queryFn: () => ontpak(haalLokaleContacten()),
    enabled: mij !== null,
  })
}

export function useLokaalContact(contactId: string | undefined) {
  const mij = useMij()
  return useQuery({
    queryKey: sleutels.contact(mij, contactId ?? ''),
    queryFn: () => ontpak(haalLokaalContact(contactId!)),
    enabled: mij !== null && contactId !== undefined,
  })
}

// Na elke wijziging hervragen we de hele groep contacten in een keer, via de
// brede sleutel uit sleutels.ts. Dit vervangt de versie/herlaad-truc die nu op
// vier pagina's met de hand staat.
function useContactMutatie<Invoer, Resultaat>(actie: (invoer: Invoer) => Promise<Resultaat>) {
  const mij = useMij()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (invoer: Invoer): Promise<Resultaat> => {
      vereisVerbinding()
      return actie(invoer)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sleutels.alleContacten(mij) }),
  })
}

export function useMaakLokaalContact() {
  const mij = useMij()
  return useContactMutatie(async (naam: string) => {
    if (!mij) throw new Error('Niet ingelogd.')
    return ontpak(maakLokaalContact(naam, mij))
  })
}

export function useWijzigLokaalContact() {
  return useContactMutatie(({ id, naam }: { id: string; naam: string }) =>
    ontpak(wijzigLokaalContact(id, naam)),
  )
}

// Een contact verwijderen wist ook zijn schuldposten, dus de postenlijsten
// moeten mee hervraagd worden.
export function useVerwijderLokaalContact() {
  const mij = useMij()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      vereisVerbinding()
      return ontpak(verwijderLokaalContact(id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sleutels.alleContacten(mij) })
      queryClient.invalidateQueries({ queryKey: sleutels.allePosten(mij) })
    },
  })
}

// Vertaalt de fout van een mutatie naar tekst voor het scherm. De bestaande
// lokaalContactFout blijft de databasefouten doen; de verbindingsgevallen komen
// uit fouten.ts.
export function contactFoutTekst(fout: unknown): string | null {
  if (!fout) return null

  const verbinding = verbindingFoutTekst(fout)
  if (verbinding) return verbinding

  // Geen instanceof PostgrestError: supabase-js geeft bij { data, error } een
  // plat object mee, geen instantie van die klasse. Die controle zou dus altijd
  // onwaar zijn. Daarom op de code testen.
  return foutCode(fout) ? lokaalContactFout(fout as PostgrestError) : ALGEMENE_FOUT
}
