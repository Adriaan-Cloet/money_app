import type { AuthError } from '@supabase/supabase-js'

// Vertaalt Supabase-authfouten naar nette Nederlandse meldingen.
// We kijken eerst naar de foutcode (stabiel), met de tekst als terugval.
const perCode: Record<string, string> = {
  invalid_credentials: 'E-mail of wachtwoord is onjuist.',
  email_not_confirmed: 'Bevestig eerst je e-mailadres via de mail die we stuurden.',
  user_already_exists: 'Er bestaat al een account met dit e-mailadres.',
  email_exists: 'Er bestaat al een account met dit e-mailadres.',
  weak_password: 'Je wachtwoord is te zwak. Gebruik minstens 6 tekens.',
  over_request_rate_limit: 'Te veel pogingen. Probeer het straks opnieuw.',
  over_email_send_rate_limit: 'Te veel pogingen. Probeer het straks opnieuw.',
  validation_failed: 'Controleer je e-mailadres en wachtwoord.',
}

export function vertaalAuthFout(error: AuthError): string {
  if (error.code && perCode[error.code]) return perCode[error.code]

  const tekst = error.message.toLowerCase()
  if (tekst.includes('invalid login credentials')) return perCode.invalid_credentials
  if (tekst.includes('already registered') || tekst.includes('already exists'))
    return perCode.user_already_exists
  if (tekst.includes('email not confirmed')) return perCode.email_not_confirmed
  if (tekst.includes('password')) return perCode.weak_password

  return 'Er ging iets mis. Probeer het opnieuw.'
}
