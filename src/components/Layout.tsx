import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

// Wrapper voor de hoofdtabs: toont de pagina + de vaste bottom-navigatie.
export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+7rem)]">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
