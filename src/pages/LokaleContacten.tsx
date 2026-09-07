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
import { formatIban, isGeldigeIban, normaliseerIban, IBAN_ONGELDIG } from '../utils/iban'
import BevestigModal from '../components/BevestigModal'

export default function LokaleContacten() {
  const [nieuweNaam, setNieuweNaam] = useState('')
  const [bewerktId, setBewerktId] = useState<string | null>(null)
  const [bewerkNaam, setBewerkNaam] = useState('')
  // Het rekeningnummer van een contact beheer je zelf: die persoon heeft geen
  // account, dus het komt nergens anders vandaan.
  const [bewerkIban, setBewerkIban] = useState('')
  const [bewerkFout, setBewerkFout] = useState<string | null>(null)
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

  function startBewerken(contact: LokaalContact) {
    setBewerktId(contact.id)
    setBewerkNaam(contact.naam)
    setBewerkIban(contact.iban ? formatIban(contact.iban) : '')
    setBewerkFout(null)
  }

  function bewaarBewerking(id: string) {
    const naam = bewerkNaam.trim()
    if (!naam) return

    const iban = normaliseerIban(bewerkIban)
    if (iban !== '' && !isGeldigeIban(iban)) {
      setBewerkFout(IBAN_ONGELDIG)
      return
    }

    setBewerkFout(null)
    wijzig.mutate({ id, naam, iban: iban || null }, { onSuccess: () => setBewerktId(null) })
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
            <li key={contact.id} className="bg-vlak border border-rand rounded-2xl px-4 py-3">
              {bewerktId === contact.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    autoFocus
                    value={bewerkNaam}
                    onChange={(e) => setBewerkNaam(e.target.value)}
                    className="w-full border border-rand-sterk rounded-lg px-2 py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    placeholder="Rekeningnummer (optioneel)"
                    value={bewerkIban}
                    onChange={(e) => setBewerkIban(e.target.value)}
                    className="w-full border border-rand-sterk rounded-lg px-2 py-1.5 text-sm"
                  />
                  {bewerkFout && <p className="text-sm text-gevaar">{bewerkFout}</p>}
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setBewerktId(null)} className="text-flauw text-sm">
                      Annuleren
                    </button>
                    <button
                      onClick={() => bewaarBewerking(contact.id)}
                      disabled={bezig}
                      className="text-merk text-sm font-medium disabled:opacity-60"
                    >
                      Bewaren
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Avatar naam={contact.naam} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{contact.naam}</p>
                    {contact.iban && (
                      <p className="text-xs text-flauw truncate">{formatIban(contact.iban)}</p>
                    )}
                  </div>
                  <button onClick={() => startBewerken(contact)} className="text-flauw text-sm">
                    Bewerken
                  </button>
                  <button onClick={() => setTeVerwijderen(contact)} className="text-gevaar text-sm">
                    Verwijderen
                  </button>
                </div>
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
