import { type FormEvent, useState } from 'react'

interface SlackFormTarget extends EventTarget {
  name: HTMLInputElement
  email: HTMLInputElement
  roll: HTMLInputElement
  ort: HTMLInputElement
  howlong: HTMLInputElement
  companyName: HTMLInputElement
  portfolio: HTMLInputElement
  linkedin: HTMLInputElement
  motivation: HTMLInputElement
}
interface Data {
  success?: boolean
}

export const useSubmitSlackInvitationForm = () => {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [isLoading, setIsLoading] = useState(false)

  const submitForm = async (event: FormEvent) => {
    event.preventDefault()
    setIsLoading(true)

    const name = (event.target as SlackFormTarget).name.value
    const email = (event.target as SlackFormTarget).email.value
    const roll = (event.target as SlackFormTarget).roll.value
    const ort = (event.target as SlackFormTarget).ort.value
    const howlong = (event.target as SlackFormTarget).howlong.value
    const portfolio = (event.target as SlackFormTarget).portfolio.value
    const companyName = (event.target as SlackFormTarget).companyName.value
    const linkedin = (event.target as SlackFormTarget).linkedin.value
    const motivation = (event.target as SlackFormTarget).motivation.value

    const requestBody = {
      name,
      email,
      roll,
      ort,
      howlong,
      companyName,
      linkedin,
      portfolio,
      motivation,
    }

    await fetch('/api/request-slack-invitation', {
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
