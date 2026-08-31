import {
  type NotificationMessage,
  NotificationStack,
} from '@frilansaresverige/ui/ui/notification-stack'

// The "Utan mellanhänder" bento card's notification mock: fictional gig
// tips cycling through the ui package's NotificationStack.
const MESSAGES: NotificationMessage[] = [
  {
    icon: 'icon-[lucide--briefcase-business]',
    title: 'Nytt uppdragstips — Frontendutvecklare',
    body: 'direktkontakt · 950 kr/h · #uppdrag',
  },
  {
    icon: 'icon-[lucide--pen-tool]',
    title: 'Nytt uppdragstips — UX-designer',
    body: 'distans · 900 kr/h · #uppdrag',
  },
  {
    icon: 'icon-[lucide--text]',
    title: 'Nytt uppdragstips — Teknisk skribent',
    body: 'direktkontakt · 780 kr/h · #uppdrag',
  },
  {
    icon: 'icon-[lucide--chart-line]',
    title: 'Nytt uppdragstips — Projektledare',
    body: 'hybrid · 880 kr/h · #uppdrag',
  },
  {
    icon: 'icon-[lucide--camera]',
    title: 'Nytt uppdragstips — Fotograf',
    body: 'Stockholm · 7 500 kr/dag · #uppdrag',
  },
]

const GigToastStack = ({ reduced }: { reduced: boolean }) => (
  <NotificationStack messages={MESSAGES} reduced={reduced} />
)

export default GigToastStack
