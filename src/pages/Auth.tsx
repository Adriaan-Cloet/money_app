import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  login,
  registreer,
  gebruikersnaamVrij,
  GEBRUIKERSNAAM_PATROON,
  GEBRUIKERSNAAM_UITLEG,
} from '../services/auth'
import { vertaalAuthFout } from '../services/authFouten'
import { onlineManager } from '@tanstack/react-query'
import { GeenVerbindingFout } from '../queries/verbinding'

type Modus = 'login' | 'registreer'

export default function Auth() {
  const [modus, setModus] = useState<Modus>('login')
  const [gebruikersnaam, setGebruikersnaam] = useState('')
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const navigate = useNavigate()

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    setFout(null)

    // Inloggen en registreren gaan altijd naar de server. Zonder deze controle
    // zou vertaalAuthFout er "Er ging iets mis" van maken, want een mislukte
    // fetch heeft geen authcode.
    if (!onlineManager.isOnline()) {
      setFout(new GeenVerbindingFout().message)
      return
    }

    if (modus === 'registreer' && !GEBRUIKERSNAAM_PATROON.test(gebruikersnaam)) {
      setFout(GEBRUIKERSNAAM_UITLEG)
      return
    }

    setBezig(true)

    // Bij registreren eerst checken of de gebruikersnaam nog vrij is.
    if (modus === 'registreer') {
      const { data: vrij, error: checkFout } = await gebruikersnaamVrij(gebruikersnaam)
      if (checkFout) {
        setBezig(false)
        setFout('Kon de gebruikersnaam niet controleren. Probeer opnieuw.')
        return
      }
      if (!vrij) {
        setBezig(false)
        setFout('Die gebruikersnaam is al bezet.')
        return
      }
    }

    const { error } =
      modus === 'login'
        ? await login(email, wachtwoord)
        : await registreer(email, wachtwoord, gebruikersnaam)

    setBezig(false)

    if (error) {
      setFout(vertaalAuthFout(error))
      return
    }
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-grond px-4 py-[calc(env(safe-area-inset-top)+1rem)]">
      <div className="w-full max-w-sm bg-vlak rounded-2xl border border-rand p-6">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-merk-vlak text-merk-op text-2xl font-medium inline-flex items-center justify-center mb-3">
            €
          </div>
          <h1 className="text-xl font-medium text-merk">PayMeBack</h1>
          <p className="text-sm text-zacht mt-1">Samen simpel afrekenen</p>
        </div>

        <div className="flex border-b border-rand mb-5">
          <button
            type="button"
            onClick={() => setModus('login')}
            className={`flex-1 py-2 text-sm ${
              modus === 'login' ? 'border-b-2 border-merk font-medium' : 'text-zacht'
            }`}
          >
            Inloggen
          </button>
          <button
            type="button"
            onClick={() => setModus('registreer')}
            className={`flex-1 py-2 text-sm ${
              modus === 'registreer' ? 'border-b-2 border-merk font-medium' : 'text-zacht'
            }`}
          >
            Registreren
          </button>
        </div>

        <form onSubmit={verstuur} className="space-y-3">
          {modus === 'registreer' && (
            <input
              type="text"
              placeholder="Gebruikersnaam, bv. voornaam_achternaam"
              value={gebruikersnaam}
              onChange={(e) => setGebruikersnaam(e.target.value)}
              required
              className="w-full border border-rand-sterk rounded-lg px-3 py-2.5 text-sm"
            />
          )}
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-rand-sterk rounded-lg px-3 py-2.5 text-sm"
          />
          <input
            type="password"
            placeholder="Wachtwoord"
            value={wachtwoord}
            onChange={(e) => setWachtwoord(e.target.value)}
            required
            minLength={6}
            className="w-full border border-rand-sterk rounded-lg px-3 py-2.5 text-sm"
          />

          {fout && <p className="text-sm text-gevaar">{fout}</p>}

          <button
            type="submit"
            disabled={bezig}
            className="w-full bg-merk-vlak text-merk-op rounded-lg py-3 text-sm font-medium disabled:opacity-60"
          >
            {bezig ? 'Bezig...' : modus === 'login' ? 'Inloggen' : 'Account aanmaken'}
          </button>
        </form>
      </div>
    </div>
  )
}
