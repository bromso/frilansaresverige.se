import {
  createSlackFormHandler,
  escapeInline,
  escapeMrkdwn,
} from '../../lib/slack-form.server'

// The membership form on /ansokan posts here; the message lands in the
// admins' review channel. Field caps are generous versions of what the
// form itself enforces, so a legitimate application never trips them.
export default createSlackFormHandler({
  webhookEnv: 'SLACK_REQUEST_INVITE_WEBHOOK_URL',
  username: 'Request for Slack invitation',
  icon_emoji: ':raised_hands:',
  rules: {
    name: { label: 'Namn', required: true, max: 200 },
    email: {
      label: 'E-post',
      required: true,
      max: 254,
      pattern: /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/,
    },
    roll: { label: 'Roll', required: true, max: 200 },
    ort: { label: 'Ort', required: true, max: 200 },
    howlong: { label: 'Tid som frilansare', required: true, max: 200 },
    companyName: { label: 'Företagsnamn', required: true, max: 200 },
    linkedin: { label: 'LinkedIn', required: true, max: 500 },
    portfolio: { label: 'Portfolio', max: 500 },
    motivation: { label: 'Motivering', required: true, max: 5000 },
  },
  formatText: (f) => {
    // encodeURIComponent, not encodeURI: company names with `&`, `?` or
    // `#` would otherwise break the search link.
    const companySearchUrl = `https://www.allabolag.se/what/${encodeURIComponent(
      f.companyName,
    )}`
    return (
      'Ny frilansare på ingång! \n' +
      `Namn: ${escapeInline(f.name)} \n` +
      `Email: ${escapeInline(f.email)} \n` +
      `Roll: ${escapeInline(f.roll)} \n` +
      `Ort: ${escapeInline(f.ort)} \n` +
      `Tid som frilansare: ${escapeInline(f.howlong)} \n` +
      `Företagsnamn: ${escapeInline(f.companyName)}, ${escapeInline(companySearchUrl)} \n` +
      `LinkedIn: ${escapeInline(f.linkedin)} \n` +
      `Portfolio: ${escapeInline(f.portfolio) || '—'} \n` +
      `Motivering: ${escapeMrkdwn(f.motivation)}`
    )
  },
})
