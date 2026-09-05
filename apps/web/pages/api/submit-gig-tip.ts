import {
  createSlackFormHandler,
  escapeInline,
  escapeMrkdwn,
} from '../../lib/slack-form.server'

const RELATION_LABELS: Record<string, string> = {
  formedlare:
    'Uppdraget innebär avtal med en förmedlare, som i sin tur har avtal med kunden',
  direktavtal: 'Den vi söker kommer ha direktavtal med kunden',
}

// The gig-tip form on /tipsa posts here; the message lands in the
// community's gig channel. Field caps are generous versions of what the
// form itself enforces, so a legitimate submission never trips them.
export default createSlackFormHandler({
  webhookEnv: 'SLACK_GIG_TIP_WEBHOOK_URL',
  username: 'Tips om konsultuppdrag',
  icon_emoji: ':briefcase:',
  rules: {
    title: { label: 'Titel', required: true, max: 200 },
    location: { label: 'Plats', required: true, max: 200 },
    clientName: { label: 'Uppdragsgivare', required: true, max: 200 },
    minRate: {
      label: 'Minimumarvode',
      required: true,
      max: 20,
      pattern: /^[0-9][0-9 ]*$/,
    },
    description: { label: 'Beskrivning', required: true, max: 5000 },
    contactName: { label: 'Kontaktperson', required: true, max: 200 },
    contactPhone: { label: 'Telefon', required: true, max: 40 },
    contactEmail: {
      label: 'E-post',
      required: true,
      max: 254,
      pattern: /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/,
    },
    relation: {
      label: 'Relation till kunden',
      required: true,
      max: 20,
      oneOf: Object.keys(RELATION_LABELS),
    },
    omfattning: { label: 'Omfattning', required: true, max: 40 },
    arbetsform: { label: 'Arbetsform', max: 100 },
  },
  formatText: (f) =>
    'Nytt tips om konsultuppdrag! \n' +
    `Titel: ${escapeInline(f.title)} \n` +
    `Plats: ${escapeInline(f.location)} \n` +
    `Omfattning: ${escapeInline(f.omfattning)} \n` +
    `Arbetsform: ${escapeInline(f.arbetsform) || '—'} \n` +
    `Uppdragsgivare: ${escapeInline(f.clientName)} \n` +
    `Minimumarvode: ${escapeInline(f.minRate)} kr/h \n` +
    `Beskrivning: ${escapeMrkdwn(f.description)} \n` +
    `Kontaktperson: ${escapeInline(f.contactName)} \n` +
    `Telefon: ${escapeInline(f.contactPhone)} \n` +
    `E-post: ${escapeInline(f.contactEmail)} \n` +
    `Relation till kunden: ${RELATION_LABELS[f.relation] ?? escapeInline(f.relation)}`,
})
