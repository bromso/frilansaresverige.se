import nodemailer from 'nodemailer'
import type { Config } from './config'
import { fillTemplate, TEMPLATES } from './templates'
import type { Assignment, Logger } from './types'

export interface MailTransport {
  sendMail(options: {
    from: string
    to: string
    bcc?: string
    subject: string
    text: string
  }): Promise<unknown>
}

export interface Mailer {
  sendConfirmation(assignment: Assignment): Promise<void>
}

export const CONFIRMATION_SUBJECT = 'Bekräftelse på publicerat konsultuppdrag'

// Bun has no SMTP client, so this is the one non-native dependency.
export function createTransport(smtp: Config['smtp']): MailTransport {
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
  })
}

export function createMailer(
  { email, siteUrl }: Pick<Config, 'email' | 'siteUrl'>,
  transport: MailTransport,
  log: Logger,
): Mailer {
  return {
    async sendConfirmation(assignment) {
      try {
        await transport.sendMail({
          from: email.from,
          to: email.toOverride ?? assignment.emailAddress,
          ...(email.bcc ? { bcc: email.bcc } : {}),
          subject: CONFIRMATION_SUBJECT,
          text: fillTemplate(TEMPLATES.confirmation, assignment, siteUrl),
        })
      } catch (error) {
        // The listing is already published; a lost receipt is logged,
        // never surfaced to the client.
        log(
          `Failed to send the confirmation email for assignment ${assignment.id}`,
          error,
        )
      }
    },
  }
}
