import { SubmitError } from '../hooks/submit-form'

const GENERIC =
  'Något gick fel när uppdraget skulle publiceras. Försök igen om en stund. Fortsätter det strula, hör av dig via kontaktsidan.'

// The gig service answers some 400s with a code instead of a sentence, so
// the form can explain them in its own words.
const BY_CODE: Record<string, string> = {
  BLOCKED_SENDER_DOMAIN:
    'Den e-postadressen går inte att använda som avsändare. Ange en adress hos företaget eller organisationen du företräder.',
  INVALID_EMAIL_ADDRESS:
    'E-postadressen är ogiltig. Kontrollera den och försök igen.',
}

/** Swedish copy for a failed publish, keyed on the service's error code. */
export const describeGigError = (error: unknown): string =>
  error instanceof SubmitError ? (BY_CODE[error.message] ?? GENERIC) : GENERIC
