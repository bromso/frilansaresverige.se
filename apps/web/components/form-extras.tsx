import { Slide } from '@frilansaresverige/ui/animate-ui/primitives/effects/slide'
import { Alert, AlertDescription } from '@frilansaresverige/ui/ui/alert'
import type { ReactElement } from 'react'
import { HONEYPOT_FIELD } from '../lib/form-fields'

// Pieces shared by the two Slack-backed forms (/tipsa and /ansokan).

// Wraps a status Alert in the Slide entrance animation, except when the
// visitor has asked for reduced motion — in that case it renders as-is,
// with no motion wrapper attached at all.
export const StatusSlide = ({
  reduced,
  children,
}: {
  reduced: boolean
  children: ReactElement
}) => (reduced ? children : <Slide asChild>{children}</Slide>)

/**
 * Delivery failure notice. Rendered above the form rather than instead
 * of it, so what the visitor typed survives and they can simply try
 * again; `role="alert"` makes screen readers announce it right away.
 */
export const SubmitErrorAlert = ({
  reduced,
  children,
}: {
  reduced: boolean
  children: string
}) => (
  <StatusSlide reduced={reduced}>
    <Alert
      role="alert"
      className="mb-6 rounded-[0.75em] border-[#6a6a6a] bg-[#ffaaaa] p-5 text-brand-grey"
    >
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  </StatusSlide>
)

/**
 * The honeypot: a text input humans never see or tab to, which
 * form-filling bots populate anyway. The API drops any submission where
 * it is non-empty. It is moved off-canvas rather than `display: none`
 * because the cruder bots skip hidden inputs but not off-screen ones.
 */
export const HoneypotField = () => (
  <div
    aria-hidden="true"
    className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden"
  >
    <label>
      Webbplats
      <input
        type="text"
        name={HONEYPOT_FIELD}
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </label>
  </div>
)

/** Screen-reader-only live region announcing that the form is on its way. */
export const SubmittingStatus = ({ active }: { active: boolean }) => (
  <p role="status" aria-live="polite" className="sr-only">
    {active ? 'Skickar…' : ''}
  </p>
)
