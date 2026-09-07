import { useQueryClient } from '@tanstack/react-query'
import { sleutels } from './sleutels'
import { useMij } from './mij'

// Een bevestigde betaling wordt in de database via FIFO toegewezen aan
// schuldposten en verhoogt daar het gedekt_bedrag. Posten en betalingen zijn
// dus niet los te verversen: na elke geldbeweging moeten ze samen opnieuw
// opgehaald worden, anders klopt het saldo op het scherm niet meer met de
// database.
export function useVerversGeld() {
  const mij = useMij()
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: sleutels.allePosten(mij) })
    queryClient.invalidateQueries({ queryKey: sleutels.alleBetalingen(mij) })
  }
}
