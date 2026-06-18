import { Link } from 'react-router-dom'
import { logout } from '../services/auth'
import { useAuth } from '../context/AuthContext'

// Tijdelijke placeholder. Het echte dashboard volgt in US-015.
export default function Home() {
  const { session } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-medium text-[#3B6D11]">PayMeBack</h1>
      <p className="mt-2 text-gray-600">Ingelogd als {session?.user.email}</p>

      <div className="mt-6 flex flex-col items-start gap-3">
        <Link
          to="/nieuw"
          className="bg-[#3B6D11] text-white rounded-lg px-4 py-2 text-sm font-medium"
        >
          + Nieuwe terugvraag
        </Link>
        <Link to="/contacten" className="text-sm font-medium text-[#3B6D11] underline">
          Lokale contacten beheren
        </Link>
        <button
          onClick={() => logout()}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
        >
          Uitloggen
        </button>
      </div>
    </div>
  )
}
