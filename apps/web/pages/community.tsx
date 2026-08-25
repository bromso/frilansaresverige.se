import HubPage from '../components/HubPage'

const Community = () => (
  <HubPage
    path="/community"
    eyebrow="Community"
    heading="Communityt bakom sajten"
    intro={
      <p>
        Frilansare Sverige drivs av sina medlemmar — ideellt, gratis och med
        öppen källkod. Här hittar du vilka vi är, vad som gäller och hur du når
        oss.
      </p>
    }
    links={[
      {
        href: '/om',
        label: 'Om oss',
        text: 'Varför communityt finns och hur det drivs.',
        icon: 'icon-[lucide--heart-handshake]',
      },
      {
        href: '/uppforandekod',
        label: 'Uppförandekod',
        text: 'Reglerna som håller Slacken schysst.',
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
