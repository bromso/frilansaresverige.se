import Link from 'next/link'
import HubPage from '../../components/HubPage'

const Uppdrag = () => (
  <HubPage
    path="/uppdrag"
    eyebrow="Uppdrag"
    heading="Lediga frilans- och konsultuppdrag"
    intro={
      <p>
        Uppdragen i Frilansare Sverige kommer från medlemmar och företag som
        tipsar communityt direkt — utvecklare, designers, skribenter,
        projektledare och fler. Inga mellanhänder: du tar kontakt med
        uppdragsgivaren själv.
      </p>
    }
    links={[
      {
        href: 'https://uppdrag.frilansaresverige.se/',
        label: 'Öppna uppdragsportalen',
        text: 'Alla aktuella uppdrag från communityt, samlade på ett ställe.',
        icon: 'icon-[lucide--briefcase-business]',
        external: true,
      },
      {
        href: '/tipsa',
        label: 'Tipsa om ett uppdrag',
        text: 'Har du ett uppdrag som passar en frilansare? Tipsa gratis.',
        icon: 'icon-[lucide--megaphone]',
      },
    ]}
  >
    <p className="mt-10 max-w-[36em] leading-[1.6] text-brand-cream/70">
      Är du inte medlem än?{' '}
      <Link href="/ansokan" className="underline hover:no-underline">
        Ansök om medlemskap
      </Link>{' '}
      så får du uppdragstipsen direkt i Slack.
    </p>
  </HubPage>
)

export default Uppdrag
