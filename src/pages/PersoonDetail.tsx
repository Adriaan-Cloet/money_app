import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { haalLokaalContact, type LokaalContact } from '../services/lokaleContacten'
import {
  haalSchuldpostenVoorContact,
  verwijderPost,
  type Schuldpost,
} from '../services/schuldposten'
import { registreerContactbetaling } from '../services/betalingen'
import StatusPill from '../components/StatusPill'
import BedragModal from '../components/BedragModal'
import BevestigModal from '../components/BevestigModal'

const formatEuro = (b: number) => '€ ' + b.toFixed(2).replace('.', ',')
const formatDatum = (d: string) => d.split('-').reverse().join('-')

const openstaand = (p: Schuldpost) =>
  p.status === 'betaald' || p.status === 'geweigerd' ? 0 : p.bedrag - p.gedekt_bedrag
const isAfgehandeld = (p: Schuldpost) => p.status === 'betaald' || p.status === 'geweigerd'

function PostRegel({ post, onVerwijder }: { post: Schuldpost; onVerwijder?: () => void }) {
  const afgehandeld = isAfgehandeld(post)
  const rest = post.bedrag - post.gedekt_bedrag
  return (
    <li className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
      <div className="flex items-baseline justify-between">
        <span className={`text-sm font-medium ${afgehandeld ? 'text-gray-400 line-through' : ''}`}>
          {post.omschrijving || 'Geen omschrijving'}
        </span>
        <span className={`text-sm font-medium ${afgehandeld ? 'text-gray-400' : 'text-[#3B6D11]'}`}>
          {formatEuro(post.bedrag)}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <StatusPill status={post.status} />
          <span>{formatDatum(post.datum)}</span>
          {post.status === 'deels_betaald' && <span>nog {formatEuro(rest)}</span>}
        </div>
        {onVerwijder && (
          <button onClick={onVerwijder} className="text-sm text-red-600">
            Verwijderen
          </button>
        )}
      </div>
    </li>
  )
}

export default function PersoonDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [contact, setContact] = useState<LokaalContact | null>(null)
  const [posten, setPosten] = useState<Schuldpost[]>([])
  const [laden, setLaden] = useState(true)
  const [betaalOpen, setBetaalOpen] = useState(false)
  const [teVerwijderen, setTeVerwijderen] = useState<Schuldpost | null>(null)

  const [versie, setVersie] = useState(0)
  const herlaad = () => setVersie((v) => v + 1)

  useEffect(() => {
    if (!id) return
    let actief = true
    const contactId = id
    async function laad() {
      const [{ data: c }, { data: p }] = await Promise.all([
        haalLokaalContact(contactId),
        haalSchuldpostenVoorContact(contactId),
      ])
      if (!actief) return
      setContact(c)
      setPosten(p ?? [])
      setLaden(false)
    }
    laad()
    return () => {
      actief = false
    }
  }, [id, versie])

  async function onBetaal(bedrag: number) {
    if (!id) return
    setBetaalOpen(false)
    await registreerContactbetaling(id, bedrag)
    herlaad()
  }

  async function onVerwijder() {
    if (!teVerwijderen) return
    const postId = teVerwijderen.id
    setTeVerwijderen(null)
    await verwijderPost(postId)
    herlaad()
  }

  const saldo = posten.reduce((s, p) => s + openstaand(p), 0)
  const open = posten.filter((p) => !isAfgehandeld(p))
  const afgehandeld = posten.filter(isAfgehandeld)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(-1)} className="text-gray-500 text-sm">
            &larr; Terug
          </button>
          <h1 className="text-xl font-medium text-[#3B6D11]">{contact?.naam ?? 'Persoon'}</h1>
        </div>

        {laden ? (
          <p className="text-sm text-gray-500">Laden...</p>
        ) : (
          <>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 text-center">
              <p className="text-xs text-gray-500">Saldo met {contact?.naam}</p>
              <p className="text-2xl font-medium text-[#3B6D11] mt-1">Jij krijgt {formatEuro(saldo)}</p>
            </div>

            {open.length > 0 && (
              <button
                onClick={() => setBetaalOpen(true)}
                className="w-full bg-[#3B6D11] text-white rounded-2xl py-3 text-sm font-medium mb-6"
              >
                {contact?.naam ?? 'Contact'} heeft betaald
              </button>
            )}

            <p className="text-xs font-medium text-gray-400 mb-2">Openstaand</p>
            {open.length === 0 ? (
              <p className="text-sm text-gray-500 mb-6">Niets openstaand.</p>
            ) : (
              <ul className="space-y-2 mb-6">
                {open.map((post) => (
                  <PostRegel key={post.id} post={post} onVerwijder={() => setTeVerwijderen(post)} />
                ))}
              </ul>
            )}

            {afgehandeld.length > 0 && (
              <>
                <p className="text-xs font-medium text-gray-400 mb-2">Afgehandeld</p>
                <ul className="space-y-2">
                  {afgehandeld.map((post) => (
                    <PostRegel key={post.id} post={post} />
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>

      <BedragModal
        open={betaalOpen}
        titel={`${contact?.naam ?? 'Contact'} heeft betaald`}
        onBevestig={onBetaal}
        onClose={() => setBetaalOpen(false)}
      />
      <BevestigModal
        open={teVerwijderen !== null}
        titel="Post verwijderen?"
        tekst="Deze post wordt definitief verwijderd."
        onBevestig={onVerwijder}
        onClose={() => setTeVerwijderen(null)}
      />
    </div>
  )
}
