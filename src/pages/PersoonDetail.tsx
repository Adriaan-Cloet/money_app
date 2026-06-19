import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { haalLokaalContact, type LokaalContact } from '../services/lokaleContacten'
import {
  haalSchuldpostenVoorContact,
  verwijderPost,
  type Schuldpost,
} from '../services/schuldposten'
import { registreerContactbetaling } from '../services/betalingen'

const formatEuro = (b: number) => '€ ' + b.toFixed(2).replace('.', ',')
const formatDatum = (d: string) => d.split('-').reverse().join('-')

const openstaand = (p: Schuldpost) =>
  p.status === 'betaald' || p.status === 'geweigerd' ? 0 : p.bedrag - p.gedekt_bedrag
const isAfgehandeld = (p: Schuldpost) => p.status === 'betaald' || p.status === 'geweigerd'

const statusLabel: Record<string, string> = {
  open: 'Open',
  deels_betaald: 'Deels betaald',
  betaald: 'Betaald',
  geweigerd: 'Geweigerd',
}

function PostRegel({ post, onVerwijder }: { post: Schuldpost; onVerwijder?: () => void }) {
  const afgehandeld = isAfgehandeld(post)
  const rest = post.bedrag - post.gedekt_bedrag
  return (
    <li className="bg-white border border-gray-200 rounded-lg px-4 py-3">
      <div className="flex items-baseline justify-between">
        <span className={`text-sm font-medium ${afgehandeld ? 'text-gray-400 line-through' : ''}`}>
          {post.omschrijving || 'Geen omschrijving'}
        </span>
        <span className={`text-sm font-medium ${afgehandeld ? 'text-gray-400' : 'text-[#3B6D11]'}`}>
          {formatEuro(post.bedrag)}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">
            {statusLabel[post.status] ?? post.status}
          </span>
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
  const [contact, setContact] = useState<LokaalContact | null>(null)
  const [posten, setPosten] = useState<Schuldpost[]>([])
  const [laden, setLaden] = useState(true)

  async function laad() {
    if (!id) return
    const [{ data: c }, { data: p }] = await Promise.all([
      haalLokaalContact(id),
      haalSchuldpostenVoorContact(id),
    ])
    setContact(c)
    setPosten(p ?? [])
    setLaden(false)
  }

  useEffect(() => {
    laad()
  }, [id])

  async function betaal() {
    if (!id) return
    const invoer = window.prompt(`Hoeveel heeft ${contact?.naam ?? 'het contact'} betaald? (euro)`)
    if (!invoer) return
    const bedrag = Number.parseFloat(invoer.replace(',', '.'))
    if (!Number.isFinite(bedrag) || bedrag <= 0) {
      window.alert('Vul een geldig bedrag in.')
      return
    }
    await registreerContactbetaling(id, bedrag)
    laad()
  }

  async function verwijder(postId: string) {
    if (!window.confirm('Deze post verwijderen?')) return
    await verwijderPost(postId)
    laad()
  }

  const saldo = posten.reduce((s, p) => s + openstaand(p), 0)
  const open = posten.filter((p) => !isAfgehandeld(p))
  const afgehandeld = posten.filter(isAfgehandeld)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <Link to="/" className="text-gray-500 text-sm">
            &larr; Terug
          </Link>
          <h1 className="text-xl font-medium text-[#3B6D11]">{contact?.naam ?? 'Persoon'}</h1>
        </div>

        {laden ? (
          <p className="text-sm text-gray-500">Laden...</p>
        ) : (
          <>
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 text-center">
              <p className="text-xs text-gray-500">Saldo met {contact?.naam}</p>
              <p className="text-2xl font-medium text-[#3B6D11] mt-1">
                Jij krijgt {formatEuro(saldo)}
              </p>
            </div>

            {open.length > 0 && (
              <button
                onClick={betaal}
                className="w-full bg-[#3B6D11] text-white rounded-lg py-2.5 text-sm font-medium mb-6"
              >
                {contact?.naam ?? 'Contact'} heeft betaald
              </button>
            )}

            <p className="text-xs text-gray-400 mb-2">Openstaand</p>
            {open.length === 0 ? (
              <p className="text-sm text-gray-500 mb-6">Niets openstaand.</p>
            ) : (
              <ul className="space-y-2 mb-6">
                {open.map((post) => (
                  <PostRegel key={post.id} post={post} onVerwijder={() => verwijder(post.id)} />
                ))}
              </ul>
            )}

            {afgehandeld.length > 0 && (
              <>
                <p className="text-xs text-gray-400 mb-2">Afgehandeld</p>
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
    </div>
  )
}
