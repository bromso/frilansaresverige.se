import HubPage from '../components/HubPage'

const Kunskap = () => (
  <HubPage
    path="/kunskap"
    eyebrow="Kunskap"
    heading="Kunskap för frilansare"
    intro={
      <p>
        Guider och verktyg för dig som frilansar i Sverige — skrivna av
        communityt, utan säljagenda. Vi bygger ut den här sektionen löpande;
        först ut är svaren på de vanligaste frågorna.
      </p>
    }
    links={[
      {
        href: '/fragor-och-svar',
        label: 'Frågor och svar',
        text: 'Det vanligaste om medlemskap och community.',
        icon: 'icon-[lucide--message-circle-question-mark]',
      },
    ]}
  >
    <p className="mt-10 max-w-[36em] leading-[1.6] text-brand-cream/70">
      Vill du skriva en guide eller föreslå ett ämne? Säg till i Slacken eller
      öppna ett ärende på{' '}
      <a
        href="https://github.com/frilansaresverige/frilansaresverige.se/"
        className="underline hover:no-underline"
      >
        GitHub
      </a>{' '}
      — sajten är öppen källkod.
    </p>
  </HubPage>
)

export default Kunskap
