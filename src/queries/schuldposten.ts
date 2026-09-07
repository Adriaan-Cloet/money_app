import { useMutation, useQuery } from '@tanstack/react-query'
import {
  haalSchuldpostenAlsSchuldeiser,
  haalSchuldpostenAlsSchuldenaar,
  haalSchuldpostenVoorContact,
  haalSchuldpostenVoorGebruiker,
  maakSchuldpostVoorContact,
  maakSchuldpostVoorGebruiker,
  weigerPost,
  heropenPost,
  verwijderPost,
} from '../services/schuldposten'
import { sleutels } from './sleutels'
import { ontpak } from './ontpak'
import { useMij } from './mij'
import { useVerversGeld } from './invalidatie'
import { vereisVerbinding } from './verbinding'

export function usePostenAlsSchuldeiser() {
  const mij = useMij()
  return useQuery({
    queryKey: sleutels.postenAlsSchuldeiser(mij),
    queryFn: () => ontpak(haalSchuldpostenAlsSchuldeiser(mij!)),
    enabled: mij !== null,
  })
}

export function usePostenAlsSchuldenaar() {
  const mij = useMij()
  return useQuery({
    queryKey: sleutels.postenAlsSchuldenaar(mij),
    queryFn: () => ontpak(haalSchuldpostenAlsSchuldenaar(mij!)),
    enabled: mij !== null,
  })
}

export function usePostenVanContact(contactId: string | undefined) {
  const mij = useMij()
  return useQuery({
    queryKey: sleutels.postenVanContact(mij, contactId ?? ''),
    queryFn: () => ontpak(haalSchuldpostenVoorContact(contactId!)),
    enabled: mij !== null && contactId !== undefined,
  })
}

export function usePostenVanVriend(vriendId: string | undefined) {
  const mij = useMij()
  return useQuery({
    queryKey: sleutels.postenVanVriend(mij, vriendId ?? ''),
    queryFn: () => ontpak(haalSchuldpostenVoorGebruiker(mij!, vriendId!)),
    enabled: mij !== null && vriendId !== undefined,
  })
}

// Alle mutaties op posten verversen posten en betalingen samen, want de
// FIFO-dekking loopt over allebei. Zie useVerversGeld.
function usePostMutatie<Invoer, Resultaat>(actie: (invoer: Invoer) => Promise<Resultaat>) {
  const verversGeld = useVerversGeld()
  return useMutation({
    mutationFn: async (invoer: Invoer): Promise<Resultaat> => {
      vereisVerbinding()
      return actie(invoer)
    },
    onSuccess: verversGeld,
  })
}

type NieuwePost = {
  bedrag: number
  omschrijving: string | null
  datum: string
}

// Eén hook voor beide soorten terugvraag. Het scherm kiest enkel het type; wie
// er precies naar welke servicefunctie moet, blijft hier.
export function useMaakSchuldpost() {
  const mij = useMij()
  return usePostMutatie(async (invoer: NieuwePost & { type: 'contact' | 'vriend'; id: string }) => {
    if (!mij) throw new Error('Niet ingelogd.')
    const { type, id, ...gedeeld } = invoer
    return type === 'contact'
      ? ontpak(
          maakSchuldpostVoorContact({
            schuldeiserId: mij,
            schuldenaarContactId: id,
            ...gedeeld,
          }),
        )
      : ontpak(
          maakSchuldpostVoorGebruiker({
            schuldeiserId: mij,
            schuldenaarGebruikerId: id,
            ...gedeeld,
          }),
        )
  })
}

export function useWeigerPost() {
  return usePostMutatie((postId: string) => ontpak(weigerPost(postId)))
}

export function useHeropenPost() {
  return usePostMutatie(({ postId, uitleg }: { postId: string; uitleg: string }) =>
    ontpak(heropenPost(postId, uitleg)),
  )
}

export function useVerwijderPost() {
  return usePostMutatie((postId: string) => ontpak(verwijderPost(postId)))
}
