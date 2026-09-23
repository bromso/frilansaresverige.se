import { describe, expect, it } from 'bun:test'
import { loadConfig } from './config'

const full = {
  MYSQL_URL: 'mysql://u:p@localhost:3306/uppdrag',
  SMTP_HOST: 'smtp.example.se',
  SMTP_USER: 'mailer',
  SMTP_PASS: 'secret',
  EMAIL_FROM: 'Frilansare Sverige <hej@example.se>',
  SLACK_BOT_TOKEN: 'xoxb-1',
  SLACK_CHANNEL_BROKER: '#uppdrag-formedlare',
  SLACK_CHANNEL_DIRECT: '#uppdrag-direkt',
  SITE_URL: 'https://frilansaresverige.se/',
  GIG_API_KEY: 'k',
}

describe('loadConfig', () => {
  it('reads every variable and applies defaults', () => {
    expect(loadConfig(full)).toEqual({
      host: '0.0.0.0',
      port: 8989,
      mysqlUrl: 'mysql://u:p@localhost:3306/uppdrag',
      smtp: {
        host: 'smtp.example.se',
        port: 465,
        secure: true,
        user: 'mailer',
        pass: 'secret',
      },
      email: {
        from: 'Frilansare Sverige <hej@example.se>',
        bcc: null,
        toOverride: null,
      },
      slack: {
        token: 'xoxb-1',
        channels: { BROKER: '#uppdrag-formedlare', DIRECT: '#uppdrag-direkt' },
        memberCountChannel: 'C8P11NBEF',
      },
      siteUrl: 'https://frilansaresverige.se',
      apiKey: 'k',
      blockedSenderDomains: ['gmail.com', 'partna.se'],
    })
  })

  it('honours overrides', () => {
    const config = loadConfig({
      ...full,
      PORT: '9000',
      HOST: '127.0.0.1',
      SMTP_PORT: '587',
      SMTP_SECURE: 'FALSE',
      EMAIL_BCC: 'arkiv@example.se',
      EMAIL_TO_OVERRIDE: 'dev@example.se',
      SLACK_MEMBER_COUNT_CHANNEL: 'C123',
      BLOCKED_SENDER_DOMAINS: ' Example.com, spam.se ,',
    })
    expect(config.port).toBe(9000)
    expect(config.host).toBe('127.0.0.1')
    expect(config.smtp).toMatchObject({ port: 587, secure: false })
    expect(config.email).toEqual({
      from: full.EMAIL_FROM,
      bcc: 'arkiv@example.se',
      toOverride: 'dev@example.se',
    })
    expect(config.slack.memberCountChannel).toBe('C123')
    expect(config.blockedSenderDomains).toEqual(['example.com', 'spam.se'])
  })

  it('names the missing variable', () => {
    const { SLACK_BOT_TOKEN: _omitted, ...rest } = full
    expect(() => loadConfig(rest)).toThrow(
      'Missing required environment variable SLACK_BOT_TOKEN',
    )
    expect(() => loadConfig({ ...full, SMTP_HOST: '  ' })).toThrow(
      'Missing required environment variable SMTP_HOST',
    )
  })

  it('rejects a non-numeric port', () => {
    expect(() => loadConfig({ ...full, PORT: 'eighty' })).toThrow(
      'Environment variable PORT must be a positive integer',
    )
  })
})
