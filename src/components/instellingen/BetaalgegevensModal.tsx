import { useState } from 'react'
import Modal from '../Modal'
import { useWijzigBetaalgegevens, profielFoutTekst } from '../../queries/gebruikers'
import {
  formatIban,
  isGeldigeIban,
  normaliseerIban,
  IBAN_ONGELDIG,
  IBAN_UITLEG,
} from '../../utils/iban'

// Zelfde opzet als de andere instellingenmodals: het formulier staat in een
// binnencomponent, zodat het bij het sluiten uit de boom verdwijnt en bij het
// heropenen vanzelf opnieuw met de bewaarde waarden begint.
function Formulier({
  huidigeIban,
  huidigeRekeninghouder,
  onClose,
}: {
  huidigeIban: string | null
  huidigeRekeninghouder: string | null
  onClose: () => void
}) {
  const [iban, setIban] = useState(huidigeIban ? formatIban(huidigeIban) : '')
  const [rekeninghouder, setRekeninghouder] = useState(huidigeRekeninghouder ?? '')
  const [fout, setFout] = useState<string | null>(null)
  const wijzig = useWijzigBetaalgegevens()

  function bewaar() {
    const genormaliseerd = normaliseerIban(iban)

    // Leeg veld betekent weghalen. De naam van de rekeninghouder gaat dan mee
    // weg, want die zegt niets zonder nummer.
    if (genormaliseerd === '') {
      setFout(null)
      wijzig.mutate(
        { iban: null, rekeninghouder: null },
        { onSuccess: onClose, onError: (e) => setFout(profielFoutTekst(e)) },
      )
      return
    }

    if (!isGeldigeIban(genormaliseerd)) {
      setFout(IBAN_ONGELDIG)
      return
    }

    setFout(null)
    wijzig.mutate(
      { iban: genormaliseerd, rekeninghouder: rekeninghouder.trim() || null },
      { onSuccess: onClose, onError: (e) => setFout(profielFoutTekst(e)) },
    )
  }

  return (
    <>
      <input
        autoFocus
        type="text"
        inputMode="text"
        autoCapitalize="characters"
        autoCorrect="off"
        placeholder="BE68 5390 0754 7034"
        value={iban}
        onChange={(e) => setIban(e.target.value)}
        className="w-full border border-rand-sterk rounded-lg px-3 py-2.5 text-sm"
      />
      <input
        type="text"
        placeholder="Naam op de rekening (optioneel)"
        value={rekeninghouder}
        onChange={(e) => setRekeninghouder(e.target.value)}
        className="mt-2 w-full border border-rand-sterk rounded-lg px-3 py-2.5 text-sm"
      />
      <p className="mt-2 text-xs text-zacht">
        Je vrienden in de app zien dit nummer en kunnen het kopiëren. {IBAN_UITLEG} Laat het veld
        leeg om het weer weg te halen.
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
          disabled={wijzig.isPending}
          className="flex-1 bg-merk-vlak text-merk-op rounded-lg py-2.5 text-sm font-medium disabled:opacity-60"
        >
          Bewaren
        </button>
      </div>
    </>
  )
}

export default function BetaalgegevensModal({
  open,
  huidigeIban,
  huidigeRekeninghouder,
  onClose,
}: {
  open: boolean
  huidigeIban: string | null
  huidigeRekeninghouder: string | null
  onClose: () => void
}) {
  return (
    <Modal open={open} titel="Rekeningnummer" onClose={onClose}>
      <Formulier
        huidigeIban={huidigeIban}
        huidigeRekeninghouder={huidigeRekeninghouder}
        onClose={onClose}
      />
    </Modal>
  )
}
