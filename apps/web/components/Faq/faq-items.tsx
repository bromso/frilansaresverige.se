import Link from 'next/link'
import type { ReactNode } from 'react'

// FAQ data shared by the /ansokan page (a trimmed preview) and the full
// /fragor-och-svar page. answerText is a plain-text mirror of answer, used
// for the FAQPage JSON-LD on /fragor-och-svar — answers are strings except
// one, which links to /tipsa and gets a hand-written plain-text mirror.
export interface FaqItem {
  icon: string
  question: string
  answer: ReactNode
  answerText: string
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    icon: 'icon-[lucide--users]',
    question: 'Vem kan bli medlem?',
    answer:
      'Communityt är till för dig som redan är igång som frilansare — med ett bolag att fakturera genom och minst en kund. Alla branscher är välkomna: utvecklare, designers, skribenter, fotografer, projektledare, ekonomer och många fler.',
    answerText:
      'Communityt är till för dig som redan är igång som frilansare — med ett bolag att fakturera genom och minst en kund. Alla branscher är välkomna: utvecklare, designers, skribenter, fotografer, projektledare, ekonomer och många fler.',
  },
  {
    icon: 'icon-[lucide--wallet]',
    question: 'Vad kostar medlemskapet?',
    answer:
      'Ingenting. Det finns ingen medlemsavgift, inga premiumnivåer och inga mellanhänder — communityt drivs av medlemmarna själva.',
    answerText:
      'Ingenting. Det finns ingen medlemsavgift, inga premiumnivåer och inga mellanhänder — communityt drivs av medlemmarna själva.',
  },
  {
    icon: 'icon-[lucide--send]',
    question: 'Hur går ansökan till?',
    answer:
      'Berätta kort om vad du gör och länka till din LinkedIn — det tar bara ett par minuter. Vi tittar på ansökan och godkänner dig som redan är igång som frilansare.',
    answerText:
      'Berätta kort om vad du gör och länka till din LinkedIn — det tar bara ett par minuter. Vi tittar på ansökan och godkänner dig som redan är igång som frilansare.',
  },
  {
    icon: 'icon-[lucide--party-popper]',
    question: 'Vad händer när jag blivit godkänd?',
    answer:
      'Du får en inbjudan till vår Slack via mejl. Hoppa in, presentera dig och hitta kanalerna som passar din bransch eller din stad.',
    answerText:
      'Du får en inbjudan till vår Slack via mejl. Hoppa in, presentera dig och hitta kanalerna som passar din bransch eller din stad.',
  },
  {
    icon: 'icon-[simple-icons--slack]',
    question: 'Var händer allt?',
    answer:
      'Allt händer i vår Slack — trådar, kanaler och direktmeddelanden. Där delar medlemmarna uppdrag, kunskap och kollegskap varje dag.',
    answerText:
      'Allt händer i vår Slack — trådar, kanaler och direktmeddelanden. Där delar medlemmarna uppdrag, kunskap och kollegskap varje dag.',
  },
  {
    icon: 'icon-[lucide--briefcase]',
    question: 'Jag söker en konsult — ska jag också ansöka?',
    answer: (
      <>
        Nej, medlemskapet är för frilansare. Har du eller ditt företag ett
        konsultbehov kan du i stället{' '}
        <Link href="/tipsa" className="underline hover:no-underline">
          tipsa om uppdraget
        </Link>{' '}
        — gratis och utan mellanhänder.
      </>
    ),
    answerText:
      'Nej, medlemskapet är för frilansare. Har du eller ditt företag ett konsultbehov kan du i stället tipsa om uppdraget — gratis och utan mellanhänder.',
  },
]
