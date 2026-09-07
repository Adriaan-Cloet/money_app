import { logout } from '../services/auth'
import { useProfiel } from '../queries/gebruikers'

export default function Instellingen() {
  // Uitloggen wist de hele cache. Dat gebeurt niet hier maar in AuthContext,
  // via bewaakCacheEigenaar op de sessiewijziging, zodat het ook klopt als de
  // sessie op een andere manier verdwijnt.
  const profiel = useProfiel()

  return (
    <div>
      <h1 className="text-2xl font-medium text-gray-900 mb-6">Instellingen</h1>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
        <p className="text-xs text-gray-500">Ingelogd als</p>
        <p className="text-base font-medium mt-1">{profiel.data?.gebruikersnaam ?? '...'}</p>
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
