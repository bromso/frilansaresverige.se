import { type FormEvent, useState } from 'react'
import { HONEYPOT_FIELD } from '../lib/form-fields'
import { controlValue, type FormResult, postForm } from './submit-form'

export const useSubmitSlackInvitationForm = () => {
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
    const requestBody = {
      name: controlValue(target, 'name'),
      email: controlValue(target, 'email'),
      roll: controlValue(target, 'roll'),
      ort: controlValue(target, 'ort'),
      howlong: controlValue(target, 'howlong'),
      companyName: controlValue(target, 'companyName'),
      linkedin: controlValue(target, 'linkedin'),
      portfolio: controlValue(target, 'portfolio'),
      motivation: controlValue(target, 'motivation'),
      [HONEYPOT_FIELD]: controlValue(target, HONEYPOT_FIELD),
    }

    try {
      setData(await postForm('/api/request-slack-invitation', requestBody))
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
