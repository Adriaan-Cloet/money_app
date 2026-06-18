import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Auth from './pages/Auth'
import Home from './pages/Home'
import LokaleContacten from './pages/LokaleContacten'
import NieuwePost from './pages/NieuwePost'

export default function App() {
  const { session, laden } = useAuth()

  // Wacht tot we weten of er een sessie is, anders flikkert het scherm.
  if (laden) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Laden...</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/auth" element={session ? <Navigate to="/" replace /> : <Auth />} />
      <Route path="/" element={session ? <Home /> : <Navigate to="/auth" replace />} />
      <Route
        path="/contacten"
        element={session ? <LokaleContacten /> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/nieuw"
        element={session ? <NieuwePost /> : <Navigate to="/auth" replace />}
      />
    </Routes>
  )
}
