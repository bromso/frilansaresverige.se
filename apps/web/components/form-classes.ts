// Shared field styling for the cream form cards: full width, blue border,
// and the double-ring focus style, on top of shadcn's base classes.
export const FIELD_CLASSES =
  'h-auto w-full rounded-[0.6em] border border-brand-blue/40 bg-white/60 p-[0.6em] text-[1.1em] shadow-none md:text-[1.1em] transition-colors focus-visible:border-brand-blue focus-visible:ring-0 focus:shadow-[0_0_0_0.1em_var(--color-brand-cream),0_0_0_0.2em_var(--color-brand-blue)] focus:outline-none'

export const LABEL_CLASSES =
  'font-display text-[1.05em] font-bold leading-[1.5]'

// Native constraint-validation patterns shared by the forms. The
// steppers run every field through reportValidity before advancing, so
// these surface as the browser's own (localized) bubbles; the title
// attribute supplies the explanation. HTML compiles `pattern` with the
// regex v flag, so `-` is escaped even inside character classes.
export const EMAIL_PATTERN = String.raw`[^@\s]+@[^@\s]+\.[^@\s]{2,}`
export const EMAIL_TITLE = 'Ange en giltig e-postadress, t.ex. namn@exempel.se'
export const URL_PATTERN = String.raw`(https?://)?([a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,}(/[^\s]*)?`
export const URL_TITLE = 'Ange en giltig webbadress, t.ex. exempel.se'
export const PHONE_PATTERN = String.raw`\+?[0-9][0-9 \-]{5,}`
export const PHONE_TITLE = 'Ange ett giltigt telefonnummer, t.ex. 070-123 45 67'
export const NUMBER_PATTERN = String.raw`[0-9][0-9 ]*`
export const NUMBER_TITLE = 'Ange ett belopp i siffror, t.ex. 950'
