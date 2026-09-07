import { useState } from 'react'
import Modal from '../Modal'
import { useWijzigGebruikersnaam, profielFoutTekst } from '../../queries/gebruikers'
import { GEBRUIKERSNAAM_PATROON, GEBRUIKERSNAAM_UITLEG } from '../../services/auth'

// Het formulier staat apart zodat het bij het sluiten echt verdwijnt: Modal
// rendert niets als hij dicht is, dus deze component wordt uit de boom gehaald
// en begint bij het heropenen met een leeg veld en zonder oude foutmelding.
// Dat scheelt een effect dat bij elke opening alle state terugzet.
function Formulier({ huidig, onClose }: { huidig: string; onClose: () => void }) {
  const [waarde, setWaarde] = useState(huidig)
  const [fout, setFout] = useState<string | null>(null)
  const wijzig = useWijzigGebruikersnaam()

  function bewaar() {
    const nieuw = waarde.trim()
    if (!GEBRUIKERSNAAM_PATROON.test(nieuw)) {
      setFout(GEBRUIKERSNAAM_UITLEG)
      return
    }
    setFout(null)
    wijzig.mutate(
      { nieuw, huidig },
      { onSuccess: onClose, onError: (e) => setFout(profielFoutTekst(e)) },
    )
  }

  return (
    <>
      <input
        autoFocus
        type="text"
        autoCapitalize="none"
        autoCorrect="off"
        value={waarde}
        onChange={(e) => setWaarde(e.target.value)}
        className="w-full border border-rand-sterk rounded-lg px-3 py-2.5 text-sm"
      />
      <p className="mt-2 text-xs text-zacht">
        Zo vinden vrienden je terug. {GEBRUIKERSNAAM_UITLEG}
      </p>
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
          disabled={wijzig.isPending || waarde.trim() === huidig}
          className="flex-1 bg-merk-vlak text-merk-op rounded-lg py-2.5 text-sm font-medium disabled:opacity-60"
        >
          Bewaren
        </button>
      </div>
    </>
  )
}

export default function GebruikersnaamModal({
  open,
  huidig,
  onClose,
}: {
  open: boolean
  huidig: string
  onClose: () => void
}) {
  return (
    <Modal open={open} titel="Gebruikersnaam wijzigen" onClose={onClose}>
      <Formulier huidig={huidig} onClose={onClose} />
    </Modal>
  )
}
