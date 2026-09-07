import Modal from './Modal'

export type Optie<T extends string> = { waarde: T; label: string; uitleg?: string }

// Eén keuze uit een lijstje, met een vinkje bij wat er nu aan staat. Kiezen
// sluit meteen: er valt niets te bevestigen, je ziet het resultaat direct.
export default function KeuzeModal<T extends string>({
  open,
  titel,
  opties,
  gekozen,
  onKies,
  onClose,
}: {
  open: boolean
  titel: string
  opties: Optie<T>[]
  gekozen: T
  onKies: (waarde: T) => void
  onClose: () => void
}) {
  return (
    <Modal open={open} titel={titel} onClose={onClose}>
      <ul className="-mx-1">
        {opties.map((optie) => {
          const actief = optie.waarde === gekozen
          return (
            <li key={optie.waarde}>
              <button
                type="button"
                onClick={() => {
                  onKies(optie.waarde)
                  onClose()
                }}
                className="w-full flex items-center gap-3 px-1 py-3 text-left"
              >
                <span className="flex-1 min-w-0">
                  <span className={`block text-sm ${actief ? 'font-medium text-merk' : ''}`}>
                    {optie.label}
                  </span>
                  {optie.uitleg && (
                    <span className="block text-xs text-zacht mt-0.5">{optie.uitleg}</span>
                  )}
                </span>
                {actief && (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-merk shrink-0"
                    aria-hidden="true"
                  >
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}
