import { describe, expect, it } from 'bun:test'
import {
  contactText,
  createCompanyURL,
  escapeMrkdwn,
  fillTemplate,
  manageURL,
  TEMPLATES,
  type TemplateSource,
} from './templates'

const SITE = 'https://frilansaresverige.se'

const broker: TemplateSource = {
  id: 'ABCDEFGHIJKLMNOP',
  senderType: 'BROKER',
  title: 'Frontendutvecklare',
  description: 'React och TypeScript.',
  customerName: 'Acme AB',
  emailAddress: 'kim@broker.se',
  location: 'Göteborg',
  scope: 'Heltid',
  workForm: 'Distans, Hybrid',
  customerFee: '10 %',
  clientHourlyRate: '950',
  customerOrganizationNumber: '556677-8899',
  contactName: 'Kim Lindqvist',
  contactPhone: '070-123 45 67',
  contactEmail: 'kim@acme.se',
  contact: null,
}

const direct: TemplateSource = {
  ...broker,
  senderType: 'DIRECT',
  emailAddress: 'kim@acme.se',
  customerFee: null,
  clientHourlyRate: null,
  workForm: null,
  customerOrganizationNumber: null,
}

describe('contactText', () => {
  it('joins the structured fields', () => {
    expect(contactText(broker)).toBe(
      'Kim Lindqvist\n070-123 45 67\nkim@acme.se',
    )
  })

  it('falls back to the legacy free text', () => {
    expect(contactText({ contact: 'Ring Kim på 070', contactName: null })).toBe(
      'Ring Kim på 070',
    )
    expect(contactText({})).toBe('')
  })
})

describe('urls', () => {
  it('builds the manage and company urls', () => {
    expect(manageURL(SITE, 'ABC')).toBe(`${SITE}/tipsa/hantera/ABC`)
    expect(createCompanyURL('556677-8899')).toBe(
      'https://www.allabolag.se/bransch-s%C3%B6k?q=5566778899',
    )
  })
})

describe('escapeMrkdwn', () => {
  it('neutralises the three control characters and drops others', () => {
    expect(escapeMrkdwn('<!channel> a & b\u0000\n')).toBe(
      '&lt;!channel&gt; a &amp; b\n',
    )
  })
})

describe('fillTemplate', () => {
  it('renders every line for a broker assignment', () => {
    expect(fillTemplate(TEMPLATES.slackAssignmentInitial, broker, SITE)).toBe(
      [
        '*Frontendutvecklare*',
        '',
        '*Plats:* Göteborg',
        '',
        '*Omfattning:* Heltid',
        '',
        '*Arbetsform:* Distans, Hybrid',
        '',
        '*Uppdragsgivare:* Acme AB',
        '',
        '*Avsändare:* kim@broker.se',
        '',
        '*Mellanhandsavgift:* 10 %',
        '',
        '*Minimum arvode:* 950 kr/h',
        '',
        '*Kontaktuppgifter:*',
        'Kim Lindqvist',
        '070-123 45 67',
        'kim@acme.se',
      ].join('\n'),
    )
  })

  it('drops the lines whose value is missing, without leaving gaps', () => {
    expect(fillTemplate(TEMPLATES.slackAssignmentInitial, direct, SITE)).toBe(
      [
        '*Frontendutvecklare*',
        '',
        '*Plats:* Göteborg',
        '',
        '*Omfattning:* Heltid',
        '',
        '*Uppdragsgivare:* Acme AB',
        '',
        '*Avsändare:* kim@acme.se',
        '',
        '*Kontaktuppgifter:*',
        'Kim Lindqvist',
        '070-123 45 67',
        'kim@acme.se',
      ].join('\n'),
    )
  })

  it('says "Vill ej uppge" for a broker without a fee', () => {
    const text = fillTemplate(
      TEMPLATES.slackAssignmentInitial,
      { ...broker, customerFee: null },
      SITE,
    )
    expect(text).toContain('*Mellanhandsavgift:* Vill ej uppge')
  })

  it('renders the thread with and without the company link', () => {
    expect(fillTemplate(TEMPLATES.slackAssignmentThread, broker, SITE)).toBe(
      '*Beskrivning:*\nReact och TypeScript.\n\n*Om uppdragsgivaren:* https://www.allabolag.se/bransch-s%C3%B6k?q=5566778899',
    )
    expect(fillTemplate(TEMPLATES.slackAssignmentThread, direct, SITE)).toBe(
      '*Beskrivning:*\nReact och TypeScript.',
    )
  })

  it('renders a comment', () => {
    expect(
      fillTemplate(
        TEMPLATES.slackAssignmentComment,
        { comment: 'Start i maj.' },
        SITE,
      ),
    ).toBe('*Komplettering*:\nStart i maj.')
  })

  it('puts the manage link in the confirmation mail', () => {
    const text = fillTemplate(TEMPLATES.confirmation, broker, SITE)
    expect(text).toStartWith('Hej!')
    expect(text).toContain("rubriken 'Frontendutvecklare'")
    expect(text).toContain(`\n${SITE}/tipsa/hantera/ABCDEFGHIJKLMNOP\n`)
  })

  it('escapes user text but not urls when an escape is given', () => {
    const text = fillTemplate(
      TEMPLATES.slackAssignmentThread,
      { ...broker, description: '<!channel> & co' },
      SITE,
      escapeMrkdwn,
    )
    expect(text).toContain('&lt;!channel&gt; &amp; co')
    expect(text).toContain(
      'https://www.allabolag.se/bransch-s%C3%B6k?q=5566778899',
    )
  })
})
