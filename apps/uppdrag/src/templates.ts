import type { Assignment } from './types'

// The message and mail bodies from the original service's config, plus
// Omfattning and Arbetsform lines for the fields the site's form collects.
// fillTemplate strips the indentation; a line whose placeholder has no
// value is dropped together with the blank line after it, so an optional
// field leaves no gap.
export const TEMPLATES = {
  confirmation: `
    Hej!

    Det konsultuppdrag med rubriken '[[TITLE]]' som du skickade till Frilansare Sverige har publicerats. Om du vill uppdatera det kan du använda dig av följande länk.
    [[URL]]

    Tänk på att hålla länken hemlig, eftersom vem som helst som har den kan uppdatera publikationen.

    Har du några frågor går det bra att svara på det här e-brevet.

    Hälsningar från Frilansare Sverige
  `,
  slackAssignmentInitial: `
    *[[TITLE]]*

    *Plats:* [[LOCATION]]

    *Omfattning:* [[SCOPE]]

    *Arbetsform:* [[WORK_FORM]]

    *Uppdragsgivare:* [[CUSTOMER_NAME]]

    *Avsändare:* [[SENDER_EMAIL]]

    *Mellanhandsavgift:* [[CUSTOMER_FEE]]

    *Minimum arvode:* [[HOURLY_RATE]] kr/h

    *Kontaktuppgifter:*
    [[CONTACT]]
  `,
  slackAssignmentThread: `
    *Beskrivning:*
    [[DESCRIPTION]]

    *Om uppdragsgivaren:* [[CUSTOMER_COMPANY_URL]]
  `,
  slackAssignmentComment: `
    *Komplettering*:
    [[COMMENT]]
  `,
  slackAssignmentDeleted: 'Denna uppdragsannons har raderats.',
  slackAssignmentCommentDeleted: 'Denna komplettering har raderats.',
} as const

export type TemplateSource = Partial<Assignment> & { comment?: string }

/** Structured contact lines for new rows, the free text for old ones. */
export const contactText = (
  source: Pick<
    TemplateSource,
    'contact' | 'contactName' | 'contactPhone' | 'contactEmail'
  >,
): string => {
  if (source.contactName) {
    return [source.contactName, source.contactPhone, source.contactEmail]
      .filter((value): value is string => Boolean(value))
      .join('\n')
  }
  return source.contact ?? ''
}

export const parseOrganizationNumber = (organizationNumber: string): string =>
  organizationNumber.replace(/[^A-Za-z0-9]/g, '')

export const createCompanyURL = (organizationNumber: string): string =>
  `https://www.allabolag.se/bransch-s%C3%B6k?q=${parseOrganizationNumber(organizationNumber)}`

export const manageURL = (siteUrl: string, id: string): string =>
  `${siteUrl}/tipsa/hantera/${id}`

// Slack mrkdwn: `<!channel>` pings everyone and `<url|label>` forges
// links, so user text is escaped the way Slack documents. Control
// characters are dropped; newlines are kept for multi-line fields.
export const escapeMrkdwn = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // biome-ignore lint/suspicious/noControlCharactersInRegex: stripping control characters is the point
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')

const present = (value: string | number | null | undefined): string | null =>
  value === null || value === undefined || String(value).trim() === ''
    ? null
    : String(value)

const URL_KEYS = new Set(['URL', 'CUSTOMER_COMPANY_URL'])

// Null means "drop this line".
const resolve = (
  key: string,
  source: TemplateSource,
  siteUrl: string,
): string | null => {
  switch (key) {
    case 'TITLE':
      return source.title ?? ''
    case 'DESCRIPTION':
      return source.description ?? ''
    case 'CUSTOMER_NAME':
      return source.customerName ?? ''
    case 'SENDER_EMAIL':
      return source.emailAddress ?? ''
    case 'COMMENT':
      return source.comment ?? ''
    case 'CONTACT':
      return contactText(source)
    case 'URL':
      return manageURL(siteUrl, source.id ?? '')
    case 'LOCATION':
      return present(source.location)
    case 'SCOPE':
      return present(source.scope)
    case 'WORK_FORM':
      return present(source.workForm)
    case 'HOURLY_RATE':
      return present(source.clientHourlyRate)
    case 'CUSTOMER_COMPANY_URL': {
      const number = present(source.customerOrganizationNumber)
      return number ? createCompanyURL(number) : null
    }
    case 'CUSTOMER_FEE': {
      const fee = present(source.customerFee)
      if (fee) {
        return fee
      }
      // Direct clients have no middleman fee; a broker that left it out
      // is called out as not disclosing it.
      return source.senderType === 'DIRECT' ? null : 'Vill ej uppge'
    }
    default:
      return `[[${key}]]`
  }
}

export function fillTemplate(
  template: string,
  source: TemplateSource,
  siteUrl: string,
  escaper: (value: string) => string = (value) => value,
): string {
  const lines = template
    .trim()
    .replace(/\n[ \t]+/g, '\n')
    .split('\n')
  const out: string[] = []
  let skipBlank = false
  for (const line of lines) {
    if (skipBlank) {
      skipBlank = false
      if (line === '') {
        continue
      }
    }
    let dropped = false
    const filled = line.replace(/\[\[([A-Z_]+)\]\]/g, (_, key: string) => {
      const value = resolve(key, source, siteUrl)
      if (value === null) {
        dropped = true
        return ''
      }
      return URL_KEYS.has(key) ? value : escaper(value)
    })
    if (dropped) {
      skipBlank = true
      continue
    }
    out.push(filled)
  }
  while (out.length > 0 && out[out.length - 1] === '') {
    out.pop()
  }
  return out.join('\n')
}
