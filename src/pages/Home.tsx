import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { haalLokaleContacten } from '../services/lokaleContacten'
import {
  haalSchuldpostenAlsSchuldeiser,
  haalSchuldpostenAlsSchuldenaar,
} from '../services/schuldposten'
import { haalMijnGebruikersnaam } from '../services/gebruikers'
import { haalVrienden } from '../services/vrienden'
import { haalMijnBetalingen } from '../services/betalingen'
import Avatar from '../components/Avatar'
import { formatEuro } from '../utils/formatteer'
import { regelsPerPersoon, totaalKrijgt, totaalMoet, type Regel } from '../services/verrekening'

type Vriend = { gebruiker_id: string; gebruikersnaam: string }

export default function Home() {
  const { session } = useAuth()
  const [regels, setRegels] = useState<Regel[]>([])
  const [gebruikersnaam, setGebruikersnaam] = useState<string | null>(null)
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    async function laad() {
      if (!session) return
      const mij = session.user.id
      const [
        { data: contacten },
        { data: alsSchuldeiser },
        { data: profiel },
        { data: vrienden },
        { data: alsSchuldenaar },
        { data: betalingen },
      ] = await Promise.all([
        haalLokaleContacten(),
        haalSchuldpostenAlsSchuldeiser(mij),
        haalMijnGebruikersnaam(mij),
        haalVrienden(),
        haalSchuldpostenAlsSchuldenaar(mij),
        haalMijnBetalingen(mij),
      ])
      setGebruikersnaam(profiel?.gebruikersnaam ?? null)

      setRegels(
        regelsPerPersoon({
          mij,
          contacten: contacten ?? [],
          vrienden: (vrienden as Vriend[]) ?? [],
          alsSchuldeiser: alsSchuldeiser ?? [],
          alsSchuldenaar: alsSchuldenaar ?? [],
          betalingen: betalingen ?? [],
        }),
      )
      setLaden(false)
    }
    laad()
  }, [session])

  const totaalTeKrijgen = totaalKrijgt(regels)
  const totaalTeBetalen = totaalMoet(regels)

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-gray-500">Hallo</p>
        <h1 className="text-2xl font-medium text-[#3B6D11]">{gebruikersnaam ?? ''}</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500">Jij krijgt</p>
          <p className="text-2xl font-medium text-[#3B6D11] mt-1">{formatEuro(totaalTeKrijgen)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500">Jij moet</p>
          <p className="text-2xl font-medium text-red-600 mt-1">{formatEuro(totaalTeBetalen)}</p>
        </div>
      </div>

      <p className="text-xs font-medium text-gray-400 mb-2">Per persoon</p>

      {laden ? (
        <p className="text-sm text-gray-500">Laden...</p>
      ) : regels.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
          <p className="text-sm text-gray-500">Nog niets openstaand.</p>
          <p className="text-sm text-gray-400 mt-1">Tik op + om een terugvraag toe te voegen.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {regels.map((regel) => {
            const krijgt = regel.bedrag > 0
            return (
              <li key={`${regel.type}:${regel.id}`}>
                <Link
                  to={regel.type === 'contact' ? `/contact/${regel.id}` : `/vriend/${regel.id}`}
                  className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3"
                >
                  <Avatar naam={regel.naam} />
                  <span className="flex-1 text-sm font-medium">{regel.naam}</span>
                  <span className={`text-sm font-medium ${krijgt ? 'text-[#3B6D11]' : 'text-red-600'}`}>
                    {krijgt ? '+ ' : '- '}
                    {formatEuro(regel.bedrag)}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
