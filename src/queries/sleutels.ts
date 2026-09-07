// Elke gecachte query hangt aan een sleutel. Twee regels houden dit werkbaar.
//
// Eerst: het gebruikers-id zit altijd in de sleutel. De cache blijft op het
// toestel staan na een herstart, dus zonder dat id zou de data van twee
// accounts op hetzelfde toestel door elkaar lopen. wisCache() bij een
// gebruikerswissel vangt dat al op, maar dit is de tweede sluiting op de deur.
//
// Dan: de sleutels lopen van breed naar smal, zodat het begin van een sleutel
// een hele groep aanduidt. invalidateQueries met ['posten', mij] hervraagt zo
// alle postenlijsten in een keer, zonder ze op te sommen. Daarom hangt onder
// elke groep ook een laatste segment ('lijst', 'alle', ...): zo bezit geen
// enkele query de groepssleutel zelf en blijft die puur om te invalideren.

export const sleutels = {
  profiel: (mij: string | null) => ['profiel', mij] as const,

  vrienden: (mij: string | null) => ['vrienden', mij, 'lijst'] as const,
  verzoeken: (mij: string | null) => ['vrienden', mij, 'verzoeken'] as const,
  alleVrienden: (mij: string | null) => ['vrienden', mij] as const,

  contacten: (mij: string | null) => ['contacten', mij, 'lijst'] as const,
  contact: (mij: string | null, contactId: string) => ['contacten', mij, 'een', contactId] as const,
  alleContacten: (mij: string | null) => ['contacten', mij] as const,

  postenAlsSchuldeiser: (mij: string | null) => ['posten', mij, 'als-schuldeiser'] as const,
  postenAlsSchuldenaar: (mij: string | null) => ['posten', mij, 'als-schuldenaar'] as const,
  postenVanContact: (mij: string | null, contactId: string) =>
    ['posten', mij, 'van-contact', contactId] as const,
  postenVanVriend: (mij: string | null, vriendId: string) =>
    ['posten', mij, 'van-vriend', vriendId] as const,
  allePosten: (mij: string | null) => ['posten', mij] as const,

  mijnBetalingen: (mij: string | null) => ['betalingen', mij, 'alle'] as const,
  inkomendeBetalingen: (mij: string | null, vriendId: string) =>
    ['betalingen', mij, 'inkomend', vriendId] as const,
  uitgaandeBetalingen: (mij: string | null, vriendId: string) =>
    ['betalingen', mij, 'uitgaand', vriendId] as const,
  alleBetalingen: (mij: string | null) => ['betalingen', mij] as const,
}
