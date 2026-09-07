import { useAuth } from '../context/AuthContext'

// Het id van de ingelogde gebruiker, of null. Elke query-hook hangt hieraan:
// het id gaat in de sleutel en `enabled` blokkeert de query zolang er niemand
// ingelogd is. Zo hoeft geen enkele pagina dat id nog door te geven.
export function useMij() {
  const { session } = useAuth()
  return session?.user.id ?? null
}
