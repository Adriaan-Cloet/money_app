import { useIsOnline, useLaatstBijgewerkt, useServerOnbereikbaar } from '../queries/verbinding'
import { formatTijd } from '../utils/formatteer'

// Toont enkel iets als er echt een probleem is. Bij een gewone verbinding
// blijft het scherm zoals het was.
//
// Twee gevallen, met bewust dezelfde behandeling: je bent offline volgens de
// browser, of je bent online maar de server antwoordt niet. Dat laatste is het
// gepauzeerde Supabase-project van het gratis plan. In beide gevallen zie je de
// gecachte bedragen met een banner erboven, in plaats van een leeg scherm of
// een foutmelding. De tekst verschilt wel, want "geen verbinding" terwijl je
// wifi werkt is verwarrend.
export default function VerbindingBanner() {
  const online = useIsOnline()
  const onbereikbaar = useServerOnbereikbaar()
  const laatstBijgewerkt = useLaatstBijgewerkt()

  if (online && !onbereikbaar) return null

  return (
    <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 donker:border-amber-400/25 donker:bg-amber-400/10">
      <p className="text-xs font-medium text-amber-900 donker:text-amber-200">
        {online ? 'Server niet bereikbaar.' : 'Geen verbinding.'} Je ziet je laatst bewaarde
        gegevens.
      </p>
      {laatstBijgewerkt !== null && (
        <p className="mt-0.5 text-xs text-amber-700 donker:text-amber-300/80">
          Laatst bijgewerkt om {formatTijd(laatstBijgewerkt)}.
        </p>
      )}
    </div>
  )
}
