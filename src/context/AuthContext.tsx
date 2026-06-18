import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'

type AuthContextWaarde = {
  session: Session | null
  laden: boolean
}

const AuthContext = createContext<AuthContextWaarde>({ session: null, laden: true })

// Houdt de huidige sessie bij en geeft die door aan heel de app.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    // Bestaande sessie ophalen bij het opstarten (blijft bewaard na herladen).
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLaden(false)
    })

    // Luisteren naar wijzigingen (in-/uitloggen) zodat de UI meevolgt.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nieuweSessie) => {
      setSession(nieuweSessie)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ session, laden }}>{children}</AuthContext.Provider>
}

// Handige hook om de sessie in eender welke component te gebruiken.
export function useAuth() {
  return useContext(AuthContext)
}
