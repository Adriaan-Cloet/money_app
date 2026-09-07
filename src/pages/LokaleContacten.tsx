import { useState } from 'react'
import type { FormEvent } from 'react'
import type { LokaalContact } from '../services/lokaleContacten'
import {
  useLokaleContacten,
  useMaakLokaalContact,
  useWijzigLokaalContact,
  useVerwijderLokaalContact,
  contactFoutTekst,
} from '../queries/lokaleContacten'
import { legeStatusTekst } from '../queries/status'
import Avatar from '../components/Avatar'
import BevestigModal from '../components/BevestigModal'

export default function LokaleContacten() {
  const [nieuweNaam, setNieuweNaam] = useState('')
  const [bewerktId, setBewerktId] = useState<string | null>(null)
  const [bewerkNaam, setBewerkNaam] = useState('')
  const [teVerwijderen, setTeVerwijderen] = useState<LokaalContact | null>(null)

  const contacten = useLokaleContacten()
  const maak = useMaakLokaalContact()
  const wijzig = useWijzigLokaalContact()
  const verwijder = useVerwijderLokaalContact()

  // De versie/herlaad-truc is weg: elke mutatie invalideert zelf de sleutel van
  // de contactenlijst, waarna React Query ze opnieuw ophaalt.
  const lijst = contacten.data ?? []
  const legeTekst = legeStatusTekst(contacten)
  const fout = contactFoutTekst(maak.error ?? wijzig.error ?? verwijder.error)
  const bezig = maak.isPending || wijzig.isPending || verwijder.isPending

  function voegToe(e: FormEvent) {
    e.preventDefault()
    const naam = nieuweNaam.trim()
    if (!naam) return
    // mutate met een onSuccess, niet await: zo hoeven we de fout hier niet op te
    // vangen. Die staat al in maak.error en komt via `fout` op het scherm.
    maak.mutate(naam, { onSuccess: () => setNieuweNaam('') })
  }

  function bewaarBewerking(id: string) {
    const naam = bewerkNaam.trim()
    if (!naam) return
    wijzig.mutate({ id, naam }, { onSuccess: () => setBewerktId(null) })
  }

  function verwijderContact() {
    if (!teVerwijderen) return
    verwijder.mutate(teVerwijderen.id)
    setTeVerwijderen(null)
  }

  return (
    <div>
      <h1 className="text-2xl font-medium text-tekst mb-5">Contacten</h1>

      <form onSubmit={voegToe} className="flex gap-2 mb-5">
        <input
          type="text"
          placeholder="Naam van een lokaal contact"
          value={nieuweNaam}
          onChange={(e) => setNieuweNaam(e.target.value)}
          className="flex-1 border border-rand-sterk rounded-lg px-3 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={bezig}
          className="bg-merk-vlak text-merk-op rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-60"
        >
          Toevoegen
        </button>
      </form>

      {fout && <p className="text-sm text-gevaar mb-3">{fout}</p>}

      {legeTekst ? (
        <p className="text-sm text-zacht">{legeTekst}</p>
      ) : lijst.length === 0 ? (
        <p className="text-sm text-zacht">Nog geen lokale contacten.</p>
      ) : (
        <ul className="space-y-2">
          {lijst.map((contact) => (
            <li
              key={contact.id}
              className="flex items-center gap-3 bg-vlak border border-rand rounded-2xl px-4 py-3"
            >
              {bewerktId === contact.id ? (
                <>
                  <input
                    type="text"
                    autoFocus
                    value={bewerkNaam}
                    onChange={(e) => setBewerkNaam(e.target.value)}
                    className="flex-1 border border-rand-sterk rounded-lg px-2 py-1.5 text-sm"
                  />
                  <button
                    onClick={() => bewaarBewerking(contact.id)}
                    disabled={bezig}
                    className="text-merk text-sm font-medium disabled:opacity-60"
                  >
                    Bewaren
                  </button>
                  <button onClick={() => setBewerktId(null)} className="text-flauw text-sm">
                    Annuleren
                  </button>
                </>
              ) : (
                <>
                  <Avatar naam={contact.naam} />
                  <span className="flex-1 text-sm font-medium">{contact.naam}</span>
                  <button
                    onClick={() => {
                      setBewerktId(contact.id)
                      setBewerkNaam(contact.naam)
                    }}
                    className="text-flauw text-sm"
                  >
                    Bewerken
                  </button>
                  <button onClick={() => setTeVerwijderen(contact)} className="text-gevaar text-sm">
                    Verwijderen
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <BevestigModal
        open={teVerwijderen !== null}
        titel="Contact verwijderen?"
        tekst={`${teVerwijderen?.naam ?? 'Dit contact'} en al zijn terugvragen worden verwijderd. Dit kan niet ongedaan gemaakt worden.`}
        onBevestig={verwijderContact}
        onClose={() => setTeVerwijderen(null)}
      />
    </div>
  )
}
