import type { ReactNode } from 'react'

// Eenvoudige gecentreerde modal met overlay. Vervangt de browser-popups.
export default function Modal({
  open,
  titel,
  onClose,
  children,
}: {
  open: boolean
  titel: string
  onClose: () => void
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-medium mb-4">{titel}</h2>
        {children}
      </div>
    </div>
  )
}
