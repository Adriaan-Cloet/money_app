// IBAN-hulpjes. Eén afspraak: bewaren doen we genormaliseerd (zonder spaties,
// in hoofdletters), tonen doen we per vier tekens. Zo staat er nooit een spatie
// in de database en leest het scherm toch als op een bankuittreksel.

export const IBAN_UITLEG = 'Een rekeningnummer ziet eruit als BE68 5390 0754 7034.'
export const IBAN_ONGELDIG = 'Dat is geen geldig rekeningnummer.'

// De vorm die ook de check-constraint in de database afdwingt: twee letters
// land, twee controlecijfers, en dan 11 tot 30 letters of cijfers.
const VORM = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/

export function normaliseerIban(waarde: string): string {
  return waarde.replace(/[\s.-]/g, '').toUpperCase()
}

export function formatIban(waarde: string): string {
  return (normaliseerIban(waarde).match(/.{1,4}/g) ?? []).join(' ')
}

// Het controlegetal volgens ISO 13616 (mod-97). De eerste vier tekens gaan naar
// achteren, elke letter wordt zijn plaats in het alfabet plus 9 (A wordt 10), en
// van het getal dat overblijft moet de rest bij deling door 97 gelijk zijn aan 1.
export function isGeldigeIban(waarde: string): boolean {
  const iban = normaliseerIban(waarde)
  if (!VORM.test(iban)) return false

  const verplaatst = iban.slice(4) + iban.slice(0, 4)
  const cijfers = verplaatst.replace(/[A-Z]/g, (letter) => String(letter.charCodeAt(0) - 55))

  // Dat getal is veel te groot voor een gewone number, dus we delen cijfer per
  // cijfer en houden enkel de rest bij.
  let rest = 0
  for (const cijfer of cijfers) rest = (rest * 10 + Number(cijfer)) % 97
  return rest === 1
}
