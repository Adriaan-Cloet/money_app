import { useState } from 'react'
import Modal from '../Modal'
import { useWijzigEmail } from '../../queries/gebruikers'
import { authFoutTekst } from '../../queries/fouten'

// Zie GebruikersnaamModal voor waarom het formulier een eigen component is.
function Formulier({ huidig, onClose }: { huidig: string; onClose: () => void }) {
  const [waarde, setWaarde] = useState('')
  const [fout, setFout] = useState<string | null>(null)
  // Het adres wijzigt niet meteen: Supabase stuurt eerst een bevestigingsmail.
  // Daarom sluit deze modal niet bij succes maar legt hij uit wat er nu volgt.
  const [verstuurdNaar, setVerstuurdNaar] = useState<string | null>(null)
  const wijzig = useWijzigEmail()

  function bewaar() {
    const nieuw = waarde.trim()
    if (!/^\S+@\S+\.\S+$/.test(nieuw)) {
      setFout('Vul een geldig e-mailadres in.')
      return
    }
    setFout(null)
    wijzig.mutate(nieuw, {
      onSuccess: () => setVerstuurdNaar(nieuw),
      onError: (e) => setFout(authFoutTekst(e)),
    })
  }

  if (verstuurdNaar) {
    return (
      <>
        <p className="text-sm text-zacht mb-4">
          We stuurden een bevestigingsmail naar <span className="text-tekst">{verstuurdNaar}</span>.
          Je adres wijzigt pas als je die link aanklikt. Tot dan log je in met{' '}
          <span className="text-tekst">{huidig}</span>.
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
      <p className="text-sm text-zacht mb-3">
        Je logt nu in met <span className="text-tekst">{huidig}</span>.
      </p>
      <input
        autoFocus
        type="email"
        inputMode="email"
        autoCapitalize="none"
        autoCorrect="off"
        placeholder="nieuw@adres.be"
        value={waarde}
        onChange={(e) => setWaarde(e.target.value)}
        className="w-full border border-rand-sterk rounded-lg px-3 py-2.5 text-sm"
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
          disabled={wijzig.isPending || waarde.trim() === ''}
          className="flex-1 bg-merk-vlak text-merk-op rounded-lg py-2.5 text-sm font-medium disabled:opacity-60"
        >
          Versturen
        </button>
      </div>
    </>
  )
}

export default function EmailModal({
  open,
  huidig,
  onClose,
}: {
  open: boolean
  huidig: string
  onClose: () => void
}) {
  return (
    <Modal open={open} titel="E-mailadres wijzigen" onClose={onClose}>
      <Formulier huidig={huidig} onClose={onClose} />
    </Modal>
  )
}
