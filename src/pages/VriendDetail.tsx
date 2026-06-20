import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { haalVrienden } from '../services/vrienden'
import {
  haalSchuldpostenVoorGebruiker,
  haalSchuldpostenAlsSchuldenaar,
  weigerPost,
  heropenPost,
  verwijderPost,
  type Schuldpost,
} from '../services/schuldposten'
import {
  maakBetaling,
  haalInkomendeBetalingen,
  haalUitgaandeBetalingen,
  bevestigBetaling,
  zetBetalingStatus,
  type Betaling,
} from '../services/betalingen'
import StatusPill from '../components/StatusPill'
import BedragModal from '../components/BedragModal'
import TekstModal from '../components/TekstModal'
import BevestigModal from '../components/BevestigModal'

const formatEuro = (b: number) => '€ ' + Math.abs(b).toFixed(2).replace('.', ',')
const formatDatum = (d: string) => d.split('-').reverse().join('-')

const openstaand = (p: Schuldpost) =>
  p.status === 'betaald' || p.status === 'geweigerd' ? 0 : p.bedrag - p.gedekt_bedrag

type Vriend = { gebruiker_id: string; gebruikersnaam: string }

function PostRegel({ post, actie }: { post: Schuldpost; actie?: ReactNode }) {
  const afgehandeld = post.status === 'betaald' || post.status === 'geweigerd'
  const rest = post.bedrag - post.gedekt_bedrag
  return (
    <li className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
      <div className="flex items-baseline justify-between">
        <span className={`text-sm font-medium ${afgehandeld ? 'text-gray-400 line-through' : ''}`}>
          {post.omschrijving || 'Geen omschrijving'}
        </span>
        <span className={`text-sm font-medium ${afgehandeld ? 'text-gray-400' : ''}`}>
          {formatEuro(post.bedrag)}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <StatusPill status={post.status} />
          <span>{formatDatum(post.datum)}</span>
          {post.status === 'deels_betaald' && <span>nog {formatEuro(rest)}</span>}
        </div>
        {actie}
      </div>
      {post.heropening_uitleg && (
        <p className="mt-2 text-xs text-gray-500">Heropend: {post.heropening_uitleg}</p>
      )}
    </li>
  )
}

function BetalingRegel({ betaling, acties }: { betaling: Betaling; acties?: ReactNode }) {
  return (
    <li className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{formatEuro(betaling.bedrag)}</span>
        <StatusPill status={betaling.status} />
      </div>
      {acties && <div className="mt-2 flex gap-3">{acties}</div>}
    </li>
  )
}

export default function VriendDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [naam, setNaam] = useState<string | null>(null)
  const [zijMoetenJou, setZijMoetenJou] = useState<Schuldpost[]>([])
  const [jijMoetHen, setJijMoetHen] = useState<Schuldpost[]>([])
  const [inkomend, setInkomend] = useState<Betaling[]>([])
  const [uitgaand, setUitgaand] = useState<Betaling[]>([])
  const [laden, setLaden] = useState(true)
  const [versie, setVersie] = useState(0)
  const herlaad = () => setVersie((v) => v + 1)

  const [betaalOpen, setBetaalOpen] = useState(false)
  const [heropenId, setHeropenId] = useState<string | null>(null)
  const [teVerwijderen, setTeVerwijderen] = useState<Schuldpost | null>(null)

  useEffect(() => {
    if (!id || !session) return
    let actief = true
    const mij = session.user.id
    const vriendId = id
    async function laad() {
      const [{ data: vrienden }, { data: teGoed }, { data: schuldenaarPosten }, { data: ink }, { data: uit }] =
        await Promise.all([
          haalVrienden(),
          haalSchuldpostenVoorGebruiker(mij, vriendId),
          haalSchuldpostenAlsSchuldenaar(mij),
          haalInkomendeBetalingen(mij, vriendId),
          haalUitgaandeBetalingen(mij, vriendId),
        ])
      if (!actief) return
      const vriend = ((vrienden as Vriend[]) ?? []).find((v) => v.gebruiker_id === vriendId)
      setNaam(vriend?.gebruikersnaam ?? 'Vriend')
      setZijMoetenJou(teGoed ?? [])
      setJijMoetHen((schuldenaarPosten ?? []).filter((p) => p.schuldeiser_id === vriendId))
      setInkomend(ink ?? [])
      setUitgaand(uit ?? [])
      setLaden(false)
    }
    laad()
    return () => {
      actief = false
    }
  }, [id, session, versie])

  async function weiger(postId: string) {
    await weigerPost(postId)
    herlaad()
  }

  async function onHeropen(uitleg: string) {
    if (!heropenId) return
    const postId = heropenId
    setHeropenId(null)
    await heropenPost(postId, uitleg)
    herlaad()
  }

  async function onVerwijder() {
    if (!teVerwijderen) return
    const postId = teVerwijderen.id
    setTeVerwijderen(null)
    await verwijderPost(postId)
    herlaad()
  }

  async function onBetaal(bedrag: number) {
    if (!id || !session) return
    setBetaalOpen(false)
    await maakBetaling(session.user.id, id, bedrag)
    herlaad()
  }

  async function bevestig(betalingId: string) {
    await bevestigBetaling(betalingId)
    herlaad()
  }

  async function zet(betalingId: string, status: 'wacht' | 'fout') {
    await zetBetalingStatus(betalingId, status)
    herlaad()
  }

  const isPending = (b: Betaling) => b.status === 'gemeld' || b.status === 'wacht'
  const pendingUit = uitgaand.filter(isPending).reduce((s, b) => s + b.bedrag, 0)
  const pendingIn = inkomend.filter(isPending).reduce((s, b) => s + b.bedrag, 0)
  const saldo =
    zijMoetenJou.reduce((s, p) => s + openstaand(p), 0) -
    jijMoetHen.reduce((s, p) => s + openstaand(p), 0) +
    pendingUit -
    pendingIn

  const jijMoetIets = jijMoetHen.some((p) => openstaand(p) > 0)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(-1)} className="text-gray-500 text-sm">
            &larr; Terug
          </button>
          <h1 className="text-xl font-medium text-[#3B6D11]">{naam ?? 'Vriend'}</h1>
        </div>

        {laden ? (
          <p className="text-sm text-gray-500">Laden...</p>
        ) : (
          <>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 text-center">
              <p className="text-xs text-gray-500">Saldo met {naam}</p>
              <p className={`text-2xl font-medium mt-1 ${saldo < 0 ? 'text-red-600' : 'text-[#3B6D11]'}`}>
                {saldo < 0 ? 'Jij moet' : 'Jij krijgt'} {formatEuro(saldo)}
              </p>
            </div>

            <p className="text-xs font-medium text-gray-400 mb-2">Zij moeten jou</p>
            {zijMoetenJou.length === 0 ? (
              <p className="text-sm text-gray-500 mb-4">Niets.</p>
            ) : (
              <ul className="space-y-2 mb-4">
                {zijMoetenJou.map((post) => (
                  <PostRegel
                    key={post.id}
                    post={post}
                    actie={
                      post.status === 'geweigerd' ? (
                        <div className="flex gap-3">
                          {!post.heropend && (
                            <button onClick={() => setHeropenId(post.id)} className="text-sm text-[#3B6D11]">
                              Heropenen
                            </button>
                          )}
                          <button onClick={() => setTeVerwijderen(post)} className="text-sm text-red-600">
                            Verwijderen
                          </button>
                        </div>
                      ) : undefined
                    }
                  />
                ))}
              </ul>
            )}

            {inkomend.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-medium text-gray-400 mb-2">Gemelde betalingen van {naam}</p>
                <ul className="space-y-2">
                  {inkomend.map((betaling) => (
                    <BetalingRegel
                      key={betaling.id}
                      betaling={betaling}
                      acties={
                        betaling.status === 'gemeld' ? (
                          <>
                            <button onClick={() => bevestig(betaling.id)} className="text-sm text-[#3B6D11]">
                              Bevestigen
                            </button>
                            <button onClick={() => zet(betaling.id, 'wacht')} className="text-sm text-gray-500">
                              Wachten
                            </button>
                            <button onClick={() => zet(betaling.id, 'fout')} className="text-sm text-red-600">
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
              <p className="text-xs font-medium text-gray-400">Jij moet hen</p>
              {jijMoetIets && (
                <button onClick={() => setBetaalOpen(true)} className="text-sm font-medium text-[#3B6D11]">
                  Ik heb betaald
                </button>
              )}
            </div>
            {jijMoetHen.length === 0 ? (
              <p className="text-sm text-gray-500 mb-4">Niets.</p>
            ) : (
              <ul className="space-y-2 mb-4">
                {jijMoetHen.map((post) => (
                  <PostRegel
                    key={post.id}
                    post={post}
                    actie={
                      post.status === 'open' ? (
                        <button onClick={() => weiger(post.id)} className="text-sm text-red-600">
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
                <p className="text-xs font-medium text-gray-400 mb-2">Jouw gemelde betalingen</p>
                <ul className="space-y-2">
                  {uitgaand.map((betaling) => (
                    <BetalingRegel key={betaling.id} betaling={betaling} />
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      <BedragModal
        open={betaalOpen}
        titel={`Betaling aan ${naam ?? 'vriend'}`}
        onBevestig={onBetaal}
        onClose={() => setBetaalOpen(false)}
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
        tekst="Deze geweigerde post wordt definitief verwijderd."
        onBevestig={onVerwijder}
        onClose={() => setTeVerwijderen(null)}
      />
    </div>
  )
}
