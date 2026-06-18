import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { logout } from '../services/auth'
import { useAuth } from '../context/AuthContext'
import { haalLokaleContacten } from '../services/lokaleContacten'
import { haalSchuldpostenAlsSchuldeiser, type Schuldpost } from '../services/schuldposten'
import { haalMijnGebruikersnaam } from '../services/gebruikers'
import { haalVrienden } from '../services/vrienden'

const formatEuro = (bedrag: number) => '€ ' + bedrag.toFixed(2).replace('.', ',')

// Wat er nog openstaat op een post (betaald/geweigerd telt niet mee).
const openstaand = (p: Schuldpost) =>
  p.status === 'betaald' || p.status === 'geweigerd' ? 0 : p.bedrag - p.gedekt_bedrag

type Vriend = { gebruiker_id: string; gebruikersnaam: string }
type Regel = { type: 'contact' | 'vriend'; id: string; naam: string; bedrag: number }

export default function Home() {
  const { session } = useAuth()
  const [regels, setRegels] = useState<Regel[]>([])
  const [gebruikersnaam, setGebruikersnaam] = useState<string | null>(null)
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    async function laad() {
      if (!session) return
      const [{ data: contacten }, { data: posten }, { data: profiel }, { data: vrienden }] =
        await Promise.all([
          haalLokaleContacten(),
          haalSchuldpostenAlsSchuldeiser(session.user.id),
          haalMijnGebruikersnaam(),
          haalVrienden(),
        ])
      setGebruikersnaam(profiel?.gebruikersnaam ?? null)

      const naamPerContact = new Map((contacten ?? []).map((c) => [c.id, c.naam]))
      const naamPerVriend = new Map(((vrienden as Vriend[]) ?? []).map((v) => [v.gebruiker_id, v.gebruikersnaam]))

      const groep = new Map<string, Regel>()
      for (const p of posten ?? []) {
        let regel: Omit<Regel, 'bedrag'> | null = null
        if (p.schuldenaar_contact_id) {
          regel = {
            type: 'contact',
            id: p.schuldenaar_contact_id,
            naam: naamPerContact.get(p.schuldenaar_contact_id) ?? 'Onbekend',
          }
        } else if (p.schuldenaar_gebruiker_id) {
          regel = {
            type: 'vriend',
            id: p.schuldenaar_gebruiker_id,
            naam: naamPerVriend.get(p.schuldenaar_gebruiker_id) ?? 'Onbekend',
          }
        }
        if (!regel) continue
        const sleutel = `${regel.type}:${regel.id}`
        const huidig = groep.get(sleutel)?.bedrag ?? 0
        groep.set(sleutel, { ...regel, bedrag: huidig + openstaand(p) })
      }

      const lijst = [...groep.values()].filter((r) => r.bedrag > 0).sort((a, b) => b.bedrag - a.bedrag)
      setRegels(lijst)
      setLaden(false)
    }
    laad()
  }, [session])

  const totaalKrijgt = regels.reduce((som, r) => som + r.bedrag, 0)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-medium text-[#3B6D11]">PayMeBack</h1>
            {gebruikersnaam && <p className="text-xs text-gray-400">{gebruikersnaam}</p>}
          </div>
          <button onClick={() => logout()} className="text-sm text-gray-500">
            Uitloggen
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500">Jij krijgt</p>
            <p className="text-2xl font-medium text-[#3B6D11] mt-1">{formatEuro(totaalKrijgt)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500">Jij moet</p>
            <p className="text-2xl font-medium text-red-600 mt-1">{formatEuro(0)}</p>
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-2">Per persoon</p>

        {laden ? (
          <p className="text-sm text-gray-500">Laden...</p>
        ) : regels.length === 0 ? (
          <p className="text-sm text-gray-500">Nog niets openstaand. Voeg een terugvraag toe.</p>
        ) : (
          <ul className="space-y-2">
            {regels.map((regel) => (
              <li key={`${regel.type}:${regel.id}`}>
                <Link
                  to={regel.type === 'contact' ? `/contact/${regel.id}` : `/vriend/${regel.id}`}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3"
                >
                  <span className="text-sm font-medium">{regel.naam}</span>
                  <span className="text-sm font-medium text-[#3B6D11]">
                    + {formatEuro(regel.bedrag)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <Link
            to="/nieuw"
            className="bg-[#3B6D11] text-white rounded-lg px-4 py-3 text-sm font-medium text-center"
          >
            + Nieuwe terugvraag
          </Link>
          <Link to="/contacten" className="text-sm font-medium text-[#3B6D11] underline text-center">
            Lokale contacten beheren
          </Link>
          <Link to="/vrienden" className="text-sm font-medium text-[#3B6D11] underline text-center">
            Vrienden
          </Link>
        </div>
      </div>
    </div>
  )
}
