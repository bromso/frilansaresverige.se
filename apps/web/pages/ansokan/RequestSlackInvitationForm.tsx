import { Button } from '@frilansaresverige/ui/animate-ui/components/buttons/button'
import { Slide } from '@frilansaresverige/ui/animate-ui/primitives/effects/slide'
import { useReducedMotion } from '@frilansaresverige/ui/lib/use-reduced-motion'
import { Alert, AlertDescription } from '@frilansaresverige/ui/ui/alert'
import { Checkbox } from '@frilansaresverige/ui/ui/checkbox'
import { Input } from '@frilansaresverige/ui/ui/input'
import { Label } from '@frilansaresverige/ui/ui/label'
import { Textarea } from '@frilansaresverige/ui/ui/textarea'
import type { ReactElement } from 'react'
import { useSubmitSlackInvitationForm } from '../../hooks/useSubmitSlackInvitationForm'

// Reproduces the original CSS Module's field styling (font-size, full
// width, blue border, cream background, and the double-ring focus style)
// on top of shadcn's Input/Textarea base classes.
const FIELD_CLASSES =
  'h-auto w-full rounded-[0.25em] border border-brand-blue bg-brand-cream p-[0.5em] text-[1.2em] shadow-none md:text-[1.2em] focus-visible:border-brand-blue focus-visible:ring-0 focus:shadow-[0_0_0_0.1em_var(--color-brand-cream),0_0_0_0.2em_var(--color-brand-blue)] focus:outline-none'

// Wraps a status Alert in the Slide entrance animation, except when the
// visitor has asked for reduced motion — in that case it renders as-is,
// with no motion wrapper attached at all.
const StatusSlide = ({
  reduced,
  children,
}: {
  reduced: boolean
  children: ReactElement
}) => (reduced ? children : <Slide asChild>{children}</Slide>)

const RequestSlackInvitationForm = () => {
  const { submitForm, data, error } = useSubmitSlackInvitationForm()
  const reduced = useReducedMotion()

  if (data?.success) {
    return (
      <StatusSlide reduced={reduced}>
        <Alert className="mt-8 rounded-[0.5em] border-[#6a6a6a] bg-[#adffb4] p-4 text-brand-grey">
          <AlertDescription>
            Grattis! Din ansökan är inskickad.
          </AlertDescription>
        </Alert>
      </StatusSlide>
    )
  }
  if (error) {
    return (
      <StatusSlide reduced={reduced}>
        <Alert className="mt-8 rounded-[0.5em] border-[#6a6a6a] bg-[#ffaaaa] p-4 text-brand-grey">
          <AlertDescription>Något gick fel. Försök igen.</AlertDescription>
        </Alert>
      </StatusSlide>
    )
  }

  return (
    <div>
      <h1 className="text-2xl text-brand-cream">
        Ansök om medlemskap i Slack-gruppen för frilansare
      </h1>

      <p className="my-4 text-[1.1em] leading-relaxed text-brand-cream">
        Vi godkänner bara ansökningar för dig som redan är frilansare.
      </p>

      <form
        className="rounded-[10px] bg-brand-cream p-6 text-left text-brand-blue"
        onSubmit={submitForm}
      >
        <div className="mb-4">
          <Label htmlFor="name" className="text-[1.1em] leading-relaxed">
            Namn
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className={FIELD_CLASSES}
          />
        </div>

        <div className="mb-4">
          <Label htmlFor="email" className="text-[1.1em] leading-relaxed">
            E-mail
          </Label>
          <Input
            id="email"
            name="email"
            type="text"
            autoComplete="email"
            required
            className={FIELD_CLASSES}
          />
        </div>

        <div className="mb-4">
          <Label htmlFor="howlong" className="text-[1.1em] leading-relaxed">
            Hur länge har du varit frilansare?
          </Label>
          <Input
            id="howlong"
            name="howlong"
            type="text"
            required
            className={FIELD_CLASSES}
          />
        </div>

        <div className="mb-4">
          <Label htmlFor="companyName" className="text-[1.1em] leading-relaxed">
            Vad heter ditt företag? Eller har du enskild firma?
          </Label>
          <Input
            id="companyName"
            name="companyName"
            type="text"
            required
            className={FIELD_CLASSES}
          />
        </div>

        <div className="mb-4">
          <Label htmlFor="linkedin" className="text-[1.1em] leading-relaxed">
            Länk till din LinkedIn profil
          </Label>
          <Input
            id="linkedin"
            name="linkedin"
            type="text"
            required
            className={FIELD_CLASSES}
          />
        </div>

        <div className="mb-4 flex flex-row items-baseline justify-start gap-2">
          <Checkbox
            id="freelancer-confirmation"
            name="freelancer-confirmation"
            required
          />
          <Label
            htmlFor="freelancer-confirmation"
            className="text-[1.1em] leading-relaxed"
          >
            Jag är igång som frilansare, d v s har ett bolag att fakturera genom
            och tecknat avtal med åtminstone min första kund.
          </Label>
        </div>

        <div className="mb-4">
          <Label htmlFor="motivation" className="text-[1.1em] leading-relaxed">
            Motivering (berätta kort om vad du gör och varför du vill vara med i
            vårt community). Observera att vi endast godkänner medlemmar som ÄR
            frilansare.
          </Label>
          <Textarea
            id="motivation"
            name="motivation"
            required
            className={FIELD_CLASSES}
          />
        </div>

        <Button type="submit" variant="primary" size="none">
          Skicka in ansökan
        </Button>
      </form>
    </div>
  )
}

export default RequestSlackInvitationForm
