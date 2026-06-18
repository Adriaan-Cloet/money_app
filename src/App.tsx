import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Auth from './pages/Auth'
import Home from './pages/Home'

export default function App() {
  const { session, laden } = useAuth()

  // Wacht tot we weten of er een sessie is, anders flikkert het scherm.
  if (laden) return null

  return (
    <Routes>
      <Route path="/auth" element={session ? <Navigate to="/" replace /> : <Auth />} />
      <Route path="/" element={session ? <Home /> : <Navigate to="/auth" replace />} />
    </Routes>
  )
}
