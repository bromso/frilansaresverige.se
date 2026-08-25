import HubPage from '../components/HubPage'

const ForForetag = () => (
  <HubPage
    path="/for-foretag"
    eyebrow="För företag"
    heading="Nå tusentals frilansare — direkt"
    intro={
      <p>
        Söker du en konsult? I Frilansare Sverige når ditt uppdrag Sveriges
        största frilanscommunity på en gång. Det kostar ingenting, och
        frilansarna hör av sig direkt till dig — utan mellanhänder. Det gäller
        oavsett om du är arbetsgivare, konsultförmedlare eller konsultbolag.
      </p>
    }
    links={[
      {
        href: '/tipsa',
        label: 'Tipsa om uppdrag',
        text: 'Beskriv uppdraget så når det communityt direkt. Gratis.',
        icon: 'icon-[lucide--megaphone]',
      },
      {
        href: '/anlita-frilansare',
        label: 'Anlita en frilansare',
        text: 'Så hittar du rätt kompetens i communityt — och vad som gäller.',
        icon: 'icon-[lucide--handshake]',
      },
    ]}
  />
)

export default ForForetag
