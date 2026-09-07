import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'
import { bewaakCacheEigenaar } from '../queries/client'

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
    let actief = true

    // Bestaande sessie ophalen bij het opstarten (blijft bewaard na herladen).
    // De cachecontrole gebeurt bewust voor setLaden(false): zolang `laden` waar
    // is toont App enkel "Laden...", dus er kan geen scherm renderen met de
    // gecachte data van een vorige gebruiker.
    supabase.auth.getSession().then(async ({ data }) => {
      await bewaakCacheEigenaar(data.session?.user.id ?? null)
      if (!actief) return
      setSession(data.session)
      setLaden(false)
    })

    // Luisteren naar wijzigingen (in-/uitloggen) zodat de UI meevolgt.
    // Bij uitloggen wist bewaakCacheEigenaar meteen de hele cache.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nieuweSessie) => {
      bewaakCacheEigenaar(nieuweSessie?.user.id ?? null)
      setSession(nieuweSessie)
    })

    return () => {
      actief = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={{ session, laden }}>{children}</AuthContext.Provider>
}

// Handige hook om de sessie in eender welke component te gebruiken.
export function useAuth() {
  return useContext(AuthContext)
}
