import { type FormEvent, useState } from 'react'
import { HONEYPOT_FIELD } from '../lib/form-fields'
import { controlValue, type FormResult, postForm } from './submit-form'

/** The form's relation values mapped to the stored sender type. */
export const RELATION_TO_SENDER_TYPE: Record<string, 'BROKER' | 'DIRECT'> = {
  formedlare: 'BROKER',
  direktavtal: 'DIRECT',
}

export const useSubmitGigTipForm = () => {
  const [data, setData] = useState<FormResult | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [isLoading, setIsLoading] = useState(false)

  const submitForm = async (event: FormEvent) => {
    event.preventDefault()
    if (isLoading) {
      return
    }
    setIsLoading(true)

    const target = event.target
    // The arbetsform checkboxes share a name and only checked ones land
    // in FormData, so reading them there gives the selected set directly.
    // (The instanceof guard keeps unit tests with plain-object mock
    // targets working.)
    const workForm =
      target instanceof HTMLFormElement
        ? new FormData(target).getAll('arbetsform').map(String).join(', ')
        : ''
    // Radix RadioGroup renders hidden radio inputs, so the named form
    // control is a RadioNodeList whose .value is the checked item's value.
    // The keys are the uppdrag service's, not the form's.
    const relation = controlValue(target, 'relation')
    const requestBody = {
      senderType: RELATION_TO_SENDER_TYPE[relation] ?? relation,
      emailAddress: controlValue(target, 'emailAddress'),
      title: controlValue(target, 'title'),
      location: controlValue(target, 'location'),
      customerName: controlValue(target, 'clientName'),
      description: controlValue(target, 'description'),
      scope: controlValue(target, 'omfattning'),
      workForm,
      clientHourlyRate: controlValue(target, 'minRate'),
      contactName: controlValue(target, 'contactName'),
      contactPhone: controlValue(target, 'contactPhone'),
      contactEmail: controlValue(target, 'contactEmail'),
      customerOrganizationNumber: controlValue(
        target,
        'customerOrganizationNumber',
      ),
      customerFee: controlValue(target, 'customerFee'),
      [HONEYPOT_FIELD]: controlValue(target, HONEYPOT_FIELD),
    }

    try {
      setData(await postForm('/api/uppdrag/assignments', requestBody))
      setError(null)
    } catch (e) {
      setError(e)
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }

  return { submitForm, data, isLoading, error }
}
