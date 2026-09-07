import { useOpenstaandeActies } from '../queries/acties'
import { useBevestigBetaling, useMeldBetalingFout } from '../queries/betalingen'
import { useAanvaardVerzoek, useWeigerVerzoek, vriendFoutTekst } from '../queries/vrienden'
import { databaseFoutTekst } from '../queries/fouten'
import Avatar from './Avatar'
import { formatEuro } from '../utils/formatteer'

// Bovenaan home: alles waar de app iets van jou verwacht. Een rij verdwijnt
// zodra ze afgehandeld is, en is het blok leeg dan staat er niets.
//
// De reden dat dit bestaat: voordien zakte een gemelde betaling meteen van het
// saldo van beide partijen af, waardoor de persoon van home verdween net toen
// er een beslissing van jou werd gevraagd (US-021).
export default function OpenstaandeActies() {
  const { teBevestigen, verzoeken, aantal } = useOpenstaandeActies()

  const bevestig = useBevestigBetaling()
  const meldFout = useMeldBetalingFout()
  const aanvaard = useAanvaardVerzoek()
  const weiger = useWeigerVerzoek()

  const bezig = [bevestig, meldFout, aanvaard, weiger].some((m) => m.isPending)
  const fout =
    databaseFoutTekst(bevestig.error ?? meldFout.error) ??
    vriendFoutTekst(aanvaard.error ?? weiger.error)

  if (aantal === 0 && !fout) return null

  return (
    <div className="mb-6">
      <p className="text-xs font-medium text-flauw mb-2">Te bevestigen</p>

      {fout && <p className="text-sm text-gevaar mb-2">{fout}</p>}

      <ul className="space-y-2">
        {teBevestigen.map((betaling) => (
          <li
            key={betaling.betalingId}
            className="bg-vlak border border-rand rounded-2xl px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <Avatar naam={betaling.naam} />
              <p className="flex-1 text-sm">
                <span className="font-medium">{betaling.naam}</span> zegt{' '}
                {formatEuro(betaling.bedrag)} betaald te hebben
              </p>
            </div>
            <div className="mt-2 flex gap-4">
              <button
                onClick={() => bevestig.mutate(betaling.betalingId)}
                disabled={bezig}
                className="text-sm font-medium text-merk disabled:opacity-60"
              >
                Bevestigen
              </button>
              <button
                onClick={() => meldFout.mutate(betaling.betalingId)}
                disabled={bezig}
                className="text-sm text-gevaar disabled:opacity-60"
              >
                Niet ontvangen
              </button>
            </div>
          </li>
        ))}

        {verzoeken.map((verzoek) => (
          <li
            key={verzoek.vriendschap_id}
            className="bg-vlak border border-rand rounded-2xl px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <Avatar naam={verzoek.gebruikersnaam} />
              <p className="flex-1 text-sm">
                <span className="font-medium">{verzoek.gebruikersnaam}</span> wil je vriend worden
              </p>
            </div>
            <div className="mt-2 flex gap-4">
              <button
                onClick={() => aanvaard.mutate(verzoek.vriendschap_id)}
                disabled={bezig}
                className="text-sm font-medium text-merk disabled:opacity-60"
              >
                Accepteren
              </button>
              <button
                onClick={() => weiger.mutate(verzoek.vriendschap_id)}
                disabled={bezig}
                className="text-sm text-zacht disabled:opacity-60"
              >
                Weigeren
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
