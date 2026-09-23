import HubPage from '../components/HubPage'

const ForForetag = () => (
  <HubPage
    path="/for-foretag"
    eyebrow="För företag"
    heading="Hitta rätt frilansare, utan förmedlare"
    intro={
      <p>
        Söker du en konsult? Beskriv uppdraget, så når det tusentals etablerade
        frilansare i Sveriges största frilanscommunity. Det kostar ingenting,
        och de som är intresserade hör av sig direkt till dig. Det gäller
        oavsett om du är arbetsgivare, byrå, konsultbolag eller förmedlare.
      </p>
    }
    links={[
      {
        href: '/tipsa',
        label: 'Tipsa om uppdrag',
        text: 'Fyll i uppdraget så publiceras det i communityts uppdragskanal. Gratis.',
        icon: 'icon-[lucide--megaphone]',
      },
      {
        href: '/anlita-frilansare',
        label: 'Anlita en frilansare',
        text: 'Så hittar du rätt kompetens i communityt, och vad som gäller.',
        icon: 'icon-[lucide--handshake]',
      },
    ]}
  />
)

export default ForForetag
