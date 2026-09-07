// De pillen zijn de enige plek met kleuren buiten de tokens uit index.css:
// blauw, amber, groen en rood staan hier voor een betekenis, niet voor een rol
// in de opbouw van het scherm. In dark mode kan een -50-achtergrond niet, die
// is bijna wit; daar wordt het een doorschijnende tint van dezelfde kleur met
// lichte tekst erop.
const stijl: Record<string, { label: string; klasse: string }> = {
  open: {
    label: 'Open',
    klasse: 'bg-blue-50 text-blue-700 donker:bg-blue-400/15 donker:text-blue-300',
  },
  deels_betaald: {
    label: 'Deels betaald',
    klasse: 'bg-amber-50 text-amber-700 donker:bg-amber-400/15 donker:text-amber-300',
  },
  betaald: {
    label: 'Betaald',
    klasse: 'bg-green-50 text-green-700 donker:bg-green-400/15 donker:text-green-300',
  },
  geweigerd: { label: 'Geweigerd', klasse: 'bg-gray-100 text-zacht donker:bg-white/10' },
  gemeld: {
    label: 'Gemeld',
    klasse: 'bg-blue-50 text-blue-700 donker:bg-blue-400/15 donker:text-blue-300',
  },
  bevestigd: {
    label: 'Bevestigd',
    klasse: 'bg-green-50 text-green-700 donker:bg-green-400/15 donker:text-green-300',
  },
  fout: {
    label: 'Fout gemeld',
    klasse: 'bg-red-50 text-red-700 donker:bg-red-400/15 donker:text-red-300',
  },
}

export default function StatusPill({ status }: { status: string }) {
  const s = stijl[status] ?? { label: status, klasse: 'bg-gray-100 text-zacht donker:bg-white/10' }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.klasse}`}>{s.label}</span>
  )
}
