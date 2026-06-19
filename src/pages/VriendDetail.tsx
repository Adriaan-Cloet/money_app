import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
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

const formatEuro = (b: number) => '€ ' + Math.abs(b).toFixed(2).replace('.', ',')
const formatDatum = (d: string) => d.split('-').reverse().join('-')

const openstaand = (p: Schuldpost) =>
  p.status === 'betaald' || p.status === 'geweigerd' ? 0 : p.bedrag - p.gedekt_bedrag

const statusLabel: Record<string, string> = {
  open: 'Open',
  deels_betaald: 'Deels betaald',
  betaald: 'Betaald',
  geweigerd: 'Geweigerd',
}

type Vriend = { gebruiker_id: string; gebruikersnaam: string }

function PostRegel({ post, actie }: { post: Schuldpost; actie?: ReactNode }) {
  const afgehandeld = post.status === 'betaald' || post.status === 'geweigerd'
  return (
    <li className="bg-white border border-gray-200 rounded-lg px-4 py-3">
      <div className="flex items-baseline justify-between">
        <span className={`text-sm font-medium ${afgehandeld ? 'text-gray-400 line-through' : ''}`}>
          {post.omschrijving || 'Geen omschrijving'}
        </span>
        <span className={`text-sm font-medium ${afgehandeld ? 'text-gray-400' : ''}`}>
          {formatEuro(post.bedrag)}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">
            {statusLabel[post.status] ?? post.status}
          </span>
          <span>{formatDatum(post.datum)}</span>
        </div>
        {actie}
      </div>
      {post.heropening_uitleg && (
        <p className="mt-1 text-xs text-gray-500">Heropend: {post.heropening_uitleg}</p>
      )}
    </li>
  )
}

export default function VriendDetail() {
  const { id } = useParams()
  const { session } = useAuth()
  const [naam, setNaam] = useState<string | null>(null)
  const [zijMoetenJou, setZijMoetenJou] = useState<Schuldpost[]>([])
  const [jijMoetHen, setJijMoetHen] = useState<Schuldpost[]>([])
  const [laden, setLaden] = useState(true)

  async function laad() {
    if (!id || !session) return
    const mij = session.user.id
    const [{ data: vrienden }, { data: teGoed }, { data: schuldenaarPosten }] = await Promise.all([
      haalVrienden(),
      haalSchuldpostenVoorGebruiker(mij, id),
      haalSchuldpostenAlsSchuldenaar(mij),
    ])
    const vriend = ((vrienden as Vriend[]) ?? []).find((v) => v.gebruiker_id === id)
    setNaam(vriend?.gebruikersnaam ?? 'Vriend')
    setZijMoetenJou(teGoed ?? [])
    setJijMoetHen((schuldenaarPosten ?? []).filter((p) => p.schuldeiser_id === id))
    setLaden(false)
  }

  useEffect(() => {
    laad()
  }, [id, session])

  async function weiger(postId: string) {
    await weigerPost(postId)
    laad()
  }

  async function heropen(postId: string) {
    const uitleg = window.prompt('Waarom moet dit toch terugbetaald worden?')
    if (!uitleg || !uitleg.trim()) return
    await heropenPost(postId, uitleg.trim())
    laad()
  }

  async function verwijder(postId: string) {
    if (!window.confirm('Deze geweigerde post verwijderen?')) return
    await verwijderPost(postId)
    laad()
  }

  const saldo =
    zijMoetenJou.reduce((s, p) => s + openstaand(p), 0) -
    jijMoetHen.reduce((s, p) => s + openstaand(p), 0)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <Link to="/" className="text-gray-500 text-sm">
            &larr; Terug
          </Link>
          <h1 className="text-xl font-medium text-[#3B6D11]">{naam ?? 'Vriend'}</h1>
        </div>

        {laden ? (
          <p className="text-sm text-gray-500">Laden...</p>
        ) : (
          <>
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 text-center">
              <p className="text-xs text-gray-500">Saldo met {naam}</p>
              <p
                className={`text-2xl font-medium mt-1 ${saldo < 0 ? 'text-red-600' : 'text-[#3B6D11]'}`}
              >
                {saldo < 0 ? 'Jij moet' : 'Jij krijgt'} {formatEuro(saldo)}
              </p>
            </div>

            <p className="text-xs text-gray-400 mb-2">Zij moeten jou</p>
            {zijMoetenJou.length === 0 ? (
              <p className="text-sm text-gray-500 mb-6">Niets.</p>
            ) : (
              <ul className="space-y-2 mb-6">
                {zijMoetenJou.map((post) => (
                  <PostRegel
                    key={post.id}
                    post={post}
                    actie={
                      post.status === 'geweigerd' ? (
                        <div className="flex gap-3">
                          {!post.heropend && (
                            <button
                              onClick={() => heropen(post.id)}
                              className="text-sm text-[#3B6D11]"
                            >
                              Heropenen
                            </button>
                          )}
                          <button
                            onClick={() => verwijder(post.id)}
                            className="text-sm text-red-600"
                          >
                            Verwijderen
                          </button>
                        </div>
                      ) : undefined
                    }
                  />
                ))}
              </ul>
            )}

            <p className="text-xs text-gray-400 mb-2">Jij moet hen</p>
            {jijMoetHen.length === 0 ? (
              <p className="text-sm text-gray-500">Niets.</p>
            ) : (
              <ul className="space-y-2">
                {jijMoetHen.map((post) => (
                  <PostRegel
                    key={post.id}
                    post={post}
                    actie={
                      post.status === 'open' ? (
                        <button
                          onClick={() => weiger(post.id)}
                          className="text-sm text-red-600"
                        >
                          Weigeren
                        </button>
                      ) : undefined
                    }
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  )
}
