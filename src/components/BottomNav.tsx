import type { ReactNode } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useOpenstaandeActies } from '../queries/acties'

const paden: Record<string, ReactNode> = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5V21H3z" />
      <path d="M9 21v-6h6v6" />
    </>
  ),
  vrienden: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 19v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1" />
      <path d="M16 5a3 3 0 0 1 0 6" />
      <path d="M20 19v-1a4 4 0 0 0-2.5-3.7" />
    </>
  ),
  contacten: (
    <>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="18" r="1" />
    </>
  ),
  instellingen: <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />,
}

function Icon({ naam }: { naam: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paden[naam]}
    </svg>
  )
}

function Tab({ to, naam, badge = 0 }: { to: string; naam: string; badge?: number }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex-1 flex justify-center py-3 ${isActive ? 'text-merk' : 'text-flauw'}`
      }
    >
      <span className="relative">
        <Icon naam={naam} />
        {badge > 0 && (
          <span
            aria-label={`${badge} openstaande acties`}
            className="absolute -top-1 -right-2 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-gevaar-vlak text-gevaar-op text-[0.65rem] font-medium flex items-center justify-center"
          >
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
    </NavLink>
  )
}

export default function BottomNav() {
  // De badge staat op home, want daar staat het blok "Te bevestigen" met
  // dezelfde rijen. Hij telt gemelde betalingen en vriendschapsverzoeken samen
  // en verdwijnt zodra alles afgehandeld is.
  const { aantal } = useOpenstaandeActies()

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-vlak border-t border-rand pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-md mx-auto flex items-center px-2">
        <Tab to="/" naam="home" badge={aantal} />
        <Tab to="/vrienden" naam="vrienden" />
        <div className="flex-1 flex justify-center">
          <Link
            to="/nieuw"
            aria-label="Nieuwe terugvraag"
            className="-mt-6 w-14 h-14 rounded-full bg-merk-vlak text-merk-op flex items-center justify-center shadow-md"
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Link>
        </div>
        <Tab to="/contacten" naam="contacten" />
        <Tab to="/instellingen" naam="instellingen" />
      </div>
    </nav>
  )
}
