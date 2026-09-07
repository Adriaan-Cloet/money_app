import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { haalMijnGebruikersnaam, wijzigGebruikersnaam } from '../services/gebruikers'
import { gebruikersnaamVrij, wijzigEmail, wijzigWachtwoord } from '../services/auth'
import { sleutels } from './sleutels'
import { ontpak, ontpakAuth } from './ontpak'
import { useMij } from './mij'
import { vereisVerbinding } from './verbinding'
import { ALGEMENE_FOUT, foutCode, foutBoodschap, verbindingFoutTekst } from './fouten'

// Je eigen gebruikersnaam. Wijzigt zelden, dus die mag lang blijven staan; de
// gewone verversing bij focus is ruim genoeg.
export function useProfiel() {
  const mij = useMij()
  return useQuery({
    queryKey: sleutels.profiel(mij),
    queryFn: () => ontpak(haalMijnGebruikersnaam(mij!)),
    enabled: mij !== null,
  })
}

export const GEBRUIKERSNAAM_BEZET = 'Die gebruikersnaam is al bezet.'

// Zelfde opzet als bij de posten en betalingen: elke schrijfactie eist eerst
// een verbinding, zodat ze meteen en zichtbaar weigert in plaats van in een
// wachtrij te belanden.
function useProfielMutatie<Invoer, Resultaat>(actie: (invoer: Invoer) => Promise<Resultaat>) {
  return useMutation({
    mutationFn: async (invoer: Invoer): Promise<Resultaat> => {
      vereisVerbinding()
      return actie(invoer)
    },
  })
}

export function useWijzigGebruikersnaam() {
  const mij = useMij()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ nieuw, huidig }: { nieuw: string; huidig: string }) => {
      vereisVerbinding()
      if (!mij) throw new Error('Niet ingelogd.')

      // Enkel checken als het echt een andere naam is. is_gebruikersnaam_vrij
      // kijkt hoofdletter-ongevoelig naar alle rijen, dus je eigen naam anders
      // schrijven zou anders op "al bezet" botsen door je eigen rij.
      if (nieuw.toLowerCase() !== huidig.toLowerCase()) {
        const vrij = await ontpak(gebruikersnaamVrij(nieuw))
        if (!vrij) throw new Error(GEBRUIKERSNAAM_BEZET)
      }

      return ontpak(wijzigGebruikersnaam(mij, nieuw))
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sleutels.profiel(mij) }),
  })
}

export function useWijzigEmail() {
  return useProfielMutatie((email: string) => ontpakAuth(wijzigEmail(email)))
}

export function useWijzigWachtwoord() {
  return useProfielMutatie((wachtwoord: string) => ontpakAuth(wijzigWachtwoord(wachtwoord)))
}

// De gebruikersnaam heeft een eigen vertaling omdat de unieke index in de
// database ook nog kan toeslaan: tussen de vrij-check en de update kan iemand
// anders de naam ingepikt hebben.
export function profielFoutTekst(fout: unknown): string | null {
  if (!fout) return null
  const verbinding = verbindingFoutTekst(fout)
  if (verbinding) return verbinding
  if (foutCode(fout) === '23505') return GEBRUIKERSNAAM_BEZET
  return foutBoodschap(fout) ?? ALGEMENE_FOUT
}
