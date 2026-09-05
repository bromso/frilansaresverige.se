import HubPage from '../components/HubPage'

const Kunskap = () => (
  <HubPage
    path="/kunskap"
    eyebrow="Kunskap"
    heading="Kunskap från frilansare, till frilansare"
    intro={
      <p>
        Guider, recensioner och svar för dig som frilansar i Sverige. Allt är
        skrivet av medlemmar i communityt, utan säljagenda. Vi bygger ut
        sektionen löpande.
      </p>
    }
    links={[
      {
        href: '/recensioner',
        label: 'Recensioner',
        text: 'Så upplever medlemmarna konsultmäklare, rekryterare och HR-bolag. Ärliga betyg, inga filter.',
        icon: 'icon-[lucide--star]',
      },
      {
        href: '/fragor-och-svar',
        label: 'Frågor och svar',
        text: 'Det vanligaste om medlemskap och hur communityt fungerar.',
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
      </a>
      . Sajten är öppen källkod, och kunskapssektionen växer med dem som bidrar.
    </p>
  </HubPage>
)

export default Kunskap
