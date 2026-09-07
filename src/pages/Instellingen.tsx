import { useState } from 'react'
import { logout } from '../services/auth'
import { useProfiel } from '../queries/gebruikers'
import { useAuth } from '../context/AuthContext'
import { useThema, THEMA_LABEL, type Thema } from '../utils/thema'
import { formatLangeDatum } from '../utils/formatteer'
import { Sectie, Rij } from '../components/Lijst'
import KeuzeModal from '../components/KeuzeModal'
import BevestigModal from '../components/BevestigModal'
import GebruikersnaamModal from '../components/instellingen/GebruikersnaamModal'
import EmailModal from '../components/instellingen/EmailModal'
import WachtwoordModal from '../components/instellingen/WachtwoordModal'

// Welke modal er openstaat. Eén stukje state in plaats van een boolean per
// rij: er kan er toch maar één tegelijk open zijn.
type Open = 'gebruikersnaam' | 'email' | 'wachtwoord' | 'thema' | 'uitloggen' | null

const THEMA_OPTIES: { waarde: Thema; label: string; uitleg?: string }[] = [
  { waarde: 'licht', label: THEMA_LABEL.licht },
  { waarde: 'donker', label: THEMA_LABEL.donker },
  { waarde: 'systeem', label: THEMA_LABEL.systeem, uitleg: 'Volgt de instelling van je toestel.' },
]

export default function Instellingen() {
  // Uitloggen wist de hele cache. Dat gebeurt niet hier maar in AuthContext,
  // via bewaakCacheEigenaar op de sessiewijziging, zodat het ook klopt als de
  // sessie op een andere manier verdwijnt.
  const profiel = useProfiel()
  const { session } = useAuth()
  const { thema, kies } = useThema()
  const [open, setOpen] = useState<Open>(null)

  const gebruikersnaam = profiel.data?.gebruikersnaam ?? '...'
  // Het e-mailadres komt uit de sessie en niet uit de tabel: bij een wijziging
  // is de sessie als eerste bij, de kolom `gebruikers.email` volgt pas na de
  // bevestigingsmail.
  const email = session?.user.email ?? '...'
  const sluit = () => setOpen(null)

  return (
    <div>
      <h1 className="text-2xl font-medium text-tekst mb-6">Instellingen</h1>

      <Sectie titel="Profiel">
        <Rij
          label="Gebruikersnaam"
          waarde={gebruikersnaam}
          onClick={() => setOpen('gebruikersnaam')}
        />
        <Rij label="E-mailadres" waarde={email} onClick={() => setOpen('email')} />
        <Rij label="Wachtwoord" waarde="Wijzigen" onClick={() => setOpen('wachtwoord')} />
      </Sectie>

      <Sectie titel="Weergave">
        <Rij label="Thema" waarde={THEMA_LABEL[thema]} onClick={() => setOpen('thema')} />
      </Sectie>

      <Sectie titel="Account">
        <Rij label="Uitloggen" gevaar onClick={() => setOpen('uitloggen')} />
        <Rij label="Versie" waarde={formatLangeDatum(__GEBOUWD_OP__)} />
      </Sectie>

      <GebruikersnaamModal
        open={open === 'gebruikersnaam'}
        huidig={gebruikersnaam}
        onClose={sluit}
      />
      <EmailModal open={open === 'email'} huidig={email} onClose={sluit} />
      <WachtwoordModal open={open === 'wachtwoord'} onClose={sluit} />
      <KeuzeModal
        open={open === 'thema'}
        titel="Thema"
        opties={THEMA_OPTIES}
        gekozen={thema}
        onKies={kies}
        onClose={sluit}
      />
      <BevestigModal
        open={open === 'uitloggen'}
        titel="Uitloggen?"
        tekst="Je gegevens op dit toestel worden gewist. Je kan altijd opnieuw inloggen."
        bevestigLabel="Uitloggen"
        onBevestig={() => {
          sluit()
          logout()
        }}
        onClose={sluit}
      />
    </div>
  )
}
