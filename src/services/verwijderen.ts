import type { Tables } from '../models/database.types'

// Wie mag wat verwijderen (US-022). Dezelfde regels staan als RLS-policy in
// migratie 20260907071142, en dat is de plek waar ze afgedwongen worden. Ze
// staan hier een tweede keer omdat het scherm ze vooraf moet kennen: een knop
// die stil niets doet is erger dan een knop die grijs staat met uitleg.
//
// Net als in verrekening.ts nemen deze functies een Pick van de databaserij, zodat
// een test geen volledige rij hoeft na te bouwen en dit bestand de Supabase-client
// niet meesleept.

export type PostVoorVerwijderen = Pick<Tables<'schuldposten'>, 'gedekt_bedrag'>

export type BetalingVoorVerwijderen = Pick<
  Tables<'betalingen'>,
  'status' | 'betaler_gebruiker_id' | 'ontvanger_id'
>

// Zodra er dekking op een post staat, is er een bevestigde betaling via FIFO aan
// toegewezen. Die post weghalen laat geld achter dat nergens meer heen kan, en
// daar heeft de app nog geen antwoord op. De uitweg is een tegenboeking: een
// nieuwe post in de andere richting met het foute bedrag.
export const magPostWeg = (post: PostVoorVerwijderen) => post.gedekt_bedrag === 0

export const POST_GEBLOKKEERD = 'Hier is al op betaald. Boek het tegen met een nieuwe post.'

// Wie de betaling aanmaakte, hangt af van hoe ze ontstond: via maakBetaling is
// dat de betaler, via registreer_contactbetaling en registreer_vriendbetaling de
// ontvanger. Die laatste twee staan meteen op 'bevestigd', dus in de praktijk
// blijft enkel de betaler over. De ontvanger die een melding niet vertrouwt,
// meldt ze fout; verwijderen is aan de maker.
export const magBetalingWeg = (betaling: BetalingVoorVerwijderen, mij: string) =>
  betaling.status !== 'bevestigd' &&
  mij === (betaling.betaler_gebruiker_id ?? betaling.ontvanger_id)
