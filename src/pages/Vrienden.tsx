import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  useVrienden,
  useVriendschapsverzoeken,
  useZoekGebruiker,
  useStuurVriendschapsverzoek,
  useAanvaardVerzoek,
  useWeigerVerzoek,
  useOntvriend,
  vriendFoutTekst,
  type Vriend,
} from '../queries/vrienden'
import { legeStatusTekst } from '../queries/status'
import Avatar from '../components/Avatar'
import BevestigModal from '../components/BevestigModal'

export default function Vrienden() {
  const [zoekterm, setZoekterm] = useState('')
  const [teVerwijderenVriend, setTeVerwijderenVriend] = useState<Vriend | null>(null)

  const vrienden = useVrienden()
  const verzoeken = useVriendschapsverzoeken()
  const zoek = useZoekGebruiker()
  const stuurVerzoek = useStuurVriendschapsverzoek()
  const aanvaard = useAanvaardVerzoek()
  const weiger = useWeigerVerzoek()
  const ontvriend = useOntvriend()

  const vriendenLijst = vrienden.data ?? []
  const verzoekenLijst = verzoeken.data ?? []
  const legeTekst = legeStatusTekst(vrienden)

  // Het zoekresultaat zit in zoek.data: undefined zolang je niet gezocht hebt,
  // null als er niemand met die naam bestaat, anders de gevonden gebruiker.
  const resultaat = zoek.data ?? null
  const zoekFout = vriendFoutTekst(zoek.error)
  const verzoekFout = vriendFoutTekst(
    stuurVerzoek.error ?? aanvaard.error ?? weiger.error ?? ontvriend.error,
  )

  function zoekGebruiker(e: FormEvent) {
    e.preventDefault()
    const naam = zoekterm.trim()
    if (!naam) return
    stuurVerzoek.reset()
    zoek.mutate(naam)
  }

  function voegToe() {
    if (!resultaat) return
    stuurVerzoek.mutate(resultaat.id, {
      onSuccess: () => {
        // Het zoekvak leegmaken hoort bij het gelukte verzoek, niet bij het
        // versturen: mislukt het, dan blijft de gevonden persoon staan zodat je
        // opnieuw kan proberen.
        zoek.reset()
        setZoekterm('')
      },
    })
  }

  function ontvriendVriend() {
    if (!teVerwijderenVriend) return
    ontvriend.mutate(teVerwijderenVriend.vriendschap_id)
    setTeVerwijderenVriend(null)
  }

  return (
    <div>
      <h1 className="text-2xl font-medium text-tekst mb-5">Vrienden</h1>

      <form onSubmit={zoekGebruiker} className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder="Zoek op gebruikersnaam"
          value={zoekterm}
          onChange={(e) => setZoekterm(e.target.value)}
          className="flex-1 border border-rand-sterk rounded-lg px-3 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={zoek.isPending}
          className="bg-merk-vlak text-merk-op rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-60"
        >
          {zoek.isPending ? 'Bezig...' : 'Zoek'}
        </button>
      </form>

      {zoekFout && <p className="text-sm text-zacht mb-3">{zoekFout}</p>}
      {zoek.isSuccess && resultaat === null && (
        <p className="text-sm text-zacht mb-3">Geen gebruiker met die gebruikersnaam gevonden.</p>
      )}
      {verzoekFout && <p className="text-sm text-gevaar mb-3">{verzoekFout}</p>}
      {stuurVerzoek.isSuccess && <p className="text-sm text-merk mb-3">Verzoek verstuurd.</p>}

      {resultaat && (
        <div className="flex items-center gap-3 bg-vlak border border-rand rounded-2xl px-4 py-3 mb-4">
          <Avatar naam={resultaat.gebruikersnaam} />
          <span className="flex-1 text-sm font-medium">{resultaat.gebruikersnaam}</span>
          <button
            onClick={voegToe}
            disabled={stuurVerzoek.isPending}
            className="bg-merk-vlak text-merk-op rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-60"
          >
            Verzoek sturen
          </button>
        </div>
      )}

      {verzoekenLijst.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-medium text-flauw mb-2">Inkomende verzoeken</p>
          <ul className="space-y-2">
            {verzoekenLijst.map((verzoek) => (
              <li
                key={verzoek.vriendschap_id}
                className="flex items-center gap-3 bg-vlak border border-rand rounded-2xl px-4 py-3"
              >
                <Avatar naam={verzoek.gebruikersnaam} />
                <span className="flex-1 text-sm font-medium">{verzoek.gebruikersnaam}</span>
                <button
                  onClick={() => aanvaard.mutate(verzoek.vriendschap_id)}
                  disabled={aanvaard.isPending || weiger.isPending}
                  className="text-merk text-sm font-medium disabled:opacity-60"
                >
                  Accepteren
                </button>
                <button
                  onClick={() => weiger.mutate(verzoek.vriendschap_id)}
                  disabled={aanvaard.isPending || weiger.isPending}
                  className="text-flauw text-sm disabled:opacity-60"
                >
                  Weigeren
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs font-medium text-flauw mb-2">Mijn vrienden</p>
      {legeTekst ? (
        <p className="text-sm text-zacht">{legeTekst}</p>
      ) : vriendenLijst.length === 0 ? (
        <p className="text-sm text-zacht">Nog geen vrienden.</p>
      ) : (
        <ul className="space-y-2">
          {vriendenLijst.map((vriend) => (
            <li
              key={vriend.gebruiker_id}
              className="flex items-center gap-3 bg-vlak border border-rand rounded-2xl px-4 py-3"
            >
              <Link
                to={`/vriend/${vriend.gebruiker_id}`}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <Avatar naam={vriend.gebruikersnaam} />
                <span className="text-sm font-medium truncate">{vriend.gebruikersnaam}</span>
              </Link>
              <button
                onClick={() => setTeVerwijderenVriend(vriend)}
                className="text-flauw text-sm shrink-0"
              >
                Verwijderen
              </button>
            </li>
          ))}
        </ul>
      )}

      <BevestigModal
        open={teVerwijderenVriend !== null}
        titel="Vriend verwijderen?"
        tekst={`${teVerwijderenVriend?.gebruikersnaam ?? 'Deze vriend'} wordt verwijderd. Alle terugvragen en betalingen tussen jullie worden ook definitief gewist.`}
        onBevestig={ontvriendVriend}
        onClose={() => setTeVerwijderenVriend(null)}
      />
    </div>
  )
}
