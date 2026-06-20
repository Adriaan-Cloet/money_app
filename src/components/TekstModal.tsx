import { useState } from 'react'
import Modal from './Modal'

export default function TekstModal({
  open,
  titel,
  placeholder,
  onBevestig,
  onClose,
}: {
  open: boolean
  titel: string
  placeholder: string
  onBevestig: (tekst: string) => void
  onClose: () => void
}) {
  const [waarde, setWaarde] = useState('')

  function sluit() {
    setWaarde('')
    onClose()
  }

  function bevestig() {
    if (!waarde.trim()) return
    const tekst = waarde.trim()
    setWaarde('')
    onBevestig(tekst)
  }

  return (
    <Modal open={open} titel={titel} onClose={sluit}>
      <input
        autoFocus
        type="text"
        placeholder={placeholder}
        value={waarde}
        onChange={(e) => setWaarde(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mb-2"
      />
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
