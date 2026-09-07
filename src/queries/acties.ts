import { useMemo } from 'react'
import { useMij } from './mij'
import { useMijnBetalingen } from './betalingen'
import { useVrienden, useVriendschapsverzoeken, type Verzoek } from './vrienden'
import { ONBEKEND } from '../services/verrekening'

// Alles wat op jouw beslissing wacht, op één plek. Home toont het als blok
// bovenaan, de bottom-nav telt het als badge; zo kunnen die twee niet uit
// elkaar lopen. Er komt geen datacall bij: beide lijsten zitten al in de cache
// voor het saldo en de vriendenpagina.
export type TeBevestigen = {
  betalingId: string
  bedrag: number
  naam: string
}

export function useOpenstaandeActies() {
  const mij = useMij()
  const betalingen = useMijnBetalingen()
  const vrienden = useVrienden()
  const verzoeken = useVriendschapsverzoeken()

  const alleBetalingen = betalingen.data
  const alleVrienden = vrienden.data

  // useMemo omdat dit een nieuwe array bouwt: zonder dat zou elke render een
  // andere lijst opleveren en zouden de kinderen telkens opnieuw tekenen.
  const teBevestigen = useMemo<TeBevestigen[]>(() => {
    if (!alleBetalingen) return []
    const naamPerVriend = new Map(
      (alleVrienden ?? []).map((vriend) => [vriend.gebruiker_id, vriend.gebruikersnaam]),
    )
    return (
      alleBetalingen
        // Nieuwste melding bovenaan. Sorteren voor het filteren zou even goed
        // werken, maar dit scheelt werk op de lange lijst.
        .filter((betaling) => betaling.ontvanger_id === mij && betaling.status === 'gemeld')
        .sort((a, b) => b.aangemaakt_op.localeCompare(a.aangemaakt_op))
        // flatMap in plaats van map: zo versmalt TypeScript betaler_gebruiker_id
        // naar string en is er geen non-null assertie nodig. Een betaling van een
        // lokaal contact staat sowieso meteen op 'bevestigd'.
        .flatMap((betaling) => {
          const betalerId = betaling.betaler_gebruiker_id
          if (betalerId === null) return []
          return [
            {
              betalingId: betaling.id,
              bedrag: betaling.bedrag,
              naam: naamPerVriend.get(betalerId) ?? ONBEKEND,
            },
          ]
        })
    )
  }, [alleBetalingen, alleVrienden, mij])

  const openVerzoeken: Verzoek[] = verzoeken.data ?? []

  return {
    teBevestigen,
    verzoeken: openVerzoeken,
    aantal: teBevestigen.length + openVerzoeken.length,
  }
}
