import HubPage from '../components/HubPage'

const ForFrilansare = () => (
  <HubPage
    path="/for-frilansare"
    eyebrow="För frilansare"
    heading="Frilansa — men aldrig ensam"
    intro={
      <p>
        Frilansare Sverige är ett gratis community där tusentals frilansare
        delar uppdrag, kunskap och kollegskap i Slack. Ingen medlemsavgift,
        inga mellanhänder — bara kollegor.
      </p>
    }
    links={[
      {
        href: '/ansokan',
        label: 'Bli medlem',
        text: 'Ansökan är gratis och tar ett par minuter. Vi ses i Slack!',
        icon: 'icon-[lucide--user-round]',
      },
      {
        href: '/sa-fungerar-det',
        label: 'Så fungerar det',
        text: 'Kanalerna, uppdragstipsen och reglerna — allt du behöver veta som ny.',
        icon: 'icon-[lucide--map]',
      },
      {
        href: '/fragor-och-svar',
        label: 'Frågor och svar',
        text: 'Vem kan bli medlem? Vad kostar det? Svaren på det vanligaste.',
        icon: 'icon-[lucide--message-circle-question-mark]',
      },
      {
        href: '/uppdrag',
        label: 'Hitta uppdrag',
        text: 'Uppdrag tipsade av medlemmar och företag — utan mellanhänder.',
        icon: 'icon-[lucide--briefcase-business]',
      },
    ]}
  />
)

export default ForFrilansare
