const stijl: Record<string, { label: string; klasse: string }> = {
  open: { label: 'Open', klasse: 'bg-blue-50 text-blue-700' },
  deels_betaald: { label: 'Deels betaald', klasse: 'bg-amber-50 text-amber-700' },
  betaald: { label: 'Betaald', klasse: 'bg-green-50 text-green-700' },
  geweigerd: { label: 'Geweigerd', klasse: 'bg-gray-100 text-gray-500' },
  gemeld: { label: 'Gemeld', klasse: 'bg-blue-50 text-blue-700' },
  bevestigd: { label: 'Bevestigd', klasse: 'bg-green-50 text-green-700' },
  wacht: { label: 'In afwachting', klasse: 'bg-amber-50 text-amber-700' },
  fout: { label: 'Fout gemeld', klasse: 'bg-red-50 text-red-700' },
}

export default function StatusPill({ status }: { status: string }) {
  const s = stijl[status] ?? { label: status, klasse: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.klasse}`}>{s.label}</span>
  )
}
