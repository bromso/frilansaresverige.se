import type { FaqItem } from './faq-items'

// FAQ for the /tipsa page — the questions companies and tipsters ask,
// as opposed to the membership questions in faq-items.tsx.
export const TIPSA_FAQ_ITEMS: FaqItem[] = [
  {
    icon: 'icon-[lucide--wallet]',
    question: 'Vad kostar det att tipsa?',
    answer:
      'Ingenting. Inga förmedlingsavgifter, ingen procent på timpriset och ingen mellanhand. Frilansarna kontaktar dig direkt, och ni gör upp om villkoren själva.',
    answerText:
      'Ingenting. Inga förmedlingsavgifter, ingen procent på timpriset och ingen mellanhand. Frilansarna kontaktar dig direkt, och ni gör upp om villkoren själva.',
  },
  {
    icon: 'icon-[lucide--megaphone]',
    question: 'Vad händer med mitt tips?',
    answer:
      'En av oss läser igenom tipset och publicerar det i uppdragskanalen i vår Slack, där det når tusentals frilansare. Intresserade hör av sig via den kontaktväg du angett, ofta redan samma dag.',
    answerText:
      'En av oss läser igenom tipset och publicerar det i uppdragskanalen i vår Slack, där det når tusentals frilansare. Intresserade hör av sig via den kontaktväg du angett, ofta redan samma dag.',
  },
  {
    icon: 'icon-[lucide--building-2]',
    question: 'Måste jag vara medlem för att tipsa?',
    answer:
      'Nej. Medlemskapet är för frilansare, men alla får tipsa om uppdrag som passar en frilansare: företag, myndigheter, byråer, konsultbolag och privatpersoner.',
    answerText:
      'Nej. Medlemskapet är för frilansare, men alla får tipsa om uppdrag som passar en frilansare: företag, myndigheter, byråer, konsultbolag och privatpersoner.',
  },
  {
    icon: 'icon-[lucide--list-checks]',
    question: 'Vad ska ett bra tips innehålla?',
    answer:
      'Roll, plats eller distans, omfattning, önskad start och gärna en prisbild. Ju tydligare tips, desto fler och bättre svar. Skriv också hur frilansarna enklast når dig.',
    answerText:
      'Roll, plats eller distans, omfattning, önskad start och gärna en prisbild. Ju tydligare tips, desto fler och bättre svar. Skriv också hur frilansarna enklast når dig.',
  },
  {
    icon: 'icon-[lucide--handshake]',
    question:
      'Jag jobbar på en förmedlare eller ett konsultbolag. Får jag tipsa?',
    answer:
      'Ja, så länge du är öppen med det. Ange i tipset om frilansaren skriver avtal med er eller direkt med slutkunden, så vet alla vad som gäller från början.',
    answerText:
      'Ja, så länge du är öppen med det. Ange i tipset om frilansaren skriver avtal med er eller direkt med slutkunden, så vet alla vad som gäller från början.',
  },
]
