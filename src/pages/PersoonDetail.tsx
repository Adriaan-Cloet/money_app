import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Schuldpost } from '../services/schuldposten'
import { useLokaalContact } from '../queries/lokaleContacten'
import { usePostenVanContact, useVerwijderPost } from '../queries/schuldposten'
import { useRegistreerContactbetaling } from '../queries/betalingen'
import { useProfiel } from '../queries/gebruikers'
import { legeStatusTekst } from '../queries/status'
import { databaseFoutTekst } from '../queries/fouten'
import StatusPill from '../components/StatusPill'
import BedragModal from '../components/BedragModal'
import BevestigModal from '../components/BevestigModal'
import VerbindingBanner from '../components/VerbindingBanner'
import IbanKaart from '../components/IbanKaart'
import QrModal from '../components/QrModal'
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
    <li className="bg-vlak border border-rand rounded-2xl px-4 py-3">
      <div className="flex items-baseline justify-between">
        <span className={`text-sm font-medium ${afgehandeld ? 'text-flauw line-through' : ''}`}>
          {post.omschrijving || 'Geen omschrijving'}
        </span>
        <span className={`text-sm font-medium ${afgehandeld ? 'text-flauw' : 'text-merk'}`}>
          {formatEuro(post.bedrag)}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-flauw">
          <StatusPill status={post.status} />
          <span>{formatDatum(post.datum)}</span>
          {post.status === 'deels_betaald' && <span>nog {formatEuro(rest)}</span>}
        </div>
        <button
          onClick={onVerwijder}
          disabled={!magWeg}
          className={`text-sm ${magWeg ? 'text-gevaar' : 'text-flauw'}`}
        >
          Verwijderen
        </button>
      </div>
      {!magWeg && <p className="mt-2 text-xs text-flauw">{POST_GEBLOKKEERD}</p>}
    </li>
  )
}

export default function PersoonDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [betaalOpen, setBetaalOpen] = useState(false)
  const [teVerwijderen, setTeVerwijderen] = useState<Schuldpost | null>(null)
  const [qrOpen, setQrOpen] = useState(false)

  const contact = useLokaalContact(id)
  // De QR toont jouw eigen rekeningnummer. Een lokaal contact heeft geen app,
  // dus dit is net de plek waar je hem laat scannen in plaats van te sturen.
  const profiel = useProfiel()
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
    <div className="min-h-screen bg-grond px-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(-1)} className="text-zacht text-sm">
            &larr; Terug
          </button>
          <h1 className="text-xl font-medium text-merk">{contact.data?.naam ?? 'Persoon'}</h1>
        </div>

        <VerbindingBanner />

        {fout && <p className="text-sm text-gevaar mb-4">{fout}</p>}

        {legeTekst ? (
          <p className="text-sm text-zacht">{legeTekst}</p>
        ) : (
          <>
            <div className="bg-vlak border border-rand rounded-2xl p-4 mb-4 text-center">
              <p className="text-xs text-zacht">Saldo met {contact.data?.naam}</p>
              <p className="text-2xl font-medium text-merk mt-1">Jij krijgt {formatEuro(saldo)}</p>
            </div>

            {open.length > 0 && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setQrOpen(true)}
                  className="flex-1 border border-rand-sterk rounded-2xl py-3 text-sm font-medium"
                >
                  Laat scannen
                </button>
                <button
                  onClick={() => setBetaalOpen(true)}
                  disabled={registreer.isPending}
                  className="flex-1 bg-merk-vlak text-merk-op rounded-2xl py-3 text-sm font-medium disabled:opacity-60"
                >
                  Heeft betaald
                </button>
              </div>
            )}

            {contact.data?.iban && (
              <div className="mb-6">
                <IbanKaart
                  iban={contact.data.iban}
                  titel={`Rekeningnummer van ${contact.data.naam}`}
                />
              </div>
            )}

            <p className="text-xs font-medium text-flauw mb-2">Openstaand</p>
            {open.length === 0 ? (
              <p className="text-sm text-zacht mb-6">Niets openstaand.</p>
            ) : (
              <ul className="space-y-2 mb-6">
                {open.map((post) => (
                  <PostRegel key={post.id} post={post} onVerwijder={() => setTeVerwijderen(post)} />
                ))}
              </ul>
            )}

            {afgehandeld.length > 0 && (
              <>
                <p className="text-xs font-medium text-flauw mb-2">Afgehandeld</p>
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

      <QrModal
        open={qrOpen}
        naam={profiel.data?.rekeninghouder ?? profiel.data?.gebruikersnaam ?? ''}
        iban={profiel.data?.iban ?? null}
        voorstelBedrag={saldo}
        onClose={() => setQrOpen(false)}
      />
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
