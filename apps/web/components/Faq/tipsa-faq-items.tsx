import type { FaqItem } from './faq-items'

// FAQ for the /tipsa page — the questions companies and tipsters ask,
// as opposed to the membership questions in faq-items.tsx.
export const TIPSA_FAQ_ITEMS: FaqItem[] = [
  {
    icon: 'icon-[lucide--wallet]',
    question: 'Vad kostar det att tipsa?',
    answer:
      'Ingenting. Att tipsa om ett uppdrag är gratis — inga förmedlingsavgifter, inga procent på timpriset och inga mellanhänder. Frilansarna tar kontakt med dig direkt.',
    answerText:
      'Ingenting. Att tipsa om ett uppdrag är gratis — inga förmedlingsavgifter, inga procent på timpriset och inga mellanhänder. Frilansarna tar kontakt med dig direkt.',
  },
  {
    icon: 'icon-[lucide--megaphone]',
    question: 'Vad händer med mitt tips?',
    answer:
      'Vi tittar igenom tipset och publicerar det i uppdragskanalen i vår Slack, där det når tusentals frilansare. Intresserade hör av sig till dig via den kontaktväg du angett.',
    answerText:
      'Vi tittar igenom tipset och publicerar det i uppdragskanalen i vår Slack, där det når tusentals frilansare. Intresserade hör av sig till dig via den kontaktväg du angett.',
  },
  {
    icon: 'icon-[lucide--building-2]',
    question: 'Måste jag vara medlem för att tipsa?',
    answer:
      'Nej. Medlemskapet är för frilansare, men vem som helst — företag, myndigheter eller privatpersoner — får tipsa om uppdrag som passar en frilansare.',
    answerText:
      'Nej. Medlemskapet är för frilansare, men vem som helst — företag, myndigheter eller privatpersoner — får tipsa om uppdrag som passar en frilansare.',
  },
  {
    icon: 'icon-[lucide--list-checks]',
    question: 'Vad ska ett bra tips innehålla?',
    answer:
      'Roll, plats eller distans, omfattning och önskad start — och gärna en prisbild. Ju tydligare tips, desto fler och bättre svar. Skriv också hur frilansarna enklast når dig.',
    answerText:
      'Roll, plats eller distans, omfattning och önskad start — och gärna en prisbild. Ju tydligare tips, desto fler och bättre svar. Skriv också hur frilansarna enklast når dig.',
  },
]
