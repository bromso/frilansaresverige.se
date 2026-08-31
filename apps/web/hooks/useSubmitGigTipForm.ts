import { type FormEvent, useState } from 'react'

interface GigTipFormTarget extends EventTarget {
  title: HTMLInputElement
  location: HTMLInputElement
  clientName: HTMLInputElement
  minRate: HTMLInputElement
  description: HTMLInputElement
  contactName: HTMLInputElement
  contactPhone: HTMLInputElement
  contactEmail: HTMLInputElement
  // Radix RadioGroup renders hidden radio inputs, so the named form
  // control is a RadioNodeList whose .value is the checked item's value.
  relation: { value: string }
  omfattning: { value: string }
}
interface Data {
  success?: boolean
}

export const useSubmitGigTipForm = () => {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [isLoading, setIsLoading] = useState(false)

  const submitForm = async (event: FormEvent) => {
    event.preventDefault()
    setIsLoading(true)

    const target = event.target as GigTipFormTarget
    // The arbetsform checkboxes share a name and only checked ones land
    // in FormData, so reading them there gives the selected set directly.
    // (The instanceof guard keeps unit tests with plain-object mock
    // targets working.)
    const arbetsform =
      target instanceof HTMLFormElement
        ? new FormData(target).getAll('arbetsform').map(String).join(', ')
        : ''
    const requestBody = {
      title: target.title.value,
      location: target.location.value,
      clientName: target.clientName.value,
      minRate: target.minRate.value,
      description: target.description.value,
      contactName: target.contactName.value,
      contactPhone: target.contactPhone.value,
      contactEmail: target.contactEmail.value,
      relation: target.relation.value,
      omfattning: target.omfattning.value,
      arbetsform,
    }

    await fetch('/api/submit-gig-tip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })
      .then((response) => response.json())
      .then((data) => {
        setData(data)
        setError(null)
        setIsLoading(false)
      })
      .catch((e) => {
        setError(e)
        setData(null)
        setIsLoading(false)
      })
  }

  return { submitForm, data, isLoading, error }
}
