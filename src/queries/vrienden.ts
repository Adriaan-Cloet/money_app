import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Database } from '../models/database.types'
import {
  zoekGebruiker,
  haalVrienden,
  haalInkomendeVerzoeken,
  stuurVriendschapsverzoek,
  aanvaardVerzoek,
  verwijderVriendschap,
  ontvriend,
} from '../services/vrienden'
import { sleutels } from './sleutels'
import { ontpak } from './ontpak'
import { useMij } from './mij'
import { vereisVerbinding } from './verbinding'
import { ALGEMENE_FOUT, foutCode, verbindingFoutTekst } from './fouten'

// Afgeleid van het gegenereerde schema in plaats van met de hand overgetypt.
// De pagina's casten deze rijen nu nog zelf met `as Vriend[]`; dat mag weg,
// want de RPC's zijn wel degelijk getypt. Hernoemt iemand een kolom in de
// database, dan valt dat hier door de typecheck.
type Functies = Database['public']['Functions']
export type Vriend = Functies['vriendenlijst']['Returns'][number]
export type Verzoek = Functies['inkomende_verzoeken']['Returns'][number]
export type Gevonden = Functies['zoek_gebruiker']['Returns'][number]

// Zoeken is bewust een mutatie en geen query. Een query zou het resultaat
// cachen en bij focus opnieuw ophalen, terwijl je hier een keer zoekt, kiest en
// klaar bent. Als mutatie krijgt het bovendien vereisVerbinding() mee, zodat
// zoeken zonder verbinding meteen weigert in plaats van stil te blijven hangen.
export function useZoekGebruiker() {
  return useMutation({
    mutationFn: async (gebruikersnaam: string) => {
      vereisVerbinding()
      const gevonden = await ontpak(zoekGebruiker(gebruikersnaam))
      // De RPC geeft een lijst terug; null betekent hier "niets gevonden".
      return gevonden[0] ?? null
    },
  })
}

export function useVrienden() {
  const mij = useMij()
  return useQuery({
    queryKey: sleutels.vrienden(mij),
    queryFn: () => ontpak(haalVrienden()),
    enabled: mij !== null,
  })
}

export function useVriendschapsverzoeken() {
  const mij = useMij()
  return useQuery({
    queryKey: sleutels.verzoeken(mij),
    queryFn: () => ontpak(haalInkomendeVerzoeken()),
    enabled: mij !== null,
  })
}

// Verzoeken en de vriendenlijst schuiven in elkaar over: aanvaarden haalt een
// rij uit het ene lijstje en zet ze in het andere. Ze hangen daarom onder
// dezelfde brede sleutel en worden samen hervraagd.
function useVriendMutatie<Invoer, Resultaat>(actie: (invoer: Invoer) => Promise<Resultaat>) {
  const mij = useMij()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (invoer: Invoer): Promise<Resultaat> => {
      vereisVerbinding()
      return actie(invoer)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sleutels.alleVrienden(mij) }),
  })
}

export function useStuurVriendschapsverzoek() {
  const mij = useMij()
  return useVriendMutatie(async (ontvangerId: string) => {
    if (!mij) throw new Error('Niet ingelogd.')
    return ontpak(stuurVriendschapsverzoek(mij, ontvangerId))
  })
}

export function useAanvaardVerzoek() {
  return useVriendMutatie((vriendschapId: string) => ontpak(aanvaardVerzoek(vriendschapId)))
}

export function useWeigerVerzoek() {
  return useVriendMutatie((vriendschapId: string) => ontpak(verwijderVriendschap(vriendschapId)))
}

// Ontvrienden wist ook alle posten en betalingen tussen jullie, dus daar moet
// meer dan de vriendenlijst opnieuw op.
export function useOntvriend() {
  const mij = useMij()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vriendschapId: string) => {
      vereisVerbinding()
      return ontpak(ontvriend(vriendschapId))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sleutels.alleVrienden(mij) })
      queryClient.invalidateQueries({ queryKey: sleutels.allePosten(mij) })
      queryClient.invalidateQueries({ queryKey: sleutels.alleBetalingen(mij) })
    },
  })
}

// Vertaalt een fout van de vriendenmutaties naar tekst voor het scherm.
export function vriendFoutTekst(fout: unknown): string | null {
  if (!fout) return null

  const verbinding = verbindingFoutTekst(fout)
  if (verbinding) return verbinding

  // 23505 = unieke-constraint geschonden: er ligt al een verzoek of er is al
  // een vriendschap met deze persoon.
  if (foutCode(fout) === '23505') return 'Er is al een verzoek of vriendschap met deze persoon.'

  return ALGEMENE_FOUT
}
