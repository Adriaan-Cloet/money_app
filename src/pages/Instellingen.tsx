import { useEffect, useState } from 'react'
import { logout } from '../services/auth'
import { haalMijnGebruikersnaam } from '../services/gebruikers'
import { useAuth } from '../context/AuthContext'

export default function Instellingen() {
  const { session } = useAuth()
  const [gebruikersnaam, setGebruikersnaam] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    haalMijnGebruikersnaam(session.user.id).then(({ data }) =>
      setGebruikersnaam(data?.gebruikersnaam ?? null),
    )
  }, [session])

  return (
    <div>
      <h1 className="text-2xl font-medium text-gray-900 mb-6">Instellingen</h1>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
        <p className="text-xs text-gray-500">Ingelogd als</p>
        <p className="text-base font-medium mt-1">{gebruikersnaam ?? '...'}</p>
      </div>

      <button
        onClick={() => logout()}
        className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-left text-sm font-medium text-red-600"
      >
        Uitloggen
      </button>
    </div>
  )
}
