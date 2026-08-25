import { type FormEvent, useState } from 'react'

interface GigTipFormTarget extends EventTarget {
  title: HTMLInputElement
  location: HTMLInputElement
  clientName: HTMLInputElement
  minRate: HTMLInputElement
  description: HTMLInputElement
  contact: HTMLInputElement
  // Radix RadioGroup renders hidden radio inputs, so the named form
  // control is a RadioNodeList whose .value is the checked item's value.
  relation: { value: string }
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
    const requestBody = {
      title: target.title.value,
      location: target.location.value,
      clientName: target.clientName.value,
      minRate: target.minRate.value,
      description: target.description.value,
      contact: target.contact.value,
      relation: target.relation.value,
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
