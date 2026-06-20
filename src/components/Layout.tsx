import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

// Wrapper voor de hoofdtabs: toont de pagina + de vaste bottom-navigatie.
export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-5 pt-6 pb-28">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
