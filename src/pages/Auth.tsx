import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, registreer } from '../services/auth'
import { vertaalAuthFout } from '../services/authFouten'

type Modus = 'login' | 'registreer'

export default function Auth() {
  const [modus, setModus] = useState<Modus>('login')
  const [naam, setNaam] = useState('')
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const navigate = useNavigate()

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    setFout(null)
    setBezig(true)

    const { error } =
      modus === 'login'
        ? await login(email, wachtwoord)
        : await registreer(email, wachtwoord, naam)

    setBezig(false)

    if (error) {
      setFout(vertaalAuthFout(error))
      return
    }
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 p-6">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#3B6D11] text-white text-2xl font-medium inline-flex items-center justify-center mb-3">
            €
          </div>
          <h1 className="text-xl font-medium text-[#3B6D11]">PayMeBack</h1>
          <p className="text-sm text-gray-500 mt-1">Samen simpel afrekenen</p>
        </div>

        <div className="flex border-b border-gray-200 mb-5">
          <button
            type="button"
            onClick={() => setModus('login')}
            className={`flex-1 py-2 text-sm ${
              modus === 'login'
                ? 'border-b-2 border-[#3B6D11] font-medium'
                : 'text-gray-500'
            }`}
          >
            Inloggen
          </button>
          <button
            type="button"
            onClick={() => setModus('registreer')}
            className={`flex-1 py-2 text-sm ${
              modus === 'registreer'
                ? 'border-b-2 border-[#3B6D11] font-medium'
                : 'text-gray-500'
            }`}
          >
            Registreren
          </button>
        </div>

        <form onSubmit={verstuur} className="space-y-3">
          {modus === 'registreer' && (
            <input
              type="text"
              placeholder="Naam"
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
            />
          )}
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
          />
          <input
            type="password"
            placeholder="Wachtwoord"
            value={wachtwoord}
            onChange={(e) => setWachtwoord(e.target.value)}
            required
            minLength={6}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
          />

          {fout && <p className="text-sm text-red-600">{fout}</p>}

          <button
            type="submit"
            disabled={bezig}
            className="w-full bg-[#3B6D11] text-white rounded-lg py-3 text-sm font-medium disabled:opacity-60"
          >
            {bezig ? 'Bezig...' : modus === 'login' ? 'Inloggen' : 'Account aanmaken'}
          </button>
        </form>
      </div>
    </div>
  )
}
