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
import { useReducedMotion } from '@frilansaresverige/ui/lib/use-reduced-motion'
import { Input } from '@frilansaresverige/ui/ui/input'
import { Label } from '@frilansaresverige/ui/ui/label'
import { Textarea } from '@frilansaresverige/ui/ui/textarea'
import { useRouter } from 'next/router'
import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import {
  RELATION_TO_SENDER_TYPE,
  useSubmitGigTipForm,
} from '../hooks/useSubmitGigTipForm'
import AssignmentPreview, { type AssignmentView } from './AssignmentPreview'
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
import {
  HoneypotField,
  SubmitErrorAlert,
  SubmittingStatus,
} from './form-extras'

const RELATION_OPTIONS = [
  {
    value: 'formedlare',
    label:
      'Frilansaren skriver avtal med en förmedlare eller ett konsultbolag, som i sin tur har avtal med kunden',
  },
  {
    value: 'direktavtal',
    label: 'Frilansaren skriver avtal direkt med kunden',
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
  { value: 'granska', label: '4. Granska' },
]

const GigTipForm = () => {
  const { submitForm, data, error, isLoading } = useSubmitGigTipForm()
  const reduced = useReducedMotion()
  const router = useRouter()
  const [step, setStep] = useState(STEPS[0].value)
  const [stepError, setStepError] = useState<string | null>(null)
  const paneRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const formRef = useRef<HTMLFormElement>(null)
  // The relation drives which fields step 3 shows, so it is controlled;
  // Radix still renders the hidden radio input the hook reads.
  const [relation, setRelation] = useState('')
  const [customerFee, setCustomerFee] = useState('')
  const [nonTransparentFee, setNonTransparentFee] = useState(false)
  const [emailAddress, setEmailAddress] = useState('')
  const [preview, setPreview] = useState<AssignmentView | null>(null)
  const isBroker = relation === 'formedlare'

  // Reads the current answers off the form for the preview step. The
  // panes stay mounted, so every field is in the DOM.
  const snapshot = (): {
    view: AssignmentView
    contactEmail: string
  } | null => {
    const form = formRef.current
    if (!form) {
      return null
    }
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
        setStepError(
          'Välj ett alternativ i alla obligatoriska fält innan du går vidare.',
        )
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
    if (!validateStep() || stepIndex >= STEPS.length - 1) {
      return
    }
    const next = STEPS[stepIndex + 1].value
    if (next === 'granska') {
      const current = snapshot()
      if (current) {
        setPreview(current.view)
        // The receipt goes to the contact by default; the sender can
        // change it on the preview step.
        setEmailAddress((previous) => previous || current.contactEmail)
      }
    }
    setStep(next)
  }

  const goBack = () => {
    if (stepIndex > 0) {
      setStepError(null)
      setStep(STEPS[stepIndex - 1].value)
    }
  }

  // Enter inside a text field triggers implicit submission. Before the
  // last step that should behave like the Nästa button, and on the last
  // step the pane is validated first so the required radio groups get
  // the same treatment as when clicking Nästa.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (stepIndex < STEPS.length - 1) {
      event.preventDefault()
      goNext()
      return
    }
    if (!validateStep()) {
      event.preventDefault()
      return
    }
    void submitForm(event)
  }

  return (
    <form
      ref={formRef}
      className="relative rounded-[1.25rem] bg-brand-cream p-6 text-left text-brand-blue md:p-10"
      onSubmit={handleSubmit}
      aria-busy={isLoading}
    >
      {error ? (
        <SubmitErrorAlert reduced={reduced}>
          Något gick fel när uppdraget skulle publiceras. Försök igen om en
          stund. Fortsätter det strula, hör av dig via kontaktsidan.
        </SubmitErrorAlert>
      ) : null}
      <HoneypotField />
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
                    className="icon-[lucide--briefcase-business] pointer-events-none absolute top-1/2 left-[0.75em] size-[1.2em] -translate-y-1/2 text-brand-blue/75"
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
                  Beskriv uppdraget
                </Label>
                <div className="relative">
                  <span
                    className="icon-[lucide--text] pointer-events-none absolute top-[0.8em] left-[0.75em] size-[1.2em] text-brand-blue/75"
                    aria-hidden="true"
                  />
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Vad ska göras, i vilket team, när börjar det och hur länge pågår det? Ju mer konkret, desto bättre svar…"
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
                    className="icon-[lucide--map-pin] pointer-events-none absolute top-1/2 left-[0.75em] size-[1.2em] -translate-y-1/2 text-brand-blue/75"
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
                  Lägsta arvode till frilansaren
                </Label>
                <div className="relative">
                  <span
                    className="icon-[lucide--banknote] pointer-events-none absolute top-1/2 left-[0.75em] size-[1.2em] -translate-y-1/2 text-brand-blue/75"
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
                    className="absolute top-1/2 right-[0.75em] -translate-y-1/2 text-[1.1em] text-brand-blue/75"
                    aria-hidden="true"
                  >
                    kr/h
                  </span>
                </div>
              </div>

              <fieldset className="mt-6">
                <legend className={LABEL_CLASSES}>
                  Vem skriver frilansaren avtal med?
                </legend>
                <RadioGroup
                  name="relation"
                  required
                  value={relation}
                  onValueChange={setRelation}
                  className="mt-2 gap-3"
                >
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
                  Företag eller organisation
                </Label>
                <div className="relative">
                  <span
                    className="icon-[lucide--building-2] pointer-events-none absolute top-1/2 left-[0.75em] size-[1.2em] -translate-y-1/2 text-brand-blue/75"
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

              {isBroker && (
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="customerOrganizationNumber"
                      className={LABEL_CLASSES}
                    >
                      Uppdragsgivarens organisationsnummer
                    </Label>
                    <div className="relative">
                      <span
                        className="icon-[lucide--hash] pointer-events-none absolute top-1/2 left-[0.75em] size-[1.2em] -translate-y-1/2 text-brand-blue/75"
                        aria-hidden="true"
                      />
                      <Input
                        id="customerOrganizationNumber"
                        name="customerOrganizationNumber"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{6}-?[0-9]{4}"
                        title="Ange ett organisationsnummer, t.ex. 556677-8899"
                        placeholder="t.ex. 556677-8899…"
                        className={`${FIELD_CLASSES} pl-[2.4em]`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="customerFee" className={LABEL_CLASSES}>
                      Er avgift som mellanhand
                    </Label>
                    <div className="relative">
                      <span
                        className="icon-[lucide--percent] pointer-events-none absolute top-1/2 left-[0.75em] size-[1.2em] -translate-y-1/2 text-brand-blue/75"
                        aria-hidden="true"
                      />
                      <Input
                        id="customerFee"
                        name="customerFee"
                        type="text"
                        placeholder="t.ex. 10 % eller 50 kr/h…"
                        value={customerFee}
                        onChange={(event) => setCustomerFee(event.target.value)}
                        required={!nonTransparentFee}
                        disabled={nonTransparentFee}
                        className={`${FIELD_CLASSES} pl-[2.4em] disabled:opacity-60`}
                      />
                    </div>
                    <Label
                      htmlFor="nonTransparentFee"
                      className="mt-2 flex cursor-pointer flex-row items-center gap-3 text-[0.95em] font-normal"
                    >
                      <Checkbox
                        id="nonTransparentFee"
                        checked={nonTransparentFee}
                        onCheckedChange={(checked) => {
                          const on = checked === true
                          setNonTransparentFee(on)
                          if (on) {
                            setCustomerFee('')
                          }
                        }}
                        className="border-brand-blue"
                      />
                      <span>Vi är inte transparenta med vår avgift</span>
                    </Label>
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-col gap-1.5">
                <Label htmlFor="contactName" className={LABEL_CLASSES}>
                  Kontaktperson
                </Label>
                <div className="relative">
                  <span
                    className="icon-[lucide--contact-round] pointer-events-none absolute top-1/2 left-[0.75em] size-[1.2em] -translate-y-1/2 text-brand-blue/75"
                    aria-hidden="true"
                  />
                  <Input
                    id="contactName"
                    name="contactName"
                    type="text"
                    autoComplete="name"
                    placeholder="t.ex. Kim Lindqvist…"
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
                      className="icon-[lucide--phone] pointer-events-none absolute top-1/2 left-[0.75em] size-[1.2em] -translate-y-1/2 text-brand-blue/75"
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
                      className="icon-[lucide--mail] pointer-events-none absolute top-1/2 left-[0.75em] size-[1.2em] -translate-y-1/2 text-brand-blue/75"
                      aria-hidden="true"
                    />
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      pattern={EMAIL_PATTERN}
                      title={EMAIL_TITLE}
                      autoComplete="email"
                      placeholder="kim@acme.se…"
                      required
                      className={`${FIELD_CLASSES} pl-[2.4em]`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="granska">
            <div
              ref={(el) => {
                paneRefs.current.granska = el
              }}
            >
              <p className="mb-4 leading-[1.6]">
                Så här kommer uppdraget att se ut för frilansarna. Vill du ändra
                något? Gå tillbaka till rätt steg ovan.
              </p>
              {preview && (
                <div className="rounded-[1rem] border border-brand-blue/20">
                  <AssignmentPreview assignment={preview} />
                </div>
              )}

              <div className="mt-6 flex flex-col gap-1.5">
                <Label htmlFor="emailAddress" className={LABEL_CLASSES}>
                  Din e-postadress
                </Label>
                <p className="text-[0.95em] text-brand-blue/80">
                  Hit skickar vi kvittensen och länken där du kan komplettera
                  eller ta bort uppdraget. Adressen visas också som avsändare i
                  Slack, så att frilansare kan nå dig. Håll länken hemlig.
                </p>
                <div className="relative">
                  <span
                    className="icon-[lucide--mail-check] pointer-events-none absolute top-1/2 left-[0.75em] size-[1.2em] -translate-y-1/2 text-brand-blue/75"
                    aria-hidden="true"
                  />
                  <Input
                    id="emailAddress"
                    name="emailAddress"
                    type="email"
                    pattern={EMAIL_PATTERN}
                    title={EMAIL_TITLE}
                    autoComplete="email"
                    value={emailAddress}
                    onChange={(event) => setEmailAddress(event.target.value)}
                    required
                    className={`${FIELD_CLASSES} pl-[2.4em]`}
                  />
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
          <Button
            type="submit"
            variant="primary"
            size="none"
            disabled={isLoading}
          >
            {isLoading ? 'Publicerar…' : 'Publicera uppdraget'}
          </Button>
        )}
      </div>
      <SubmittingStatus active={isLoading} />
    </form>
  )
}

export default GigTipForm
