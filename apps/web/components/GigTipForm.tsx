import { Button } from '@frilansaresverige/ui/animate-ui/components/buttons/button'
import { Slide } from '@frilansaresverige/ui/animate-ui/primitives/effects/slide'
import { useReducedMotion } from '@frilansaresverige/ui/lib/use-reduced-motion'
import { Alert, AlertDescription } from '@frilansaresverige/ui/ui/alert'
import { Input } from '@frilansaresverige/ui/ui/input'
import { Label } from '@frilansaresverige/ui/ui/label'
import {
  RadioGroup,
  RadioGroupItem,
} from '@frilansaresverige/ui/ui/radio-group'
import { Textarea } from '@frilansaresverige/ui/ui/textarea'
import type { ReactElement } from 'react'
import { useSubmitGigTipForm } from '../hooks/useSubmitGigTipForm'
import { FIELD_CLASSES, LABEL_CLASSES } from './form-classes'

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

  if (data?.success) {
    return (
      <StatusSlide reduced={reduced}>
        <Alert className="mt-8 rounded-[0.75em] border-[#6a6a6a] bg-[#adffb4] p-5 text-brand-grey">
          <AlertDescription>
            Tack för tipset! Uppdraget är inskickat till communityt.
          </AlertDescription>
        </Alert>
      </StatusSlide>
    )
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
      className="squircle rounded-[1.25rem] bg-brand-cream p-6 text-left text-brand-blue md:p-10"
      onSubmit={submitForm}
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
            required
            className={`${FIELD_CLASSES} pl-[2.4em]`}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
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
              placeholder="t.ex. Remote / Göteborg / Hybrid Stockholm"
              required
              className={`${FIELD_CLASSES} pl-[2.4em]`}
            />
          </div>
        </div>

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
              placeholder="t.ex. företagets namn"
              required
              className={`${FIELD_CLASSES} pl-[2.4em]`}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-1.5">
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
            placeholder="t.ex. 1000"
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
            required
            className={`${FIELD_CLASSES} min-h-[10em] pl-[2.4em]`}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-1.5">
        <Label htmlFor="contact" className={LABEL_CLASSES}>
          Kontaktuppgifter till ansvarig person
        </Label>
        <p id="contact-description" className="text-[0.95em] leading-[1.5]">
          Namn, telefonnummer m.m.
        </p>
        <div className="relative">
          <span
            className="icon-[lucide--contact-round] pointer-events-none absolute top-[0.8em] left-[0.75em] size-[1.2em] text-brand-blue/60"
            aria-hidden="true"
          />
          <Textarea
            id="contact"
            name="contact"
            required
            aria-describedby="contact-description"
            className={`${FIELD_CLASSES} min-h-[5em] pl-[2.4em]`}
          />
        </div>
      </div>

      <fieldset className="mt-6">
        <legend className={LABEL_CLASSES}>
          Hur kommer frilansarens relation med kunden se ut?
        </legend>
        <RadioGroup name="relation" required className="mt-2 gap-3">
          {RELATION_OPTIONS.map((option) => (
            <div
              key={option.value}
              className="flex flex-row items-baseline justify-start gap-3 rounded-[0.75em] bg-brand-blue/5 p-4"
            >
              <RadioGroupItem
                id={`relation-${option.value}`}
                value={option.value}
                className="border-brand-blue text-brand-blue"
              />
              <Label
                htmlFor={`relation-${option.value}`}
                className="text-[1.05em] leading-[1.5]"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </fieldset>

      <Button type="submit" variant="primary" size="none" className="mt-8">
        Skicka in tipset
      </Button>
    </form>
  )
}

export default GigTipForm
