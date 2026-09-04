import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from '@frilansaresverige/ui/animate-ui/components/animate/tabs'
import { Button } from '@frilansaresverige/ui/animate-ui/components/buttons/button'
import { Checkbox } from '@frilansaresverige/ui/animate-ui/components/radix/checkbox'
import {
  RadioGroup,
  RadioGroupItem,
} from '@frilansaresverige/ui/animate-ui/components/radix/radio-group'
import { Slide } from '@frilansaresverige/ui/animate-ui/primitives/effects/slide'
import { useReducedMotion } from '@frilansaresverige/ui/lib/use-reduced-motion'
import { Alert, AlertDescription } from '@frilansaresverige/ui/ui/alert'
import { Input } from '@frilansaresverige/ui/ui/input'
import { Label } from '@frilansaresverige/ui/ui/label'
import { Textarea } from '@frilansaresverige/ui/ui/textarea'
import { useRouter } from 'next/router'
import type { ReactElement } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useSubmitGigTipForm } from '../hooks/useSubmitGigTipForm'
import {
  EMAIL_PATTERN,
  EMAIL_TITLE,
  FIELD_CLASSES,
  LABEL_CLASSES,
  NUMBER_PATTERN,
  NUMBER_TITLE,
  PHONE_PATTERN,
  PHONE_TITLE,
} from './form-classes'

const RELATION_OPTIONS = [
  {
    value: 'formedlare',
    label:
      'Uppdraget innebär avtal med en förmedlare, som i sin tur har avtal med kunden',
  },
  {
    value: 'direktavtal',
    label: 'Den vi söker kommer ha direktavtal med kunden',
  },
]

// The option values double as the human-readable text that reaches the
// Slack message, so they are the Swedish labels as-is.
const OMFATTNING_OPTIONS = ['Heltid', 'Halvtid', 'Deltid']
const ARBETSFORM_OPTIONS = ['Distans', 'Hybrid', 'På plats']

// The form is a three-step stepper built on the animate-ui Tabs: the
// pill trigger row shows progress, the panes slide sideways between
// steps, and the container animates to each pane's height. Forward
// navigation runs the current pane's fields through native constraint
// validation first, so by the time the last step submits every earlier
// field is valid (required fields in inactive panes can't be focused by
// the browser's own submit validation).
const STEPS = [
  { value: 'uppdraget', label: '1. Uppdraget' },
  { value: 'villkor', label: '2. Villkor' },
  { value: 'kontakt', label: '3. Kontakt' },
]

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

const GigTipForm = () => {
  const { submitForm, data, error } = useSubmitGigTipForm()
  const reduced = useReducedMotion()
  const router = useRouter()
  const [step, setStep] = useState(STEPS[0].value)
  const [stepError, setStepError] = useState<string | null>(null)
  const paneRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (data?.success) {
      void router.push('/tipsa/tack')
    }
  }, [data, router])

  const stepIndex = STEPS.findIndex((s) => s.value === step)

  // Text fields validate through the browser (reportValidity focuses and
  // explains); required radio groups are checked by hand because Radix's
  // hidden radio input can't take focus for the native bubble.
  const validateStep = (): boolean => {
    const pane = paneRefs.current[step]
    if (!pane) {
      return true
    }
    for (const field of pane.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement
    >('input:not([type="radio"]):not([type="checkbox"]), textarea')) {
      if (!field.reportValidity()) {
        return false
      }
    }
    for (const group of pane.querySelectorAll(
      '[role="radiogroup"][aria-required="true"]',
    )) {
      if (!group.querySelector('[role="radio"][data-state="checked"]')) {
        setStepError('Välj ett alternativ i alla obligatoriska fält.')
        return false
      }
    }
    setStepError(null)
    return true
  }

  const goTo = (value: string) => {
    // Backwards is always allowed; forwards only via the validated
    // Nästa button.
    if (STEPS.findIndex((s) => s.value === value) < stepIndex) {
      setStepError(null)
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
      setStepError(null)
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
          <TabsContent value="uppdraget">
            <div
              ref={(el) => {
                paneRefs.current.uppdraget = el
              }}
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title" className={LABEL_CLASSES}>
                  Uppdragets titel
                </Label>
                <div className="relative">
                  <span
                    className="icon-[lucide--briefcase-business] pointer-events-none absolute top-1/2 left-[0.75em] size-[1.2em] -translate-y-1/2 text-brand-blue/60"
                    aria-hidden="true"
                  />
                  <Input
                    id="title"
                    name="title"
                    type="text"
                    placeholder="t.ex. Senior frontendutvecklare till betalplattform…"
                    required
                    className={`${FIELD_CLASSES} pl-[2.4em]`}
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-1.5">
                <Label htmlFor="description" className={LABEL_CLASSES}>
                  Beskrivning av uppdraget och uppdragsgivarens behov
                </Label>
                <div className="relative">
                  <span
                    className="icon-[lucide--text] pointer-events-none absolute top-[0.8em] left-[0.75em] size-[1.2em] text-brand-blue/60"
                    aria-hidden="true"
                  />
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Beskriv uppdraget, teamet och behoven…"
                    required
                    className={`${FIELD_CLASSES} min-h-[10em] pl-[2.4em]`}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="villkor">
            <div
              ref={(el) => {
                paneRefs.current.villkor = el
              }}
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="location" className={LABEL_CLASSES}>
                  Plats
                </Label>
                <div className="relative">
                  <span
                    className="icon-[lucide--map-pin] pointer-events-none absolute top-1/2 left-[0.75em] size-[1.2em] -translate-y-1/2 text-brand-blue/60"
                    aria-hidden="true"
                  />
                  <Input
                    id="location"
                    name="location"
                    type="text"
                    placeholder="t.ex. Göteborg…"
                    required
                    className={`${FIELD_CLASSES} pl-[2.4em]`}
                  />
                </div>
              </div>

              <fieldset className="mt-6">
                <legend className={LABEL_CLASSES}>Omfattning</legend>
                <RadioGroup
                  name="omfattning"
                  required
                  className="mt-2 grid-cols-1 gap-3 md:grid-cols-3"
                >
                  {OMFATTNING_OPTIONS.map((option) => (
                    // The whole box is the label — clicking anywhere in it
                    // selects the radio.
                    <Label
                      key={option}
                      htmlFor={`omfattning-${option}`}
                      className="flex cursor-pointer flex-row items-center justify-start gap-3 rounded-[0.75em] bg-brand-blue/5 p-4"
                    >
                      <RadioGroupItem
                        id={`omfattning-${option}`}
                        value={option}
                        className="border-brand-blue text-brand-blue"
                      />
                      <span className="text-[1.05em] leading-[1.5]">
                        {option}
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </fieldset>

              <fieldset className="mt-6">
                <legend className={LABEL_CLASSES}>Arbetsform</legend>
                <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
                  {ARBETSFORM_OPTIONS.map((option) => (
                    <Label
                      key={option}
                      htmlFor={`arbetsform-${option}`}
                      className="flex cursor-pointer flex-row items-center justify-start gap-3 rounded-[0.75em] bg-brand-blue/5 p-4"
                    >
                      <Checkbox
                        id={`arbetsform-${option}`}
                        name="arbetsform"
                        value={option}
                        className="border-brand-blue"
                      />
                      <span className="text-[1.05em] leading-[1.5]">
                        {option}
                      </span>
                    </Label>
                  ))}
                </div>
              </fieldset>

              <div className="mt-6 flex flex-col gap-1.5">
                <Label htmlFor="minRate" className={LABEL_CLASSES}>
                  Minimumarvode till frilansaren
                </Label>
                <div className="relative">
                  <span
                    className="icon-[lucide--banknote] pointer-events-none absolute top-1/2 left-[0.75em] size-[1.2em] -translate-y-1/2 text-brand-blue/60"
                    aria-hidden="true"
                  />
                  <Input
                    id="minRate"
                    name="minRate"
                    type="text"
                    inputMode="numeric"
                    pattern={NUMBER_PATTERN}
                    title={NUMBER_TITLE}
                    placeholder="t.ex. 950…"
                    required
                    className={`${FIELD_CLASSES} pr-[3.5em] pl-[2.4em]`}
                  />
                  <span
                    className="absolute top-1/2 right-[0.75em] -translate-y-1/2 text-[1.1em] text-brand-blue/60"
                    aria-hidden="true"
                  >
                    kr/h
                  </span>
                </div>
              </div>

              <fieldset className="mt-6">
                <legend className={LABEL_CLASSES}>
                  Hur kommer frilansarens relation med kunden se ut?
                </legend>
                <RadioGroup name="relation" required className="mt-2 gap-3">
                  {RELATION_OPTIONS.map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={`relation-${option.value}`}
                      className="flex cursor-pointer flex-row items-baseline justify-start gap-3 rounded-[0.75em] bg-brand-blue/5 p-4"
                    >
                      <RadioGroupItem
                        id={`relation-${option.value}`}
                        value={option.value}
                        className="border-brand-blue text-brand-blue"
                      />
                      <span className="text-[1.05em] leading-[1.5]">
                        {option.label}
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </fieldset>
            </div>
          </TabsContent>

          <TabsContent value="kontakt">
            <div
              ref={(el) => {
                paneRefs.current.kontakt = el
              }}
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="clientName" className={LABEL_CLASSES}>
                  Uppdragsgivarens namn
                </Label>
                <div className="relative">
                  <span
                    className="icon-[lucide--building-2] pointer-events-none absolute top-1/2 left-[0.75em] size-[1.2em] -translate-y-1/2 text-brand-blue/60"
                    aria-hidden="true"
                  />
                  <Input
                    id="clientName"
                    name="clientName"
                    type="text"
                    placeholder="t.ex. Acme AB…"
                    required
                    className={`${FIELD_CLASSES} pl-[2.4em]`}
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-1.5">
                <Label htmlFor="contactName" className={LABEL_CLASSES}>
                  Kontaktperson
                </Label>
                <div className="relative">
                  <span
                    className="icon-[lucide--contact-round] pointer-events-none absolute top-1/2 left-[0.75em] size-[1.2em] -translate-y-1/2 text-brand-blue/60"
                    aria-hidden="true"
                  />
                  <Input
                    id="contactName"
                    name="contactName"
                    type="text"
                    autoComplete="name"
                    placeholder="t.ex. Anna Andersson…"
                    required
                    className={`${FIELD_CLASSES} pl-[2.4em]`}
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contactPhone" className={LABEL_CLASSES}>
                    Telefonnummer
                  </Label>
                  <div className="relative">
                    <span
                      className="icon-[lucide--phone] pointer-events-none absolute top-1/2 left-[0.75em] size-[1.2em] -translate-y-1/2 text-brand-blue/60"
                      aria-hidden="true"
                    />
                    <Input
                      id="contactPhone"
                      name="contactPhone"
                      type="tel"
                      pattern={PHONE_PATTERN}
                      title={PHONE_TITLE}
                      placeholder="t.ex. 070-123 45 67…"
                      required
                      className={`${FIELD_CLASSES} pl-[2.4em]`}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contactEmail" className={LABEL_CLASSES}>
                    E-post
                  </Label>
                  <div className="relative">
                    <span
                      className="icon-[lucide--mail] pointer-events-none absolute top-1/2 left-[0.75em] size-[1.2em] -translate-y-1/2 text-brand-blue/60"
                      aria-hidden="true"
                    />
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      pattern={EMAIL_PATTERN}
                      title={EMAIL_TITLE}
                      autoComplete="email"
                      placeholder="anna@acme.se…"
                      required
                      className={`${FIELD_CLASSES} pl-[2.4em]`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </TabsContents>
      </Tabs>

      {stepError && (
        <p className="mt-4 text-[0.95em] font-medium text-red-700" role="alert">
          {stepError}
        </p>
      )}

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
          <Button type="button" variant="primary" size="none" onClick={goNext}>
            Nästa
          </Button>
        ) : (
          <Button type="submit" variant="primary" size="none">
            Skicka in tipset
          </Button>
        )}
      </div>
    </form>
  )
}

export default GigTipForm
