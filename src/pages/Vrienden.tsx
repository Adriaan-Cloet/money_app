import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  zoekGebruiker,
  stuurVriendschapsverzoek,
  haalInkomendeVerzoeken,
  haalVrienden,
  aanvaardVerzoek,
  verwijderVriendschap,
} from '../services/vrienden'

type Gevonden = { id: string; gebruikersnaam: string }
type Verzoek = { vriendschap_id: string; verzoeker_id: string; gebruikersnaam: string }
type Vriend = { gebruiker_id: string; gebruikersnaam: string }

export default function Vrienden() {
  const { session } = useAuth()
  const [zoekterm, setZoekterm] = useState('')
  const [resultaat, setResultaat] = useState<Gevonden | null>(null)
  const [zoekMelding, setZoekMelding] = useState<string | null>(null)
  const [melding, setMelding] = useState<string | null>(null)
  const [verzoeken, setVerzoeken] = useState<Verzoek[]>([])
  const [vrienden, setVrienden] = useState<Vriend[]>([])

  async function laad() {
    const [{ data: v }, { data: vr }] = await Promise.all([
      haalInkomendeVerzoeken(),
      haalVrienden(),
    ])
    setVerzoeken((v as Verzoek[]) ?? [])
    setVrienden((vr as Vriend[]) ?? [])
  }

  useEffect(() => {
    laad()
  }, [])

  async function zoek(e: FormEvent) {
    e.preventDefault()
    setZoekMelding(null)
    setMelding(null)
    setResultaat(null)
    const naam = zoekterm.trim()
    if (!naam) return
    const { data, error } = await zoekGebruiker(naam)
    if (error) {
      setZoekMelding('Er ging iets mis bij het zoeken.')
      return
    }
    const lijst = (data as Gevonden[]) ?? []
    if (lijst.length === 0) {
      setZoekMelding('Geen gebruiker met die gebruikersnaam gevonden.')
      return
    }
    setResultaat(lijst[0])
  }

  async function voegToe() {
    if (!resultaat || !session) return
    const { error } = await stuurVriendschapsverzoek(session.user.id, resultaat.id)
    if (error) {
      setMelding(
        error.code === '23505'
          ? 'Er is al een verzoek of vriendschap met deze persoon.'
          : 'Verzoek versturen mislukt.',
      )
      return
    }
    setResultaat(null)
    setZoekterm('')
    setMelding('Verzoek verstuurd.')
    laad()
  }

  async function aanvaard(vriendschapId: string) {
    await aanvaardVerzoek(vriendschapId)
    laad()
  }

  async function weiger(vriendschapId: string) {
    await verwijderVriendschap(vriendschapId)
    laad()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <Link to="/" className="text-gray-500 text-sm">
            &larr; Terug
          </Link>
          <h1 className="text-xl font-medium text-[#3B6D11]">Vrienden</h1>
        </div>

        <form onSubmit={zoek} className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Zoek op gebruikersnaam"
            value={zoekterm}
            onChange={(e) => setZoekterm(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
          />
          <button
            type="submit"
            className="bg-[#3B6D11] text-white rounded-lg px-4 py-2.5 text-sm font-medium"
          >
            Zoek
          </button>
        </form>

        {zoekMelding && <p className="text-sm text-gray-500 mb-3">{zoekMelding}</p>}
        {melding && <p className="text-sm text-[#3B6D11] mb-3">{melding}</p>}

        {resultaat && (
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 mb-4">
            <span className="text-sm font-medium">{resultaat.gebruikersnaam}</span>
            <button
              onClick={voegToe}
              className="bg-[#3B6D11] text-white rounded-lg px-3 py-1.5 text-sm font-medium"
            >
              Verzoek sturen
            </button>
          </div>
        )}

        {verzoeken.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-gray-400 mb-2">Inkomende verzoeken</p>
            <ul className="space-y-2">
              {verzoeken.map((verzoek) => (
                <li
                  key={verzoek.vriendschap_id}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3"
                >
                  <span className="text-sm font-medium">{verzoek.gebruikersnaam}</span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => aanvaard(verzoek.vriendschap_id)}
                      className="text-[#3B6D11] text-sm font-medium"
                    >
                      Accepteren
                    </button>
                    <button
                      onClick={() => weiger(verzoek.vriendschap_id)}
                      className="text-gray-500 text-sm"
                    >
                      Weigeren
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs text-gray-400 mb-2">Mijn vrienden</p>
        {vrienden.length === 0 ? (
          <p className="text-sm text-gray-500">Nog geen vrienden.</p>
        ) : (
          <ul className="space-y-2">
            {vrienden.map((vriend) => (
              <li key={vriend.gebruiker_id}>
                <Link
                  to={`/vriend/${vriend.gebruiker_id}`}
                  className="block bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium"
                >
                  {vriend.gebruikersnaam}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
