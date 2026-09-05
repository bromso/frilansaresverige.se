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
      'Alla som redan är igång som frilansare, alltså har ett bolag eller en enskild firma att fakturera genom och minst en kund. Bransch spelar ingen roll: här finns utvecklare, designers, skribenter, fotografer, projektledare, ekonomer och många fler. Bor du i Sverige är du välkommen oavsett ort.',
    answerText:
      'Alla som redan är igång som frilansare, alltså har ett bolag eller en enskild firma att fakturera genom och minst en kund. Bransch spelar ingen roll: här finns utvecklare, designers, skribenter, fotografer, projektledare, ekonomer och många fler. Bor du i Sverige är du välkommen oavsett ort.',
  },
  {
    icon: 'icon-[lucide--wallet]',
    question: 'Vad kostar medlemskapet?',
    answer:
      'Ingenting. Det finns ingen medlemsavgift, inga premiumnivåer och ingen som tjänar pengar på communityt. Allt drivs ideellt av medlemmarna själva, och du kan lämna när du vill.',
    answerText:
      'Ingenting. Det finns ingen medlemsavgift, inga premiumnivåer och ingen som tjänar pengar på communityt. Allt drivs ideellt av medlemmarna själva, och du kan lämna när du vill.',
  },
  {
    icon: 'icon-[lucide--send]',
    question: 'Hur går ansökan till?',
    answer:
      'Du fyller i ett kort formulär: vad du gör, hur länge du frilansat, ditt bolag och en länk till din LinkedIn. Det tar ett par minuter. Sedan tittar en av oss på ansökan, oftast inom några dagar.',
    answerText:
      'Du fyller i ett kort formulär: vad du gör, hur länge du frilansat, ditt bolag och en länk till din LinkedIn. Det tar ett par minuter. Sedan tittar en av oss på ansökan, oftast inom några dagar.',
  },
  {
    icon: 'icon-[lucide--party-popper]',
    question: 'Vad händer när jag blivit godkänd?',
    answer:
      'Du får en inbjudan till vår Slack via mejl. Hoppa in, säg hej i välkomstkanalen och leta upp kanalerna för din bransch och din stad. Sedan är du igång.',
    answerText:
      'Du får en inbjudan till vår Slack via mejl. Hoppa in, säg hej i välkomstkanalen och leta upp kanalerna för din bransch och din stad. Sedan är du igång.',
  },
  {
    icon: 'icon-[simple-icons--slack]',
    question: 'Var händer allt?',
    answer:
      'I vår Slack. Där finns kanaler för branscher, städer och ämnen som prissättning, avtal och fakturering, plus uppdragskanalen där tipsen delas. Trådar för frågor, direktmeddelanden när du vill ta något vidare.',
    answerText:
      'I vår Slack. Där finns kanaler för branscher, städer och ämnen som prissättning, avtal och fakturering, plus uppdragskanalen där tipsen delas. Trådar för frågor, direktmeddelanden när du vill ta något vidare.',
  },
  {
    icon: 'icon-[lucide--briefcase]',
    question: 'Jag är inte frilansare än, kan jag ändå gå med?',
    answer:
      'Inte riktigt än. Communityt bygger på att alla delar samma vardag, så vi väntar med att säga ja tills du har ditt bolag och din första kund på plats. Sök gärna igen då, vi ser fram emot det.',
    answerText:
      'Inte riktigt än. Communityt bygger på att alla delar samma vardag, så vi väntar med att säga ja tills du har ditt bolag och din första kund på plats. Sök gärna igen då, vi ser fram emot det.',
  },
  {
    icon: 'icon-[lucide--building-2]',
    question: 'Jag söker en konsult. Ska jag också ansöka?',
    answer: (
      <>
        Nej, medlemskapet är för frilansare. Har du eller ditt företag ett
        konsultbehov kan du i stället{' '}
        <Link href="/tipsa" className="underline hover:no-underline">
          tipsa om uppdraget
        </Link>
        . Det är gratis, och frilansarna hör av sig direkt till dig.
      </>
    ),
    answerText:
      'Nej, medlemskapet är för frilansare. Har du eller ditt företag ett konsultbehov kan du i stället tipsa om uppdraget. Det är gratis, och frilansarna hör av sig direkt till dig.',
  },
]
