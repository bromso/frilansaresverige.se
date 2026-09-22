export type SenderType = 'BROKER' | 'DIRECT'

export type Logger = (message: string, detail?: unknown) => void

/** A row of `assignment`, with MySQL's bigints and tinyint normalised. */
export interface Assignment {
  id: string
  senderType: SenderType
  emailAddress: string
  customerName: string
  title: string
  description: string
  /** Free-text contact from rows created before the structured fields. */
  contact: string | null
  created: number
  slackChannel: string
  slackId: string | null
  slackThreadId: string | null
  slackChannelId: string | null
  customerOrganizationNumber: string | null
  customerFee: string | null
  clientHourlyRate: string | null
  location: string | null
  deleted: number | null
  slackDeleted: boolean
  scope: string | null
  workForm: string | null
  contactName: string | null
  contactPhone: string | null
  contactEmail: string | null
}

export interface AssignmentComment {
  id: number
  comment: string
  created: number
  slackId: string | null
}

/** What the create endpoint accepts after validation. */
export interface NewAssignment {
  senderType: SenderType
  emailAddress: string
  title: string
  location: string
  customerName: string
  description: string
  scope: string
  workForm: string | null
  contactName: string
  contactPhone: string
  contactEmail: string
  customerOrganizationNumber: string | null
  customerFee: string | null
  clientHourlyRate: number | null
}
