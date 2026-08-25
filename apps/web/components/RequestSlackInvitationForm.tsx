import { Button } from '@frilansaresverige/ui/animate-ui/components/buttons/button'
import { Slide } from '@frilansaresverige/ui/animate-ui/primitives/effects/slide'
import { useReducedMotion } from '@frilansaresverige/ui/lib/use-reduced-motion'
import { Alert, AlertDescription } from '@frilansaresverige/ui/ui/alert'
import { Checkbox } from '@frilansaresverige/ui/ui/checkbox'
import { Input } from '@frilansaresverige/ui/ui/input'
import { Label } from '@frilansaresverige/ui/ui/label'
import { Textarea } from '@frilansaresverige/ui/ui/textarea'
import { useRouter } from 'next/router'
import type { ReactElement, ReactNode } from 'react'
import { useEffect } from 'react'
import { FIELD_CLASSES, LABEL_CLASSES } from '../../components/form-classes'
import { useSubmitSlackInvitationForm } from '../../hooks/useSubmitSlackInvitationForm'

// Wraps a status Alert in the Slide entrance animation, except when the
// visitor has asked for reduced motion — in that case it renders as-is,
// with no motion wrapper attached at all.
// Puts an iconify icon inside a form field: the icon sits absolutely on
// the left and the field itself gets matching left padding from its
// caller. `top` differs for single-line inputs (vertically centered) and
// the textarea (pinned to the first line).
const IconField = ({
  icon,
  top = 'top-1/2 -translate-y-1/2',
  children,
}: {
  icon: string
  top?: string
  children: ReactNode
}) => (
  <div className="relative">
    <span
      aria-hidden="true"
      className={`${icon} pointer-events-none absolute left-3.5 size-5 text-brand-blue/50 ${top}`}
    />
    {children}
  </div>
)

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
  const router = useRouter()

  useEffect(() => {
    if (data?.success) {
      void router.push('/ansokan/tack')
    }
  }, [data, router])

  if (error) {
    return (
      <StatusSlide reduced={reduced}>
        <Alert className="mt-8 rounded-[0.75em] border-[#6a6a6a] bg-[#ffaaaa] p-5 text-brand-grey">
          <AlertDescription>Något gick fel. Försök igen.</AlertDescription>
        </Alert>
      </StatusSlide>
    )
  }

  return (
    <div className="w-full max-w-[44em] pt-10 pb-24 md:pt-16">
      <p className="font-display mb-3 text-sm font-bold tracking-widest text-brand-coral uppercase">
        Ansökan
      </p>
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
        Bli en av oss
      </h1>

      <p className="mt-4 mb-8 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
        Slack-gruppen är till för dig som redan är igång som frilansare. Berätta
        kort om dig själv, så tittar vi på din ansökan så snart vi kan.
      </p>

      <form
        className="squircle rounded-[1.25rem] bg-brand-cream p-6 text-left text-brand-blue md:p-10"
        onSubmit={submitForm}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name" className={LABEL_CLASSES}>
              Namn
            </Label>
            <IconField icon="icon-[lucide--user]">
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className={`${FIELD_CLASSES} pl-11`}
              />
            </IconField>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className={LABEL_CLASSES}>
              E-mail
            </Label>
            <IconField icon="icon-[lucide--mail]">
              <Input
                id="email"
                name="email"
                type="text"
                autoComplete="email"
                required
                className={`${FIELD_CLASSES} pl-11`}
              />
            </IconField>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-1.5">
          <Label htmlFor="howlong" className={LABEL_CLASSES}>
            Hur länge har du varit frilansare?
          </Label>
          <IconField icon="icon-[lucide--clock]">
            <Input
              id="howlong"
              name="howlong"
              type="text"
              required
              className={`${FIELD_CLASSES} pl-11`}
            />
          </IconField>
        </div>

        <div className="mt-5 flex flex-col gap-1.5">
          <Label htmlFor="companyName" className={LABEL_CLASSES}>
            Vad heter ditt företag? Eller har du enskild firma?
          </Label>
          <IconField icon="icon-[lucide--building-2]">
            <Input
              id="companyName"
              name="companyName"
              type="text"
              required
              className={`${FIELD_CLASSES} pl-11`}
            />
          </IconField>
        </div>

        <div className="mt-5 flex flex-col gap-1.5">
          <Label htmlFor="linkedin" className={LABEL_CLASSES}>
            Länk till din LinkedIn-profil
          </Label>
          <IconField icon="icon-[simple-icons--linkedin]">
            <Input
              id="linkedin"
              name="linkedin"
              type="text"
              required
              className={`${FIELD_CLASSES} pl-11`}
            />
          </IconField>
        </div>

        <div className="mt-5 flex flex-col gap-1.5">
          <Label htmlFor="motivation" className={LABEL_CLASSES}>
            Motivering
          </Label>
          <p
            id="motivation-description"
            className="text-[0.95em] leading-[1.5]"
          >
            Berätta kort om vad du gör och varför du vill vara med i vårt
            community. Observera att vi endast godkänner medlemmar som ÄR
            frilansare.
          </p>
          <IconField icon="icon-[lucide--message-square]" top="top-[0.85em]">
            <Textarea
              id="motivation"
              name="motivation"
              required
              aria-describedby="motivation-description"
              className={`${FIELD_CLASSES} pl-11`}
            />
          </IconField>
        </div>

        <div className="mt-6 flex flex-row items-baseline justify-start gap-3 rounded-[0.75em] bg-brand-blue/5 p-4">
          <Checkbox
            id="freelancer-confirmation"
            name="freelancer-confirmation"
            required
            className="border-brand-blue"
          />
          <Label
            htmlFor="freelancer-confirmation"
            className="text-[1.05em] leading-[1.5]"
          >
            Jag är igång som frilansare, d v s har ett bolag att fakturera genom
            och tecknat avtal med åtminstone min första kund.
          </Label>
        </div>

        <Button type="submit" variant="primary" size="none" className="mt-8">
          Skicka in ansökan
        </Button>
      </form>
    </div>
  )
}

export default RequestSlackInvitationForm
