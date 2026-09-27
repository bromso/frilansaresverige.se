import { RELATION_TO_SENDER_TYPE } from '../hooks/useSubmitGigTipForm'
import type { AssignmentView } from './AssignmentPreview'

export interface GigPreview {
  view: AssignmentView
  /** The contact address, which the receipt address is prefilled from. */
  contactEmail: string
}

/**
 * Reads the current answers off the gig form for the preview step. The
 * form's panes stay mounted, so every field is in the DOM. Disabled
 * inputs are absent from FormData, which is why the broker's fee is
 * decided by the "not transparent" flag rather than the field alone.
 */
export function readGigPreview(
  form: HTMLFormElement,
  { nonTransparentFee }: { nonTransparentFee: boolean },
): GigPreview {
  const data = new FormData(form)
  const read = (name: string) => String(data.get(name) ?? '').trim()
  const contactEmail = read('contactEmail')
  return {
    contactEmail,
    view: {
      title: read('title'),
      description: read('description'),
      customerName: read('clientName'),
      location: read('location') || null,
      scope: read('omfattning') || null,
      workForm: data.getAll('arbetsform').map(String).join(', ') || null,
      contact: [read('contactName'), read('contactPhone'), contactEmail]
        .filter(Boolean)
        .join('\n'),
      senderType: RELATION_TO_SENDER_TYPE[read('relation')] ?? 'DIRECT',
      clientHourlyRate: read('minRate') || null,
      // The broker fields are only mounted for brokers, so a direct
      // listing reads both as empty.
      customerFee: nonTransparentFee ? null : read('customerFee') || null,
      customerOrganizationNumber: read('customerOrganizationNumber') || null,
      deleted: false,
    },
  }
}

/** The receipt address defaults to the contact address until the sender edits it. */
export const prefillEmail = (previous: string, contactEmail: string): string =>
  previous || contactEmail
