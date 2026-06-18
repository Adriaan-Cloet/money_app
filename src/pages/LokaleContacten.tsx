import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  haalLokaleContacten,
  maakLokaalContact,
  wijzigLokaalContact,
  verwijderLokaalContact,
  lokaalContactFout,
  type LokaalContact,
} from '../services/lokaleContacten'

export default function LokaleContacten() {
  const { session } = useAuth()
  const [contacten, setContacten] = useState<LokaalContact[]>([])
  const [nieuweNaam, setNieuweNaam] = useState('')
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState<string | null>(null)
  const [bewerktId, setBewerktId] = useState<string | null>(null)
  const [bewerkNaam, setBewerkNaam] = useState('')

  async function laad() {
    setLaden(true)
    const { data, error } = await haalLokaleContacten()
    if (error) setFout(lokaalContactFout(error))
    else setContacten(data ?? [])
    setLaden(false)
  }

  useEffect(() => {
    laad()
  }, [])

  async function voegToe(e: FormEvent) {
    e.preventDefault()
    const naam = nieuweNaam.trim()
    if (!naam || !session) return
    const { error } = await maakLokaalContact(naam, session.user.id)
    if (error) {
      setFout(lokaalContactFout(error))
      return
    }
    setNieuweNaam('')
    laad()
  }

  async function bewaarBewerking(id: string) {
    const naam = bewerkNaam.trim()
    if (!naam) return
    const { error } = await wijzigLokaalContact(id, naam)
    if (error) {
      setFout(lokaalContactFout(error))
      return
    }
    setBewerktId(null)
    laad()
  }

  async function verwijder(id: string) {
    if (!confirm('Dit contact en al zijn terugvragen verwijderen? Dit kan niet ongedaan gemaakt worden.'))
      return
    const { error } = await verwijderLokaalContact(id)
    if (error) {
      setFout(lokaalContactFout(error))
      return
    }
    laad()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <Link to="/" className="text-gray-500 text-sm">
            &larr; Terug
          </Link>
          <h1 className="text-xl font-medium text-[#3B6D11]">Lokale contacten</h1>
        </div>

        <form onSubmit={voegToe} className="flex gap-2 mb-5">
          <input
            type="text"
            placeholder="Naam van het contact"
            value={nieuweNaam}
            onChange={(e) => setNieuweNaam(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
          />
          <button
            type="submit"
            className="bg-[#3B6D11] text-white rounded-lg px-4 py-2.5 text-sm font-medium"
          >
            Toevoegen
          </button>
        </form>

        {fout && <p className="text-sm text-red-600 mb-3">{fout}</p>}

        {laden ? (
          <p className="text-sm text-gray-500">Laden...</p>
        ) : contacten.length === 0 ? (
          <p className="text-sm text-gray-500">Nog geen lokale contacten.</p>
        ) : (
          <ul className="space-y-2">
            {contacten.map((contact) => (
              <li
                key={contact.id}
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2.5"
              >
                {bewerktId === contact.id ? (
                  <>
                    <input
                      type="text"
                      value={bewerkNaam}
                      onChange={(e) => setBewerkNaam(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                    />
                    <button
                      onClick={() => bewaarBewerking(contact.id)}
                      className="text-[#3B6D11] text-sm font-medium"
                    >
                      Bewaren
                    </button>
                    <button onClick={() => setBewerktId(null)} className="text-gray-500 text-sm">
                      Annuleren
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{contact.naam}</span>
                    <button
                      onClick={() => {
                        setBewerktId(contact.id)
                        setBewerkNaam(contact.naam)
                      }}
                      className="text-gray-500 text-sm"
                    >
                      Bewerken
                    </button>
                    <button onClick={() => verwijder(contact.id)} className="text-red-600 text-sm">
                      Verwijderen
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
