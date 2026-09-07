import { useState } from 'react'
import type { ReactNode } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Schuldpost } from '../services/schuldposten'
import type { Betaling } from '../services/betalingen'
import { useVrienden } from '../queries/vrienden'
import {
  usePostenVanVriend,
  usePostenAlsSchuldenaar,
  useWeigerPost,
  useHeropenPost,
  useVerwijderPost,
} from '../queries/schuldposten'
import {
  useInkomendeBetalingen,
  useUitgaandeBetalingen,
  useMaakBetaling,
  useRegistreerVriendbetaling,
  useBevestigBetaling,
  useMeldBetalingFout,
  useVerwijderBetaling,
} from '../queries/betalingen'
import { useMij } from '../queries/mij'
import { useProfiel } from '../queries/gebruikers'
import { legeStatusTekst } from '../queries/status'
import { databaseFoutTekst } from '../queries/fouten'
import StatusPill from '../components/StatusPill'
import BedragModal from '../components/BedragModal'
import TekstModal from '../components/TekstModal'
import BevestigModal from '../components/BevestigModal'
import VerbindingBanner from '../components/VerbindingBanner'
import IbanKaart from '../components/IbanKaart'
import QrModal from '../components/QrModal'
import { formatEuro, formatDatum } from '../utils/formatteer'
import { openstaand, saldoMetVriend } from '../services/verrekening'
import { magPostWeg, magBetalingWeg, POST_GEBLOKKEERD } from '../services/verwijderen'

function PostRegel({
  post,
  actie,
  uitleg,
}: {
  post: Schuldpost
  actie?: ReactNode
  uitleg?: string
}) {
  const afgehandeld = post.status === 'betaald' || post.status === 'geweigerd'
  const rest = post.bedrag - post.gedekt_bedrag
  return (
    <li className="bg-vlak border border-rand rounded-2xl px-4 py-3">
      <div className="flex items-baseline justify-between">
        <span className={`text-sm font-medium ${afgehandeld ? 'text-flauw line-through' : ''}`}>
          {post.omschrijving || 'Geen omschrijving'}
        </span>
        <span className={`text-sm font-medium ${afgehandeld ? 'text-flauw' : ''}`}>
          {formatEuro(post.bedrag)}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-flauw">
          <StatusPill status={post.status} />
          <span>{formatDatum(post.datum)}</span>
          {post.status === 'deels_betaald' && <span>nog {formatEuro(rest)}</span>}
        </div>
        {actie}
      </div>
      {post.heropening_uitleg && (
        <p className="mt-2 text-xs text-zacht">Heropend: {post.heropening_uitleg}</p>
      )}
      {uitleg && <p className="mt-2 text-xs text-flauw">{uitleg}</p>}
    </li>
  )
}

function BetalingRegel({
  betaling,
  toelichting,
  acties,
}: {
  betaling: Betaling
  toelichting?: string
  acties?: ReactNode
}) {
  return (
    <li className="bg-vlak border border-rand rounded-2xl px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{formatEuro(betaling.bedrag)}</span>
        <StatusPill status={betaling.status} />
      </div>
      {toelichting && <p className="mt-1 text-xs text-zacht">{toelichting}</p>}
      {acties && <div className="mt-2 flex gap-3">{acties}</div>}
    </li>
  )
}

export default function VriendDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [betaalOpen, setBetaalOpen] = useState(false)
  const [ontvangOpen, setOntvangOpen] = useState(false)
  const [heropenId, setHeropenId] = useState<string | null>(null)
  const [teVerwijderen, setTeVerwijderen] = useState<Schuldpost | null>(null)
  const [teVerwijderenBetaling, setTeVerwijderenBetaling] = useState<Betaling | null>(null)
  const [qrOpen, setQrOpen] = useState(false)

  const vrienden = useVrienden()
  // Voor de QR die je laat scannen: dat is jouw eigen rekeningnummer, niet dat
  // van de vriend. Je kan je eigen scherm niet scannen, dus andersom heeft het
  // geen zin.
  const profiel = useProfiel()
  const postenVanVriend = usePostenVanVriend(id)
  const postenAlsSchuldenaar = usePostenAlsSchuldenaar()
  const inkomendeBetalingen = useInkomendeBetalingen(id)
  const uitgaandeBetalingen = useUitgaandeBetalingen(id)

  const weiger = useWeigerPost()
  const heropen = useHeropenPost()
  const verwijder = useVerwijderPost()
  const betaal = useMaakBetaling()
  const ontvang = useRegistreerVriendbetaling()
  const bevestig = useBevestigBetaling()
  const meldFout = useMeldBetalingFout()
  const verwijderBetaling = useVerwijderBetaling()
  const mij = useMij()

  // Alle vier de bronnen zijn nodig voor het saldo. Mist er een, dan toont
  // legeStatusTekst waarom in plaats van een verkeerd bedrag.
  const bronnen = [postenVanVriend, postenAlsSchuldenaar, inkomendeBetalingen, uitgaandeBetalingen]
  const legeTekst = bronnen.map(legeStatusTekst).find((tekst) => tekst !== null) ?? null

  const zijMoetenJou = postenVanVriend.data ?? []
  // Deze query haalt alles op wat jij aan iedereen moet, dus hier filteren we
  // op deze ene vriend. Bewust dezelfde query als op Home: zo staat ze een keer
  // in de cache in plaats van een keer per vriend.
  const jijMoetHen = (postenAlsSchuldenaar.data ?? []).filter((post) => post.schuldeiser_id === id)
  const inkomend = inkomendeBetalingen.data ?? []
  const uitgaand = uitgaandeBetalingen.data ?? []

  const vriend = vrienden.data?.find((rij) => rij.gebruiker_id === id)
  const naam = vriend?.gebruikersnaam ?? 'Vriend'

  const mutaties = [
    weiger,
    heropen,
    verwijder,
    verwijderBetaling,
    betaal,
    ontvang,
    bevestig,
    meldFout,
  ]
  const fout = databaseFoutTekst(mutaties.map((m) => m.error).find((f) => f !== null) ?? null)
  const bezig = mutaties.some((m) => m.isPending)

  const saldo = saldoMetVriend({ zijMoetenJou, jijMoetHen, uitgaand, inkomend })
  const jijMoetIets = jijMoetHen.some((post) => openstaand(post) > 0)
  // Voorstel voor de QR: wat er netto nog naar jou moet komen. Aanpasbaar in de
  // modal zelf, want vaak spreek je een deel af.
  const teOntvangen = Math.max(saldo, 0)
  const zijMoetenIets = zijMoetenJou.some((post) => openstaand(post) > 0)

  function onHeropen(uitleg: string) {
    if (!heropenId) return
    const postId = heropenId
    setHeropenId(null)
    heropen.mutate({ postId, uitleg })
  }

  function onVerwijder() {
    if (!teVerwijderen) return
    const postId = teVerwijderen.id
    setTeVerwijderen(null)
    verwijder.mutate(postId)
  }

  function onVerwijderBetaling() {
    if (!teVerwijderenBetaling) return
    const betalingId = teVerwijderenBetaling.id
    setTeVerwijderenBetaling(null)
    verwijderBetaling.mutate(betalingId)
  }

  function onBetaal(bedrag: number) {
    if (!id) return
    setBetaalOpen(false)
    betaal.mutate({ ontvangerId: id, bedrag })
  }

  function onOntvang(bedrag: number) {
    if (!id) return
    setOntvangOpen(false)
    ontvang.mutate({ vriendId: id, bedrag })
  }

  return (
    <div className="min-h-screen bg-grond px-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(-1)} className="text-zacht text-sm">
            &larr; Terug
          </button>
          <h1 className="text-xl font-medium text-merk">{naam}</h1>
        </div>

        <VerbindingBanner />

        {fout && <p className="text-sm text-gevaar mb-4">{fout}</p>}

        {legeTekst ? (
          <p className="text-sm text-zacht">{legeTekst}</p>
        ) : (
          <>
            <div className="bg-vlak border border-rand rounded-2xl p-4 mb-6 text-center">
              <p className="text-xs text-zacht">Saldo met {naam}</p>
              <p className={`text-2xl font-medium mt-1 ${saldo < 0 ? 'text-gevaar' : 'text-merk'}`}>
                {saldo < 0 ? 'Jij moet' : 'Jij krijgt'} {formatEuro(saldo)}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-xs font-medium text-flauw">Zij moeten jou</p>
              {zijMoetenIets && (
                <div className="flex gap-3">
                  <button onClick={() => setQrOpen(true)} className="text-sm font-medium text-merk">
                    Laat scannen
                  </button>
                  <button
                    onClick={() => setOntvangOpen(true)}
                    disabled={bezig}
                    className="text-sm font-medium text-merk disabled:opacity-60"
                  >
                    {naam} heeft betaald
                  </button>
                </div>
              )}
            </div>
            {zijMoetenJou.length === 0 ? (
              <p className="text-sm text-zacht mb-4">Niets.</p>
            ) : (
              <ul className="space-y-2 mb-4">
                {zijMoetenJou.map((post) => (
                  <PostRegel
                    key={post.id}
                    post={post}
                    uitleg={magPostWeg(post) ? undefined : POST_GEBLOKKEERD}
                    actie={
                      <div className="flex gap-3">
                        {post.status === 'geweigerd' && !post.heropend && (
                          <button
                            onClick={() => setHeropenId(post.id)}
                            disabled={bezig}
                            className="text-sm text-merk disabled:opacity-60"
                          >
                            Heropenen
                          </button>
                        )}
                        <button
                          onClick={() => setTeVerwijderen(post)}
                          disabled={bezig || !magPostWeg(post)}
                          className={`text-sm ${
                            magPostWeg(post) ? 'text-gevaar disabled:opacity-60' : 'text-flauw'
                          }`}
                        >
                          Verwijderen
                        </button>
                      </div>
                    }
                  />
                ))}
              </ul>
            )}

            {inkomend.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-medium text-flauw mb-2">Gemelde betalingen van {naam}</p>
                <ul className="space-y-2">
                  {inkomend.map((betaling) => (
                    <BetalingRegel
                      key={betaling.id}
                      betaling={betaling}
                      acties={
                        betaling.status === 'gemeld' ? (
                          <>
                            <button
                              onClick={() => bevestig.mutate(betaling.id)}
                              disabled={bezig}
                              className="text-sm text-merk disabled:opacity-60"
                            >
                              Bevestigen
                            </button>
                            <button
                              onClick={() => meldFout.mutate(betaling.id)}
                              disabled={bezig}
                              className="text-sm text-gevaar disabled:opacity-60"
                            >
                              Fout
                            </button>
                          </>
                        ) : undefined
                      }
                    />
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-flauw">Jij moet hen</p>
              {jijMoetIets && (
                <button
                  onClick={() => setBetaalOpen(true)}
                  disabled={bezig}
                  className="text-sm font-medium text-merk disabled:opacity-60"
                >
                  Ik heb betaald
                </button>
              )}
            </div>
            {jijMoetIets && vriend?.iban && (
              <div className="mb-2">
                <IbanKaart
                  iban={vriend.iban}
                  rekeninghouder={vriend.rekeninghouder}
                  titel={`Rekeningnummer van ${naam}`}
                />
              </div>
            )}
            {jijMoetHen.length === 0 ? (
              <p className="text-sm text-zacht mb-4">Niets.</p>
            ) : (
              <ul className="space-y-2 mb-4">
                {jijMoetHen.map((post) => (
                  <PostRegel
                    key={post.id}
                    post={post}
                    actie={
                      post.status === 'open' ? (
                        <button
                          onClick={() => weiger.mutate(post.id)}
                          disabled={bezig}
                          className="text-sm text-gevaar disabled:opacity-60"
                        >
                          Weigeren
                        </button>
                      ) : undefined
                    }
                  />
                ))}
              </ul>
            )}

            {uitgaand.length > 0 && (
              <div>
                <p className="text-xs font-medium text-flauw mb-2">Jouw gemelde betalingen</p>
                <ul className="space-y-2">
                  {uitgaand.map((betaling) => (
                    <BetalingRegel
                      key={betaling.id}
                      betaling={betaling}
                      toelichting={
                        betaling.status === 'gemeld'
                          ? `Gemeld, wacht op bevestiging van ${naam}`
                          : undefined
                      }
                      acties={
                        mij !== null && magBetalingWeg(betaling, mij) ? (
                          <button
                            onClick={() => setTeVerwijderenBetaling(betaling)}
                            disabled={bezig}
                            className="text-sm text-gevaar disabled:opacity-60"
                          >
                            Verwijderen
                          </button>
                        ) : undefined
                      }
                    />
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      <QrModal
        open={qrOpen}
        naam={profiel.data?.rekeninghouder ?? profiel.data?.gebruikersnaam ?? ''}
        iban={profiel.data?.iban ?? null}
        voorstelBedrag={teOntvangen}
        onClose={() => setQrOpen(false)}
      />
      <BedragModal
        open={betaalOpen}
        titel={`Betaling aan ${naam}`}
        onBevestig={onBetaal}
        onClose={() => setBetaalOpen(false)}
      />
      <BedragModal
        open={ontvangOpen}
        titel={`${naam} heeft betaald`}
        onBevestig={onOntvang}
        onClose={() => setOntvangOpen(false)}
      />
      <TekstModal
        open={heropenId !== null}
        titel="Post heropenen"
        placeholder="Waarom moet dit toch terugbetaald worden?"
        onBevestig={onHeropen}
        onClose={() => setHeropenId(null)}
      />
      <BevestigModal
        open={teVerwijderen !== null}
        titel="Post verwijderen?"
        tekst={`Deze post verdwijnt definitief, ook bij ${naam}.`}
        onBevestig={onVerwijder}
        onClose={() => setTeVerwijderen(null)}
      />
      <BevestigModal
        open={teVerwijderenBetaling !== null}
        titel="Melding verwijderen?"
        tekst={`Je melding verdwijnt definitief. ${naam} kan ze daarna niet meer bevestigen.`}
        onBevestig={onVerwijderBetaling}
        onClose={() => setTeVerwijderenBetaling(null)}
      />
    </div>
  )
}
