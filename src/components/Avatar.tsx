// Rond avatartje met de initialen van een naam of gebruikersnaam.
export default function Avatar({ naam, klein = false }: { naam: string; klein?: boolean }) {
  const initialen = (naam || '?')
    .trim()
    .split(/[\s_]+/)
    .map((deel) => deel[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const maat = klein ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  return (
    <div
      className={`${maat} shrink-0 rounded-full bg-[#EAF3DE] text-[#3B6D11] font-medium flex items-center justify-center`}
    >
      {initialen}
    </div>
  )
}
