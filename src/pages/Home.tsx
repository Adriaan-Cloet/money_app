import { Link } from 'react-router-dom'
import { useMij } from '../queries/mij'
import { useProfiel } from '../queries/gebruikers'
import { useVrienden } from '../queries/vrienden'
import { useLokaleContacten } from '../queries/lokaleContacten'
import { usePostenAlsSchuldeiser, usePostenAlsSchuldenaar } from '../queries/schuldposten'
import { useMijnBetalingen } from '../queries/betalingen'
import { legeStatusTekst } from '../queries/status'
import Avatar from '../components/Avatar'
import OpenstaandeActies from '../components/OpenstaandeActies'
import { formatEuro } from '../utils/formatteer'
import {
  regelsPerPersoon,
  totaalKrijgt,
  totaalMoet,
  isVereffend,
  type Regel,
} from '../services/verrekening'

// Waarom er iets aan deze regel hangt. Zonder dit lijkt een saldo van nul dat
// toch blijft staan, of een bedrag dat niet zakt na een melding, een fout.
function regelToelichting(regel: Regel): string | null {
  if (regel.teBevestigen > 0) {
    return regel.teBevestigen === 1
      ? '1 betaling te bevestigen'
      : `${regel.teBevestigen} betalingen te bevestigen`
  }
  if (regel.wachtOpBevestiging) return 'Gemeld, wacht op bevestiging'
  return null
}

export default function Home() {
  const mij = useMij()

  // Zes losse queries in plaats van één Promise.all. Ze cachen elk apart, dus
  // een scherm dat er maar een van nodig heeft haalt de rest niet op, en een
  // mutatie elders ververst enkel wat ze echt raakt.
  const profiel = useProfiel()
  const contacten = useLokaleContacten()
  const vrienden = useVrienden()
  const alsSchuldeiser = usePostenAlsSchuldeiser()
  const alsSchuldenaar = usePostenAlsSchuldenaar()
  const betalingen = useMijnBetalingen()

  // De verrekening mag pas rekenen als alle vijf de bronnen binnen zijn. Zonder
  // de vriendenlijst staat er "Onbekend" bij een naam, zonder de betalingen
  // klopt het saldo niet. Het profiel telt niet mee, dat is enkel de begroeting.
  const bronnen = [contacten, vrienden, alsSchuldeiser, alsSchuldenaar, betalingen]
  const legeTekst = bronnen.map(legeStatusTekst).find((tekst) => tekst !== null) ?? null

  const klaar =
    mij !== null &&
    contacten.data !== undefined &&
    vrienden.data !== undefined &&
    alsSchuldeiser.data !== undefined &&
    alsSchuldenaar.data !== undefined &&
    betalingen.data !== undefined

  const regels = klaar
    ? regelsPerPersoon({
        mij,
        contacten: contacten.data,
        vrienden: vrienden.data,
        alsSchuldeiser: alsSchuldeiser.data,
        alsSchuldenaar: alsSchuldenaar.data,
        betalingen: betalingen.data,
      })
    : []

  const totaalTeKrijgen = totaalKrijgt(regels)
  const totaalTeBetalen = totaalMoet(regels)

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-zacht">Hallo</p>
        <h1 className="text-2xl font-medium text-merk">{profiel.data?.gebruikersnaam ?? ''}</h1>
      </div>

      <OpenstaandeActies />

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-vlak border border-rand rounded-2xl p-4">
          <p className="text-xs text-zacht">Jij krijgt</p>
          <p className="text-2xl font-medium text-merk mt-1">{formatEuro(totaalTeKrijgen)}</p>
        </div>
        <div className="bg-vlak border border-rand rounded-2xl p-4">
          <p className="text-xs text-zacht">Jij moet</p>
          <p className="text-2xl font-medium text-gevaar mt-1">{formatEuro(totaalTeBetalen)}</p>
        </div>
      </div>

      <p className="text-xs font-medium text-flauw mb-2">Per persoon</p>

      {legeTekst ? (
        <p className="text-sm text-zacht">{legeTekst}</p>
      ) : regels.length === 0 ? (
        <div className="bg-vlak border border-rand rounded-2xl p-6 text-center">
          <p className="text-sm text-zacht">Nog niets openstaand.</p>
          <p className="text-sm text-flauw mt-1">Tik op + om een terugvraag toe te voegen.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {regels.map((regel) => {
            const vereffend = isVereffend(regel)
            const krijgt = regel.bedrag > 0
            const toelichting = regelToelichting(regel)
            return (
              <li key={`${regel.type}:${regel.id}`}>
                <Link
                  to={regel.type === 'contact' ? `/contact/${regel.id}` : `/vriend/${regel.id}`}
                  className="flex items-center gap-3 bg-vlak border border-rand rounded-2xl px-4 py-3"
                >
                  <Avatar naam={regel.naam} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium truncate">{regel.naam}</span>
                    {toelichting && <span className="block text-xs text-zacht">{toelichting}</span>}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      vereffend ? 'text-flauw' : krijgt ? 'text-merk' : 'text-gevaar'
                    }`}
                  >
                    {vereffend ? '' : krijgt ? '+ ' : '- '}
                    {formatEuro(regel.bedrag)}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
