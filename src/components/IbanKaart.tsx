import KopieerKnop from './KopieerKnop'
import { formatIban } from '../utils/iban'

// Een rekeningnummer zoals je het wil zien staan: per vier tekens, met de naam
// van de rekeninghouder eronder als die ingevuld is, en een kopieerknop ernaast.
// Het nummer zelf staat in select-text zodat je het ook met de hand kan pakken
// als het klembord niet mag.
export default function IbanKaart({
  iban,
  rekeninghouder,
  titel,
}: {
  iban: string
  rekeninghouder?: string | null
  titel?: string
}) {
  return (
    <div className="bg-vlak border border-rand rounded-2xl px-4 py-3 flex items-center gap-3">
      <div className="min-w-0 flex-1">
        {titel && <p className="text-xs text-flauw mb-0.5">{titel}</p>}
        <p className="text-sm font-medium select-text break-all">{formatIban(iban)}</p>
        {rekeninghouder && (
          <p className="text-xs text-zacht mt-0.5">op naam van {rekeninghouder}</p>
        )}
      </div>
      <KopieerKnop tekst={formatIban(iban)} />
    </div>
  )
}
