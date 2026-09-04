import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from '@frilansaresverige/ui/animate-ui/components/animate/tabs'
import { Button } from '@frilansaresverige/ui/animate-ui/components/buttons/button'
import { Checkbox } from '@frilansaresverige/ui/animate-ui/components/radix/checkbox'
import { Slide } from '@frilansaresverige/ui/animate-ui/primitives/effects/slide'
import { useReducedMotion } from '@frilansaresverige/ui/lib/use-reduced-motion'
import { Alert, AlertDescription } from '@frilansaresverige/ui/ui/alert'
import { Input } from '@frilansaresverige/ui/ui/input'
import { Label } from '@frilansaresverige/ui/ui/label'
import { Textarea } from '@frilansaresverige/ui/ui/textarea'
import { useRouter } from 'next/router'
import type { ReactElement, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useSubmitSlackInvitationForm } from '../hooks/useSubmitSlackInvitationForm'
import {
  EMAIL_PATTERN,
  EMAIL_TITLE,
  FIELD_CLASSES,
  LABEL_CLASSES,
  URL_PATTERN,
  URL_TITLE,
} from './form-classes'

// The application is a three-step stepper on the animate-ui Tabs, same
// treatment as the gig-tip form on /tipsa: a pill progress row, panes
// that slide sideways, and forward navigation gated on the current
// step's native constraint validation.
const STEPS = [
  { value: 'om-dig', label: '1. Om dig' },
  { value: 'frilansandet', label: '2. Frilansandet' },
  { value: 'motivering', label: '3. Motivering' },
]

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
  const router = useRouter()
  const [step, setStep] = useState(STEPS[0].value)
  const paneRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (data?.success) {
      void router.push('/ansokan/tack')
    }
  }, [data, router])

  const stepIndex = STEPS.findIndex((s) => s.value === step)

  const validateStep = (): boolean => {
    const pane = paneRefs.current[step]
    if (!pane) {
      return true
    }
    for (const field of pane.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement
    >('input:not([type="checkbox"]), textarea')) {
      if (!field.reportValidity()) {
        return false
      }
    }
    return true
  }

  const goTo = (value: string) => {
    // Backwards is always allowed; forwards only via the validated
    // Nästa button.
    if (STEPS.findIndex((s) => s.value === value) < stepIndex) {
      setStep(value)
    }
  }

  const goNext = () => {
    if (validateStep() && stepIndex < STEPS.length - 1) {
      setStep(STEPS[stepIndex + 1].value)
    }
  }

  const goBack = () => {
    if (stepIndex > 0) {
      setStep(STEPS[stepIndex - 1].value)
    }
  }

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
      <p className="font-display mb-3 text-sm font-bold tracking-widest text-eyebrow uppercase">
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
        className="rounded-[1.25rem] bg-brand-cream p-6 text-left text-brand-blue md:p-10"
        onSubmit={submitForm}
      >
        <Tabs value={step} onValueChange={goTo} className="gap-6">
          <TabsList>
            {STEPS.map((s, index) => (
              <TabsTrigger
                key={s.value}
                value={s.value}
                disabled={index > stepIndex}
              >
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContents>
            <TabsContent value="om-dig">
              <div
                ref={(el) => {
                  paneRefs.current['om-dig'] = el
                }}
              >
                <div className="grid gap-5">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="name" className={LABEL_CLASSES}>
                      Namn
                    </Label>
                    <IconField icon="icon-[lucide--user]">
                      <Input
                        id="name"
                        placeholder="Anna Andersson…"
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
                        placeholder="anna@exempel.se…"
                        name="email"
                        type="email"
                        pattern={EMAIL_PATTERN}
                        title={EMAIL_TITLE}
                        autoComplete="email"
                        required
                        className={`${FIELD_CLASSES} pl-11`}
                      />
                    </IconField>
                  </div>
                </div>

                <div className="mt-5 grid gap-5">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="roll" className={LABEL_CLASSES}>
                      Vad jobbar du med?
                    </Label>
                    <IconField icon="icon-[lucide--briefcase-business]">
                      <Input
                        id="roll"
                        placeholder="t.ex. UX-designer…"
                        name="roll"
                        type="text"
                        required
                        className={`${FIELD_CLASSES} pl-11`}
                      />
                    </IconField>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="ort" className={LABEL_CLASSES}>
                      Var i Sverige finns du?
                    </Label>
                    <IconField icon="icon-[lucide--map-pin]">
                      <Input
                        id="ort"
                        placeholder="t.ex. Göteborg…"
                        name="ort"
                        type="text"
                        required
                        className={`${FIELD_CLASSES} pl-11`}
                      />
                    </IconField>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="frilansandet">
              <div
                ref={(el) => {
                  paneRefs.current.frilansandet = el
                }}
              >
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="howlong" className={LABEL_CLASSES}>
                    Hur länge har du varit frilansare?
                  </Label>
                  <IconField icon="icon-[lucide--clock]">
                    <Input
                      id="howlong"
                      placeholder="t.ex. 3 år…"
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
                      placeholder="t.ex. Anna Design AB…"
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
                      placeholder="linkedin.com/in/anna-andersson…"
                      name="linkedin"
                      type="text"
                      inputMode="url"
                      pattern={URL_PATTERN}
                      title={URL_TITLE}
                      required
                      className={`${FIELD_CLASSES} pl-11`}
                    />
                  </IconField>
                </div>

                <div className="mt-5 flex flex-col gap-1.5">
                  <Label htmlFor="portfolio" className={LABEL_CLASSES}>
                    Hemsida eller portfolio (valfritt)
                  </Label>
                  <IconField icon="icon-[lucide--globe]">
                    <Input
                      id="portfolio"
                      placeholder="annadesign.se…"
                      name="portfolio"
                      type="text"
                      inputMode="url"
                      pattern={URL_PATTERN}
                      title={URL_TITLE}
                      className={`${FIELD_CLASSES} pl-11`}
                    />
                  </IconField>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="motivering">
              <div
                ref={(el) => {
                  paneRefs.current.motivering = el
                }}
              >
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="motivation" className={LABEL_CLASSES}>
                    Motivering
                  </Label>
                  <p
                    id="motivation-description"
                    className="text-[0.95em] leading-[1.5]"
                  >
                    Berätta kort om vad du gör och varför du vill vara med i
                    vårt community. Observera att vi endast godkänner medlemmar
                    som ÄR frilansare.
                  </p>
                  <IconField
                    icon="icon-[lucide--message-square]"
                    top="top-[0.85em]"
                  >
                    <Textarea
                      id="motivation"
                      placeholder="Jag är frilansande formgivare sedan 2021 och vill…"
                      name="motivation"
                      required
                      aria-describedby="motivation-description"
                      className={`${FIELD_CLASSES} pl-11`}
                    />
                  </IconField>
                </div>

                {/* The whole box is the label, so clicking anywhere in it
                    toggles the checkbox. */}
                <Label
                  htmlFor="freelancer-confirmation"
                  className="mt-6 flex cursor-pointer flex-row items-baseline justify-start gap-3 rounded-[0.75em] bg-brand-blue/5 p-4"
                >
                  <Checkbox
                    id="freelancer-confirmation"
                    name="freelancer-confirmation"
                    required
                    className="border-brand-blue"
                  />
                  <span className="text-[1.05em] leading-[1.5]">
                    Jag är igång som frilansare, d v s har ett bolag att
                    fakturera genom och tecknat avtal med åtminstone min första
                    kund.
                  </span>
                </Label>
              </div>
            </TabsContent>
          </TabsContents>
        </Tabs>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          {stepIndex > 0 ? (
            <Button
              type="button"
              variant="primary-outline"
              size="none"
              className="border-brand-blue/40 text-brand-blue hover:border-brand-blue hover:bg-brand-blue hover:text-brand-cream"
              onClick={goBack}
            >
              Tillbaka
            </Button>
          ) : (
            <span />
          )}
          {stepIndex < STEPS.length - 1 ? (
            <Button
              type="button"
              variant="primary"
              size="none"
              onClick={goNext}
            >
              Nästa
            </Button>
          ) : (
            <Button type="submit" variant="primary" size="none">
              Skicka in ansökan
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

export default RequestSlackInvitationForm
