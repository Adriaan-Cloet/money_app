import { useState } from 'react'
import Modal from '../Modal'
import { useWijzigWachtwoord } from '../../queries/gebruikers'
import { authFoutTekst } from '../../queries/fouten'

// Supabase eist zelf minstens 6 tekens; die grens staat hier zodat je de
// melding krijgt voor je op de server botst.
const MIN_TEKENS = 6

const VELD = 'w-full border border-rand-sterk rounded-lg px-3 py-2.5 text-sm'

// Zie GebruikersnaamModal voor waarom het formulier een eigen component is.
function Formulier({ onClose }: { onClose: () => void }) {
  const [nieuw, setNieuw] = useState('')
  const [herhaal, setHerhaal] = useState('')
  const [fout, setFout] = useState<string | null>(null)
  const [gelukt, setGelukt] = useState(false)
  const wijzig = useWijzigWachtwoord()

  function bewaar() {
    if (nieuw.length < MIN_TEKENS) {
      setFout(`Gebruik minstens ${MIN_TEKENS} tekens.`)
      return
    }
    if (nieuw !== herhaal) {
      setFout('De twee wachtwoorden zijn niet gelijk.')
      return
    }
    setFout(null)
    wijzig.mutate(nieuw, {
      onSuccess: () => setGelukt(true),
      onError: (e) => setFout(authFoutTekst(e)),
    })
  }

  if (gelukt) {
    return (
      <>
        <p className="text-sm text-zacht mb-4">
          Je wachtwoord is gewijzigd. Je blijft op dit toestel ingelogd.
        </p>
        <button
          onClick={onClose}
          className="w-full bg-merk-vlak text-merk-op rounded-lg py-2.5 text-sm font-medium"
        >
          Sluiten
        </button>
      </>
    )
  }

  return (
    <>
      <input
        autoFocus
        type="password"
        autoComplete="new-password"
        placeholder="Nieuw wachtwoord"
        value={nieuw}
        onChange={(e) => setNieuw(e.target.value)}
        className={VELD}
      />
      <input
        type="password"
        autoComplete="new-password"
        placeholder="Nogmaals ter controle"
        value={herhaal}
        onChange={(e) => setHerhaal(e.target.value)}
        className={`${VELD} mt-2`}
      />
      {fout && <p className="mt-2 text-sm text-gevaar">{fout}</p>}
      <div className="flex gap-2 mt-4">
        <button
          onClick={onClose}
          className="flex-1 border border-rand-sterk rounded-lg py-2.5 text-sm"
        >
          Annuleren
        </button>
        <button
          onClick={bewaar}
          disabled={wijzig.isPending || nieuw === '' || herhaal === ''}
          className="flex-1 bg-merk-vlak text-merk-op rounded-lg py-2.5 text-sm font-medium disabled:opacity-60"
        >
          Bewaren
        </button>
      </div>
    </>
  )
}

export default function WachtwoordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} titel="Wachtwoord wijzigen" onClose={onClose}>
      <Formulier onClose={onClose} />
    </Modal>
  )
}
