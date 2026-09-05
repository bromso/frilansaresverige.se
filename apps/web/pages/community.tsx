import HubPage from '../components/HubPage'

const Community = () => (
  <HubPage
    path="/community"
    eyebrow="Community"
    heading="Människorna bakom sajten"
    intro={
      <p>
        Frilansare Sverige drivs av sina medlemmar: ideellt, gratis och med
        öppen källkod. Här hittar du vilka vi är, vad som händer just nu, vad
        som gäller i Slacken och hur du når oss.
      </p>
    }
    links={[
      {
        href: '/nyheter',
        label: 'Nyheter',
        text: 'Det senaste från communityt, sajten och frilanslivet.',
        icon: 'icon-[lucide--newspaper]',
      },
      {
        href: '/event',
        label: 'Event',
        text: 'AW:er, workshops och årsmöten. Gratis och öppna för alla medlemmar.',
        icon: 'icon-[lucide--calendar]',
      },
      {
        href: '/om',
        label: 'Om oss',
        text: 'Varför communityt finns och hur det drivs.',
        icon: 'icon-[lucide--heart-handshake]',
      },
      {
        href: '/uppforandekod',
        label: 'Uppförandekod',
        text: 'Reglerna som håller Slacken schysst och hjälpsam.',
        icon: 'icon-[lucide--scale]',
      },
      {
        href: '/kontakt',
        label: 'Kontakt',
        text: 'Frågor om medlemskap, press eller sajten.',
        icon: 'icon-[lucide--mail]',
      },
    ]}
  />
)

export default Community
