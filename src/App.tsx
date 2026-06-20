import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Auth from './pages/Auth'
import Home from './pages/Home'
import LokaleContacten from './pages/LokaleContacten'
import NieuwePost from './pages/NieuwePost'
import PersoonDetail from './pages/PersoonDetail'
import Vrienden from './pages/Vrienden'
import VriendDetail from './pages/VriendDetail'
import Instellingen from './pages/Instellingen'

export default function App() {
  const { session, laden } = useAuth()

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

      {/* Hoofdtabs met bottom-navigatie */}
      <Route element={session ? <Layout /> : <Navigate to="/auth" replace />}>
        <Route path="/" element={<Home />} />
        <Route path="/vrienden" element={<Vrienden />} />
        <Route path="/contacten" element={<LokaleContacten />} />
        <Route path="/instellingen" element={<Instellingen />} />
      </Route>

      {/* Schermen zonder bottom-nav (eigen terug-knop) */}
      <Route path="/nieuw" element={session ? <NieuwePost /> : <Navigate to="/auth" replace />} />
      <Route
        path="/contact/:id"
        element={session ? <PersoonDetail /> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/vriend/:id"
        element={session ? <VriendDetail /> : <Navigate to="/auth" replace />}
      />
    </Routes>
  )
}
