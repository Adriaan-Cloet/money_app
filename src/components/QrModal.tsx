import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import Modal from './Modal'
import { formatIban } from '../utils/iban'
import { bouwSepaPayload, qrProbleem, QR_TIP, QR_TIP_BOVEN, QR_TIP_BEDRAG } from '../utils/sepaQr'

// De QR met jouw eigen rekeningnummer, om aan de ander te tonen. Bewust niet
// andersom: je kan je eigen scherm niet scannen, dus een QR van het nummer dat
// jij moet betalen helpt je niet. Daar staat de kopieerknop voor.
//
// Het bedrag staat voorgevuld op wat er openstaat maar blijft aanpasbaar: je
// spreekt vaak een deel af, of je wil er iets bij dat niet in de app staat.

function Inhoud({
  naam,
  iban,
  voorstelBedrag,
  onClose,
}: {
  naam: string
  iban: string
  voorstelBedrag: number
  onClose: () => void
}) {
  const [bedragTekst, setBedragTekst] = useState(
    voorstelBedrag > 0 ? voorstelBedrag.toFixed(2).replace('.', ',') : '',
  )
  const [mededeling, setMededeling] = useState('')

  const bedrag = Number.parseFloat(bedragTekst.replace(',', '.'))
  const gegevens = { naam, iban, bedrag, mededeling }
  const probleem = qrProbleem(gegevens)
  const bovenDeTip = Number.isFinite(bedrag) && bedrag > QR_TIP_BEDRAG

  return (
    <>
      <input
        autoFocus
        type="text"
        inputMode="decimal"
        placeholder="0,00"
        value={bedragTekst}
        onChange={(e) => setBedragTekst(e.target.value)}
        style={{ fontSize: '1.25rem' }}
        className="w-full border border-rand-sterk rounded-lg px-3 py-3 font-medium text-merk"
      />

      {/* De grens staat er altijd bij, ook als het bedrag er ruim onder blijft:
          je moet ze kennen op het moment dat je het bedrag intikt. Boven de
          grens wordt het een waarschuwing, maar de QR blijft gewoon staan. */}
      {bovenDeTip ? (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 donker:border-amber-400/25 donker:bg-amber-400/10 donker:text-amber-200">
          {QR_TIP_BOVEN}
        </p>
      ) : (
        <p className="mt-2 text-xs text-zacht">{QR_TIP}</p>
      )}

      <input
        type="text"
        placeholder="Mededeling (optioneel)"
        value={mededeling}
        onChange={(e) => setMededeling(e.target.value)}
        maxLength={140}
        className="mt-3 w-full border border-rand-sterk rounded-lg px-3 py-2.5 text-sm"
      />

      {probleem ? (
        <p className="mt-4 text-sm text-zacht">{probleem}</p>
      ) : (
        <div className="mt-4 flex flex-col items-center">
          {/* Vaste witte grond en zwarte blokjes, ook in dark mode: een scanner
              rekent op dat contrast, dus dit is een van de weinige plekken waar
              de kleurtokens niet gelden. */}
          <div className="rounded-xl bg-white p-3">
            <QRCodeSVG
              value={bouwSepaPayload(gegevens)}
              size={200}
              level="M"
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
          <p className="mt-3 text-center text-xs text-zacht">
            Laat dit scannen met de scanfunctie in de bankapp, niet met de camera. Er vertrekt niets
            zonder dat de ander het in zijn bank bevestigt.
          </p>
          <p className="mt-2 text-center text-xs text-flauw">{formatIban(iban)}</p>
        </div>
      )}

      <button
        onClick={onClose}
        className="mt-4 w-full border border-rand-sterk rounded-lg py-2.5 text-sm"
      >
        Sluiten
      </button>
    </>
  )
}

// Zonder rekeningnummer valt er niets te tonen. Dan wijst de modal de weg in
// plaats van leeg te blijven.
function GeenNummer({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  return (
    <>
      <p className="text-sm text-zacht">
        Vul eerst je eigen rekeningnummer in. Dan kan je hier een QR tonen die de ander met zijn
        bankapp scant.
      </p>
      <div className="flex gap-2 mt-4">
        <button
          onClick={onClose}
          className="flex-1 border border-rand-sterk rounded-lg py-2.5 text-sm"
        >
          Sluiten
        </button>
        <button
          onClick={() => navigate('/instellingen')}
          className="flex-1 bg-merk-vlak text-merk-op rounded-lg py-2.5 text-sm font-medium"
        >
          Naar instellingen
        </button>
      </div>
    </>
  )
}

export default function QrModal({
  open,
  naam,
  iban,
  voorstelBedrag,
  onClose,
}: {
  open: boolean
  naam: string
  iban: string | null
  voorstelBedrag: number
  onClose: () => void
}) {
  // De inhoud staat in een aparte component zodat ze bij het sluiten uit de boom
  // verdwijnt en het bedrag bij een volgende opening opnieuw voorgevuld staat.
  return (
    <Modal open={open} titel="Laat scannen" onClose={onClose}>
      {iban ? (
        <Inhoud naam={naam} iban={iban} voorstelBedrag={voorstelBedrag} onClose={onClose} />
      ) : (
        <GeenNummer onClose={onClose} />
      )}
    </Modal>
  )
}
