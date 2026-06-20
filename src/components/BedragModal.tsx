import { useState } from 'react'
import Modal from './Modal'

export default function BedragModal({
  open,
  titel,
  onBevestig,
  onClose,
}: {
  open: boolean
  titel: string
  onBevestig: (bedrag: number) => void
  onClose: () => void
}) {
  const [waarde, setWaarde] = useState('')
  const [fout, setFout] = useState<string | null>(null)

  function sluit() {
    setWaarde('')
    setFout(null)
    onClose()
  }

  function bevestig() {
    const bedrag = Number.parseFloat(waarde.replace(',', '.'))
    if (!Number.isFinite(bedrag) || bedrag <= 0) {
      setFout('Vul een geldig bedrag in.')
      return
    }
    setWaarde('')
    setFout(null)
    onBevestig(bedrag)
  }

  return (
    <Modal open={open} titel={titel} onClose={sluit}>
      <input
        autoFocus
        type="text"
        inputMode="decimal"
        placeholder="0,00"
        value={waarde}
        onChange={(e) => setWaarde(e.target.value)}
        style={{ fontSize: '1.25rem' }}
        className="w-full border border-gray-300 rounded-lg px-3 py-3 font-medium text-[#3B6D11] mb-2"
      />
      {fout && <p className="text-sm text-red-600 mb-2">{fout}</p>}
      <div className="flex gap-2 mt-2">
        <button onClick={sluit} className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm">
          Annuleren
        </button>
        <button
          onClick={bevestig}
          className="flex-1 bg-[#3B6D11] text-white rounded-lg py-2.5 text-sm font-medium"
        >
          Bevestigen
        </button>
      </div>
    </Modal>
  )
}
