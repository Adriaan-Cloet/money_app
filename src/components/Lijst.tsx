import type { ReactNode } from 'react'

// Een gegroepeerde lijst zoals in de instellingen van een telefoon: een kopje
// met daaronder een kaart vol rijen, gescheiden door een lijn. De opzet die
// US-023 vroeg: een instelling erbij is één <Rij>, geen nieuw scherm.
export function Sectie({ titel, children }: { titel: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <p className="text-xs font-medium text-flauw mb-2">{titel}</p>
      <div className="bg-vlak border border-rand rounded-2xl divide-y divide-rand overflow-hidden">
        {children}
      </div>
    </section>
  )
}

function Pijl() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-flauw shrink-0"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

// Zonder onClick is het een regel die enkel iets toont, zoals de versie. Met
// onClick wordt het een knop met een pijl erachter.
export function Rij({
  label,
  waarde,
  onClick,
  gevaar = false,
}: {
  label: string
  waarde?: string
  onClick?: () => void
  gevaar?: boolean
}) {
  const inhoud = (
    <>
      <span className={`text-sm shrink-0 ${gevaar ? 'text-gevaar font-medium' : 'text-tekst'}`}>
        {label}
      </span>
      <span className="flex items-center gap-1.5 min-w-0">
        {waarde && <span className="text-sm text-zacht truncate">{waarde}</span>}
        {onClick && !gevaar && <Pijl />}
      </span>
    </>
  )

  const klassen = 'w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left'
  if (!onClick) return <div className={klassen}>{inhoud}</div>
  return (
    <button type="button" onClick={onClick} className={klassen}>
      {inhoud}
    </button>
  )
}
