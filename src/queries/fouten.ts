import { GeenVerbindingFout, isOnbereikbaar } from './verbinding'
import { vertaalAuthFout } from '../services/authFouten'

// Twee foutgevallen zijn op elk scherm hetzelfde: je bent offline, of de server
// antwoordt niet. Die staan hier een keer, zodat elk domein enkel nog zijn
// eigen databasefouten hoeft te vertalen.
//
// Geeft null als het géén verbindingsprobleem is. De aanroeper kijkt dan verder.
export function verbindingFoutTekst(fout: unknown): string | null {
  if (fout instanceof GeenVerbindingFout) return fout.message
  if (isOnbereikbaar(fout)) return 'Geen verbinding met de server. Probeer het straks opnieuw.'
  return null
}

// De foutcode van supabase-js, of null. Let op: dit is een plat object, geen
// Error-instantie, dus je kan er niet met instanceof op mikken.
export function foutCode(fout: unknown): string | null {
  if (typeof fout !== 'object' || fout === null) return null
  const code = (fout as { code?: unknown }).code
  return typeof code === 'string' && code !== '' ? code : null
}

// De boodschap van supabase-js, of null.
export function foutBoodschap(fout: unknown): string | null {
  if (typeof fout !== 'object' || fout === null) return null
  const boodschap = (fout as { message?: unknown }).message
  return typeof boodschap === 'string' && boodschap !== '' ? boodschap : null
}

export const ALGEMENE_FOUT = 'Er ging iets mis. Probeer het opnieuw.'

// De standaardvertaling voor schermen zonder eigen domeinfouten: eerst de
// verbindingsgevallen, dan de ruwe boodschap van de database.
//
// Die ruwe boodschap is een bewuste keuze. Ze komt hier vooral van de
// RLS-policies ("new row violates row-level security policy") en zegt precies
// welke regel je raakte. De schermen deden dat voor deze story ook al zo.
export function databaseFoutTekst(fout: unknown): string | null {
  if (!fout) return null
  return verbindingFoutTekst(fout) ?? foutBoodschap(fout) ?? ALGEMENE_FOUT
}

// Voor de authacties (e-mail en wachtwoord wijzigen). Eerst de twee
// verbindingsgevallen, dan de vertaling van de authcode.
export function authFoutTekst(fout: unknown): string | null {
  if (!fout) return null
  return (
    verbindingFoutTekst(fout) ??
    vertaalAuthFout({ code: foutCode(fout), message: foutBoodschap(fout) ?? '' })
  )
}
