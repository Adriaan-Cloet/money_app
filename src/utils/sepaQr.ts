// EPC069-12: de inhoud van een SEPA-QR, waarmee een bankapp een overschrijving
// vooraf invult. De payload is platte tekst van twaalf regels, meer niet. Er is
// geen backend voor nodig: de bank leest gewoon wat er in de QR staat.
//
// Let op wat dit wel en niet is: dit vult enkel het overschrijvingsscherm in.
// Er vertrekt geen geld zonder dat de ander in zijn bankapp bevestigt.

import { isGeldigeIban, normaliseerIban } from './iban'

// De grens uit de standaard zelf. Absurd hoog, maar boven dit bedrag kan er
// letterlijk geen geldige payload gemaakt worden.
export const EPC_MAX_BEDRAG = 999999999.99

// Vuistregel, geen regel van de standaard: veel bankapps houden een limiet rond
// dit bedrag aan voor een betaling die je met een QR start. We blokkeren er dus
// niets mee, we zeggen het enkel bij het invullen. Staat hier als één constante
// zodat het bijstellen één regel is.
export const QR_TIP_BEDRAG = 250
export const QR_TIP = `Veel bankapps beperken een QR-betaling tot ongeveer ${QR_TIP_BEDRAG} euro.`
export const QR_TIP_BOVEN = `Dit is meer dan de ongeveer ${QR_TIP_BEDRAG} euro die veel bankapps toelaten. Proberen mag, je bank kan het weigeren.`

// De QR mag hoogstens 331 bytes bevatten, zodat hij op foutcorrectieniveau M in
// een QR van versie 13 past. We controleren dat niet per geval: de naam is op 70
// tekens afgekapt en de mededeling op 140, dus de langst mogelijke payload komt
// op 277 bytes uit. Een test in sepaQr.test.ts houdt die rekensom eerlijk als de
// grenzen ooit wijzigen.
export const MAX_BYTES = 331

const MAX_NAAM = 70
const MAX_MEDEDELING = 140

export type SepaGegevens = {
  naam: string
  iban: string
  bedrag: number
  mededeling?: string
}

// De standaard laat enkel de Latijnse basistekens toe. Accenten halen we eraf in
// plaats van het teken weg te gooien, zodat Cloët nog altijd Cloet leest en niet
// Clot.
function schoon(tekst: string, maxLengte: number): string {
  return tekst
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // de losse accenttekens uit NFD
    .replace(/[^A-Za-z0-9/?:().,'+ -]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLengte)
}

// Het bedrag met een punt en altijd twee decimalen: EUR12.50.
function formatBedrag(bedrag: number): string {
  return 'EUR' + bedrag.toFixed(2)
}

export function bouwSepaPayload({ naam, iban, bedrag, mededeling = '' }: SepaGegevens): string {
  return [
    'BCD', // service tag
    '002', // versie
    '1', // tekenset 1 = UTF-8
    'SCT', // SEPA Credit Transfer
    '', // BIC, mag leeg blijven bij versie 002
    schoon(naam, MAX_NAAM),
    normaliseerIban(iban),
    formatBedrag(bedrag),
    '', // purpose
    '', // gestructureerde mededeling
    schoon(mededeling, MAX_MEDEDELING),
    '', // informatie voor de begunstigde
  ].join('\n')
}

export function aantalBytes(payload: string): number {
  return new TextEncoder().encode(payload).length
}

// Geeft terug waarom er geen QR gemaakt kan worden, of null als het wel lukt.
// Bewust een reden en geen boolean: het scherm moet kunnen zeggen wat er scheelt.
export function qrProbleem(gegevens: SepaGegevens): string | null {
  if (!isGeldigeIban(gegevens.iban)) return 'Er is geen geldig rekeningnummer ingevuld.'
  if (!Number.isFinite(gegevens.bedrag) || gegevens.bedrag < 0.01) return 'Vul een bedrag in.'
  if (gegevens.bedrag > EPC_MAX_BEDRAG) return 'Dit bedrag is te groot voor een QR-code.'
  return null
}
