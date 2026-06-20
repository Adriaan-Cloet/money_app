import Modal from './Modal'

export default function BevestigModal({
  open,
  titel,
  tekst,
  bevestigLabel = 'Verwijderen',
  onBevestig,
  onClose,
}: {
  open: boolean
  titel: string
  tekst?: string
  bevestigLabel?: string
  onBevestig: () => void
  onClose: () => void
}) {
  return (
    <Modal open={open} titel={titel} onClose={onClose}>
      {tekst && <p className="text-sm text-gray-600 mb-4">{tekst}</p>}
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm">
          Annuleren
        </button>
        <button
          onClick={onBevestig}
          className="flex-1 bg-red-600 text-white rounded-lg py-2.5 text-sm font-medium"
        >
          {bevestigLabel}
        </button>
      </div>
    </Modal>
  )
}
