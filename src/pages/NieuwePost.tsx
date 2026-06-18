import { useEffect, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  haalLokaleContacten,
  maakLokaalContact,
  lokaalContactFout,
  type LokaalContact,
} from '../services/lokaleContacten'
import { maakSchuldpostVoorContact } from '../services/schuldposten'

const vandaag = () => new Date().toISOString().slice(0, 10)

export default function NieuwePost() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const [contacten, setContacten] = useState<LokaalContact[]>([])
  const [bedrag, setBedrag] = useState('')
  const [contactId, setContactId] = useState<string | null>(null)
  const [omschrijving, setOmschrijving] = useState('')
  const [datum, setDatum] = useState(vandaag())
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)

  // Inline een nieuw contact toevoegen zonder de pagina te verlaten.
  const [toonNieuwContact, setToonNieuwContact] = useState(false)
  const [nieuwContactNaam, setNieuwContactNaam] = useState('')

  useEffect(() => {
    haalLokaleContacten().then(({ data }) => setContacten(data ?? []))
  }, [])

  async function voegContactToe() {
    const naam = nieuwContactNaam.trim()
    if (!naam || !session) return
    const { data, error } = await maakLokaalContact(naam, session.user.id)
    if (error || !data) {
      setFout(error ? lokaalContactFout(error) : 'Contact toevoegen mislukt.')
      return
    }
    setContacten((vorige) => [...vorige, data])
    setContactId(data.id)
    setNieuwContactNaam('')
    setToonNieuwContact(false)
  }

  // Enter in het nieuw-contact-veldje voegt toe i.p.v. het formulier te versturen.
  function bijToets(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      voegContactToe()
    }
  }

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    setFout(null)

    const bedragGetal = Number.parseFloat(bedrag.replace(',', '.'))
    if (!Number.isFinite(bedragGetal) || bedragGetal <= 0) {
      setFout('Vul een geldig bedrag in.')
      return
    }
    if (!contactId || !session) {
      setFout('Kies van wie je dit terugvraagt.')
      return
    }

    setBezig(true)
    const { error } = await maakSchuldpostVoorContact({
      schuldeiserId: session.user.id,
      schuldenaarContactId: contactId,
      bedrag: bedragGetal,
      omschrijving: omschrijving.trim() || null,
      datum,
    })
    setBezig(false)

    if (error) {
      setFout(error.message)
      return
    }
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <Link to="/" className="text-gray-500 text-sm">
            &larr; Terug
          </Link>
          <h1 className="text-xl font-medium text-[#3B6D11]">Nieuwe terugvraag</h1>
        </div>

        <form onSubmit={verstuur} className="space-y-5">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Bedrag (euro)</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={bedrag}
              onChange={(e) => setBedrag(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-2xl font-medium text-[#3B6D11]"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-2">Van wie krijg je dit terug?</label>
            <div className="flex flex-wrap gap-2">
              {contacten.map((contact) => {
                const gekozen = contact.id === contactId
                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => setContactId(contact.id)}
                    className={`rounded-lg px-3 py-1.5 text-sm border ${
                      gekozen
                        ? 'border-2 border-[#3B6D11] font-medium'
                        : 'border-gray-300 text-gray-600'
                    }`}
                  >
                    {contact.naam}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => setToonNieuwContact(true)}
                className="rounded-lg px-3 py-1.5 text-sm border border-dashed border-gray-400 text-gray-600"
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
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={voegContactToe}
                  className="bg-[#3B6D11] text-white rounded-lg px-3 py-2 text-sm font-medium"
                >
                  Toevoegen
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Omschrijving</label>
            <input
              type="text"
              placeholder="bv. boodschappen Colruyt"
              value={omschrijving}
              onChange={(e) => setOmschrijving(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Datum</label>
            <input
              type="date"
              value={datum}
              onChange={(e) => setDatum(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
            />
          </div>

          {fout && <p className="text-sm text-red-600">{fout}</p>}

          <button
            type="submit"
            disabled={bezig}
            className="w-full bg-[#3B6D11] text-white rounded-lg py-3 text-sm font-medium disabled:opacity-60"
          >
            {bezig ? 'Bezig...' : 'Terugvraag bewaren'}
          </button>
        </form>
      </div>
    </div>
  )
}
