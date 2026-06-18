import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { logout } from '../services/auth'
import { useAuth } from '../context/AuthContext'
import { haalLokaleContacten } from '../services/lokaleContacten'
import { haalSchuldpostenAlsSchuldeiser, type Schuldpost } from '../services/schuldposten'

const formatEuro = (bedrag: number) => '€ ' + bedrag.toFixed(2).replace('.', ',')

// Wat er nog openstaat op een post (betaald/geweigerd telt niet mee).
const openstaand = (p: Schuldpost) =>
  p.status === 'betaald' || p.status === 'geweigerd' ? 0 : p.bedrag - p.gedekt_bedrag

type Regel = { contactId: string; naam: string; bedrag: number }

export default function Home() {
  const { session } = useAuth()
  const [regels, setRegels] = useState<Regel[]>([])
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    async function laad() {
      if (!session) return
      const [{ data: contacten }, { data: posten }] = await Promise.all([
        haalLokaleContacten(),
        haalSchuldpostenAlsSchuldeiser(session.user.id),
      ])

      const naamPerId = new Map((contacten ?? []).map((c) => [c.id, c.naam]))
      const bedragPerContact = new Map<string, number>()
      for (const p of posten ?? []) {
        if (!p.schuldenaar_contact_id) continue
        const huidig = bedragPerContact.get(p.schuldenaar_contact_id) ?? 0
        bedragPerContact.set(p.schuldenaar_contact_id, huidig + openstaand(p))
      }

      const lijst: Regel[] = []
      for (const [contactId, bedrag] of bedragPerContact) {
        if (bedrag <= 0) continue
        lijst.push({ contactId, naam: naamPerId.get(contactId) ?? 'Onbekend', bedrag })
      }
      lijst.sort((a, b) => b.bedrag - a.bedrag)

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
          <h1 className="text-xl font-medium text-[#3B6D11]">PayMeBack</h1>
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
              <li
                key={regel.contactId}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3"
              >
                <span className="text-sm font-medium">{regel.naam}</span>
                <span className="text-sm font-medium text-[#3B6D11]">
                  + {formatEuro(regel.bedrag)}
                </span>
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
        </div>
      </div>
    </div>
  )
}
