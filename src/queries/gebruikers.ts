import { useQuery } from '@tanstack/react-query'
import { haalMijnGebruikersnaam } from '../services/gebruikers'
import { sleutels } from './sleutels'
import { ontpak } from './ontpak'
import { useMij } from './mij'

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
