import { useEffect, useState } from 'react'

// Kopieert een tekst naar het klembord en zegt twee tellen lang dat het gelukt
// is. navigator.clipboard bestaat enkel op https en op localhost; op een gewone
// http-verbinding is hij er niet en zeggen we dat, in plaats van een knop die
// stil niets doet.
export default function KopieerKnop({
  tekst,
  label = 'Kopiëren',
}: {
  tekst: string
  label?: string
}) {
  const [stand, setStand] = useState<'rust' | 'gelukt' | 'mislukt'>('rust')

  useEffect(() => {
    if (stand === 'rust') return
    const teller = setTimeout(() => setStand('rust'), 2500)
    return () => clearTimeout(teller)
  }, [stand])

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(tekst)
      setStand('gelukt')
    } catch {
      setStand('mislukt')
    }
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={kopieer}
        className="text-sm font-medium text-merk whitespace-nowrap"
      >
        {stand === 'gelukt' ? 'Gekopieerd' : label}
      </button>
      {stand === 'mislukt' && (
        <p className="mt-1 text-xs text-zacht">Kopiëren lukt hier niet, selecteer het zelf.</p>
      )}
    </div>
  )
}
