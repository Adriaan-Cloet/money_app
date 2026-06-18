import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { haalVrienden } from '../services/vrienden'
import { haalSchuldpostenVoorGebruiker, type Schuldpost } from '../services/schuldposten'

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

type Vriend = { gebruiker_id: string; gebruikersnaam: string }

function PostRegel({ post }: { post: Schuldpost }) {
  const afgehandeld = isAfgehandeld(post)
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
      <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
        <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">
          {statusLabel[post.status] ?? post.status}
        </span>
        <span>{formatDatum(post.datum)}</span>
      </div>
    </li>
  )
}

export default function VriendDetail() {
  const { id } = useParams()
  const { session } = useAuth()
  const [naam, setNaam] = useState<string | null>(null)
  const [posten, setPosten] = useState<Schuldpost[]>([])
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    async function laad() {
      if (!id || !session) return
      const [{ data: vrienden }, { data: p }] = await Promise.all([
        haalVrienden(),
        haalSchuldpostenVoorGebruiker(session.user.id, id),
      ])
      const vriend = ((vrienden as Vriend[]) ?? []).find((v) => v.gebruiker_id === id)
      setNaam(vriend?.gebruikersnaam ?? 'Vriend')
      setPosten(p ?? [])
      setLaden(false)
    }
    laad()
  }, [id, session])

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
          <h1 className="text-xl font-medium text-[#3B6D11]">{naam ?? 'Vriend'}</h1>
        </div>

        {laden ? (
          <p className="text-sm text-gray-500">Laden...</p>
        ) : (
          <>
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 text-center">
              <p className="text-xs text-gray-500">Saldo met {naam}</p>
              <p className="text-2xl font-medium text-[#3B6D11] mt-1">
                Jij krijgt {formatEuro(saldo)}
              </p>
            </div>

            <p className="text-xs text-gray-400 mb-2">Openstaand</p>
            {open.length === 0 ? (
              <p className="text-sm text-gray-500 mb-6">Niets openstaand.</p>
            ) : (
              <ul className="space-y-2 mb-6">
                {open.map((post) => (
                  <PostRegel key={post.id} post={post} />
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
