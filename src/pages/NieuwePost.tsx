import { useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useLokaleContacten,
  useMaakLokaalContact,
  contactFoutTekst,
} from '../queries/lokaleContacten'
import { useVrienden } from '../queries/vrienden'
import { useMaakSchuldpost } from '../queries/schuldposten'
import { databaseFoutTekst } from '../queries/fouten'
import VerbindingBanner from '../components/VerbindingBanner'

type Keuze = { type: 'contact' | 'vriend'; id: string }

const vandaag = () => new Date().toISOString().slice(0, 10)

export default function NieuwePost() {
  const navigate = useNavigate()

  const [bedrag, setBedrag] = useState('')
  const [keuze, setKeuze] = useState<Keuze | null>(null)
  const [omschrijving, setOmschrijving] = useState('')
  const [datum, setDatum] = useState(vandaag())
  const [toonNieuwContact, setToonNieuwContact] = useState(false)
  const [nieuwContactNaam, setNieuwContactNaam] = useState('')

  // Fouten van het formulier zelf, dus voor er iets naar de database gaat. De
  // fouten van de database komen uit de mutaties.
  const [validatieFout, setValidatieFout] = useState<string | null>(null)

  const contacten = useLokaleContacten()
  const vrienden = useVrienden()
  const maakContact = useMaakLokaalContact()
  const maakPost = useMaakSchuldpost()

  const contactenLijst = contacten.data ?? []
  const vriendenLijst = vrienden.data ?? []
  const fout =
    validatieFout ?? contactFoutTekst(maakContact.error) ?? databaseFoutTekst(maakPost.error)

  function isGekozen(type: Keuze['type'], id: string) {
    return keuze?.type === type && keuze.id === id
  }

  function voegContactToe() {
    const naam = nieuwContactNaam.trim()
    if (!naam) return
    setValidatieFout(null)
    // De mutatie geeft de aangemaakte rij terug, dus we kunnen het nieuwe
    // contact meteen selecteren. De lijst zelf wordt door de invalidatie in de
    // hook opnieuw opgehaald; die hoeven we hier niet met de hand bij te werken.
    maakContact.mutate(naam, {
      onSuccess: (contact) => {
        setKeuze({ type: 'contact', id: contact.id })
        setNieuwContactNaam('')
        setToonNieuwContact(false)
      },
    })
  }

  function bijToets(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      voegContactToe()
    }
  }

  function verstuur(e: FormEvent) {
    e.preventDefault()
    setValidatieFout(null)
    maakPost.reset()

    const bedragGetal = Number.parseFloat(bedrag.replace(',', '.'))
    if (!Number.isFinite(bedragGetal) || bedragGetal <= 0) {
      setValidatieFout('Vul een geldig bedrag in.')
      return
    }
    if (!keuze) {
      setValidatieFout('Kies van wie je dit terugvraagt.')
      return
    }

    maakPost.mutate(
      {
        type: keuze.type,
        id: keuze.id,
        bedrag: bedragGetal,
        omschrijving: omschrijving.trim() || null,
        datum,
      },
      { onSuccess: () => navigate('/') },
    )
  }

  const chipKlasse = (actief: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm border ${
      actief ? 'border-2 border-merk font-medium' : 'border-rand-sterk text-zacht'
    }`

  return (
    <div className="min-h-screen bg-grond px-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <div className="max-w-md mx-auto">
        <div className="relative flex items-center justify-center mb-5">
          <button onClick={() => navigate(-1)} className="absolute left-0 text-zacht text-sm">
            &larr; Terug
          </button>
          <h1 className="text-xl font-medium text-merk">Nieuwe terugvraag</h1>
        </div>

        <VerbindingBanner />

        <form onSubmit={verstuur} className="space-y-5">
          <div>
            <label className="block text-xs text-zacht mb-1">Bedrag (euro)</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={bedrag}
              onChange={(e) => setBedrag(e.target.value)}
              style={{ fontSize: '1.5rem' }}
              className="w-full border border-rand-sterk rounded-lg px-3 py-3 font-medium text-merk"
            />
          </div>

          <div>
            <label className="block text-xs text-zacht mb-2">Van wie krijg je dit terug?</label>

            {vriendenLijst.length > 0 && (
              <>
                <p className="text-xs text-flauw mb-1">Vrienden</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {vriendenLijst.map((vriend) => (
                    <button
                      key={vriend.gebruiker_id}
                      type="button"
                      onClick={() => setKeuze({ type: 'vriend', id: vriend.gebruiker_id })}
                      className={chipKlasse(isGekozen('vriend', vriend.gebruiker_id))}
                    >
                      {vriend.gebruikersnaam}
                    </button>
                  ))}
                </div>
              </>
            )}

            <p className="text-xs text-flauw mb-1">Lokale contacten</p>
            <div className="flex flex-wrap gap-2">
              {contactenLijst.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => setKeuze({ type: 'contact', id: contact.id })}
                  className={chipKlasse(isGekozen('contact', contact.id))}
                >
                  {contact.naam}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setToonNieuwContact(true)}
                className="rounded-lg px-3 py-1.5 text-sm border border-dashed border-rand-sterk text-zacht"
              >
                + Nieuw
              </button>
            </div>

            {toonNieuwContact && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Naam nieuw contact"
                  value={nieuwContactNaam}
                  onChange={(e) => setNieuwContactNaam(e.target.value)}
                  onKeyDown={bijToets}
                  className="flex-1 border border-rand-sterk rounded-lg px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={voegContactToe}
                  disabled={maakContact.isPending}
                  className="bg-merk-vlak text-merk-op rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60"
                >
                  Toevoegen
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-zacht mb-1">Omschrijving</label>
            <input
              type="text"
              placeholder="bv. boodschappen Colruyt"
              value={omschrijving}
              onChange={(e) => setOmschrijving(e.target.value)}
              className="w-full border border-rand-sterk rounded-lg px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-zacht mb-1">Datum</label>
            <input
              type="date"
              value={datum}
              onChange={(e) => setDatum(e.target.value)}
              className="w-full border border-rand-sterk rounded-lg px-3 py-2.5 text-sm"
            />
          </div>

          {fout && <p className="text-sm text-gevaar">{fout}</p>}

          <button
            type="submit"
            disabled={maakPost.isPending}
            className="w-full bg-merk-vlak text-merk-op rounded-lg py-3 text-sm font-medium disabled:opacity-60"
          >
            {maakPost.isPending ? 'Bezig...' : 'Terugvraag bewaren'}
          </button>
        </form>
      </div>
    </div>
  )
}
