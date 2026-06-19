import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { logout } from '../services/auth'
import { useAuth } from '../context/AuthContext'
import { haalLokaleContacten } from '../services/lokaleContacten'
import {
  haalSchuldpostenAlsSchuldeiser,
  haalSchuldpostenAlsSchuldenaar,
  type Schuldpost,
} from '../services/schuldposten'
import { haalMijnGebruikersnaam } from '../services/gebruikers'
import { haalVrienden } from '../services/vrienden'

const formatEuro = (bedrag: number) => '€ ' + Math.abs(bedrag).toFixed(2).replace('.', ',')

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
      const mij = session.user.id
      const [
        { data: contacten },
        { data: alsSchuldeiser },
        { data: profiel },
        { data: vrienden },
        { data: alsSchuldenaar },
      ] = await Promise.all([
        haalLokaleContacten(),
        haalSchuldpostenAlsSchuldeiser(mij),
        haalMijnGebruikersnaam(),
        haalVrienden(),
        haalSchuldpostenAlsSchuldenaar(mij),
      ])
      setGebruikersnaam(profiel?.gebruikersnaam ?? null)

      const naamPerContact = new Map((contacten ?? []).map((c) => [c.id, c.naam]))
      const naamPerVriend = new Map(
        ((vrienden as Vriend[]) ?? []).map((v) => [v.gebruiker_id, v.gebruikersnaam]),
      )

      // net > 0 = jij krijgt, net < 0 = jij moet
      const net = new Map<string, Regel>()
      const tel = (type: Regel['type'], id: string, naam: string, delta: number) => {
        const sleutel = `${type}:${id}`
        const huidig = net.get(sleutel)
        net.set(sleutel, { type, id, naam, bedrag: (huidig?.bedrag ?? 0) + delta })
      }

      for (const p of alsSchuldeiser ?? []) {
        if (p.schuldenaar_contact_id) {
          tel('contact', p.schuldenaar_contact_id, naamPerContact.get(p.schuldenaar_contact_id) ?? 'Onbekend', openstaand(p))
        } else if (p.schuldenaar_gebruiker_id) {
          tel('vriend', p.schuldenaar_gebruiker_id, naamPerVriend.get(p.schuldenaar_gebruiker_id) ?? 'Onbekend', openstaand(p))
        }
      }
      for (const p of alsSchuldenaar ?? []) {
        tel('vriend', p.schuldeiser_id, naamPerVriend.get(p.schuldeiser_id) ?? 'Onbekend', -openstaand(p))
      }

      const lijst = [...net.values()]
        .filter((r) => Math.abs(r.bedrag) > 0.001)
        .sort((a, b) => b.bedrag - a.bedrag)
      setRegels(lijst)
      setLaden(false)
    }
    laad()
  }, [session])

  const totaalKrijgt = regels.filter((r) => r.bedrag > 0).reduce((s, r) => s + r.bedrag, 0)
  const totaalMoet = regels.filter((r) => r.bedrag < 0).reduce((s, r) => s - r.bedrag, 0)

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
            <p className="text-2xl font-medium text-red-600 mt-1">{formatEuro(totaalMoet)}</p>
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-2">Per persoon</p>

        {laden ? (
          <p className="text-sm text-gray-500">Laden...</p>
        ) : regels.length === 0 ? (
          <p className="text-sm text-gray-500">Nog niets openstaand. Voeg een terugvraag toe.</p>
        ) : (
          <ul className="space-y-2">
            {regels.map((regel) => {
              const krijgt = regel.bedrag > 0
              return (
                <li key={`${regel.type}:${regel.id}`}>
                  <Link
                    to={regel.type === 'contact' ? `/contact/${regel.id}` : `/vriend/${regel.id}`}
                    className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3"
                  >
                    <span className="text-sm font-medium">{regel.naam}</span>
                    <span
                      className={`text-sm font-medium ${krijgt ? 'text-[#3B6D11]' : 'text-red-600'}`}
                    >
                      {krijgt ? '+ ' : '- '}
                      {formatEuro(regel.bedrag)}
                    </span>
                  </Link>
                </li>
              )
            })}
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
