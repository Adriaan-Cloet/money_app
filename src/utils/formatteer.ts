// Opmaak voor de UI. Stond eerder als kopie in Home, VriendDetail en PersoonDetail.

// Toont een bedrag altijd zonder teken. Het teken hoort in de tekst ernaast
// ("Jij moet" of "Jij krijgt"), niet in het getal zelf.
export const formatEuro = (bedrag: number) => '€ ' + Math.abs(bedrag).toFixed(2).replace('.', ',')

// Van de ISO-datum uit de database (2026-09-06) naar Belgische notatie (06-09-2026).
export const formatDatum = (datum: string) => datum.split('-').reverse().join('-')
