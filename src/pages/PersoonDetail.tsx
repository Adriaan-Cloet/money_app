import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Schuldpost } from '../services/schuldposten'
import { useLokaalContact } from '../queries/lokaleContacten'
import { usePostenVanContact, useVerwijderPost } from '../queries/schuldposten'
import { useRegistreerContactbetaling } from '../queries/betalingen'
import { legeStatusTekst } from '../queries/status'
import { databaseFoutTekst } from '../queries/fouten'
import StatusPill from '../components/StatusPill'
import BedragModal from '../components/BedragModal'
import BevestigModal from '../components/BevestigModal'
import VerbindingBanner from '../components/VerbindingBanner'
import { formatEuro, formatDatum } from '../utils/formatteer'
import { openstaand } from '../services/verrekening'
import { magPostWeg, POST_GEBLOKKEERD } from '../services/verwijderen'

const isAfgehandeld = (p: Schuldpost) => p.status === 'betaald' || p.status === 'geweigerd'

// Elke post hier is er een van jou, dus de verwijderknop staat er altijd. Hij
// gaat uit zodra er dekking op de post staat; de uitleg eronder zegt waarom
// (US-022).
function PostRegel({ post, onVerwijder }: { post: Schuldpost; onVerwijder: () => void }) {
  const afgehandeld = isAfgehandeld(post)
  const magWeg = magPostWeg(post)
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
        <button
          onClick={onVerwijder}
          disabled={!magWeg}
          className={`text-sm ${magWeg ? 'text-red-600' : 'text-gray-400'}`}
        >
          Verwijderen
        </button>
      </div>
      {!magWeg && <p className="mt-2 text-xs text-gray-400">{POST_GEBLOKKEERD}</p>}
    </li>
  )
}

export default function PersoonDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [betaalOpen, setBetaalOpen] = useState(false)
  const [teVerwijderen, setTeVerwijderen] = useState<Schuldpost | null>(null)

  const contact = useLokaalContact(id)
  const posten = usePostenVanContact(id)
  const registreer = useRegistreerContactbetaling()
  const verwijder = useVerwijderPost()

  const lijst = posten.data ?? []
  const legeTekst = legeStatusTekst(posten)
  const fout = databaseFoutTekst(registreer.error ?? verwijder.error)

  const saldo = lijst.reduce((som, post) => som + openstaand(post), 0)
  const open = lijst.filter((post) => !isAfgehandeld(post))
  const afgehandeld = lijst.filter(isAfgehandeld)

  function onBetaal(bedrag: number) {
    if (!id) return
    setBetaalOpen(false)
    registreer.mutate({ contactId: id, bedrag })
  }

  function onVerwijder() {
    if (!teVerwijderen) return
    const postId = teVerwijderen.id
    setTeVerwijderen(null)
    verwijder.mutate(postId)
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(-1)} className="text-gray-500 text-sm">
            &larr; Terug
          </button>
          <h1 className="text-xl font-medium text-[#3B6D11]">{contact.data?.naam ?? 'Persoon'}</h1>
        </div>

        <VerbindingBanner />

        {fout && <p className="text-sm text-red-600 mb-4">{fout}</p>}

        {legeTekst ? (
          <p className="text-sm text-gray-500">{legeTekst}</p>
        ) : (
          <>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 text-center">
              <p className="text-xs text-gray-500">Saldo met {contact.data?.naam}</p>
              <p className="text-2xl font-medium text-[#3B6D11] mt-1">
                Jij krijgt {formatEuro(saldo)}
              </p>
            </div>

            {open.length > 0 && (
              <button
                onClick={() => setBetaalOpen(true)}
                disabled={registreer.isPending}
                className="w-full bg-[#3B6D11] text-white rounded-2xl py-3 text-sm font-medium mb-6 disabled:opacity-60"
              >
                {contact.data?.naam ?? 'Contact'} heeft betaald
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
                    <PostRegel
                      key={post.id}
                      post={post}
                      onVerwijder={() => setTeVerwijderen(post)}
                    />
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>

      <BedragModal
        open={betaalOpen}
        titel={`${contact.data?.naam ?? 'Contact'} heeft betaald`}
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
