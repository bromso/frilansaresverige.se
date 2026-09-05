import { type FormEvent, useState } from 'react'
import { HONEYPOT_FIELD } from '../lib/form-fields'
import { controlValue, type FormResult, postForm } from './submit-form'

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
    const arbetsform =
      target instanceof HTMLFormElement
        ? new FormData(target).getAll('arbetsform').map(String).join(', ')
        : ''
    // Radix RadioGroup renders hidden radio inputs, so the named form
    // control is a RadioNodeList whose .value is the checked item's value.
    const requestBody = {
      title: controlValue(target, 'title'),
      location: controlValue(target, 'location'),
      clientName: controlValue(target, 'clientName'),
      minRate: controlValue(target, 'minRate'),
      description: controlValue(target, 'description'),
      contactName: controlValue(target, 'contactName'),
      contactPhone: controlValue(target, 'contactPhone'),
      contactEmail: controlValue(target, 'contactEmail'),
      relation: controlValue(target, 'relation'),
      omfattning: controlValue(target, 'omfattning'),
      arbetsform,
      [HONEYPOT_FIELD]: controlValue(target, HONEYPOT_FIELD),
    }

    try {
      setData(await postForm('/api/submit-gig-tip', requestBody))
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
