import { describe, expect, it } from 'bun:test'
import { prefillEmail, readGigPreview } from './gig-preview'

// Builds a real form so FormData behaves as in the browser: unchecked
// checkboxes and disabled inputs are absent.
const buildForm = (
  fields: Record<string, string>,
  options: { disabled?: string[]; checked?: string[] } = {},
) => {
  const form = document.createElement('form')
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input')
    input.name = name
    input.value = value
    if (options.disabled?.includes(name)) {
      input.disabled = true
    }
    form.appendChild(input)
  }
  for (const value of options.checked ?? []) {
    const box = document.createElement('input')
    box.type = 'checkbox'
    box.name = 'arbetsform'
    box.value = value
    box.checked = true
    form.appendChild(box)
  }
  document.body.appendChild(form)
  return form
}

const answers = {
  title: ' Frontendutvecklare ',
  description: 'React.',
  clientName: 'Acme AB',
  location: 'Göteborg',
  omfattning: 'Heltid',
  minRate: '950',
  relation: 'formedlare',
  contactName: 'Kim',
  contactPhone: '070-123 45 67',
  contactEmail: 'kim@acme.se',
  customerFee: '10 %',
  customerOrganizationNumber: '556677-8899',
}

describe('readGigPreview', () => {
  it('maps the form controls to the listing view', () => {
    const form = buildForm(answers, { checked: ['Distans', 'Hybrid'] })
    expect(readGigPreview(form, { nonTransparentFee: false })).toEqual({
      contactEmail: 'kim@acme.se',
      view: {
        title: 'Frontendutvecklare',
        description: 'React.',
        customerName: 'Acme AB',
        location: 'Göteborg',
        scope: 'Heltid',
        workForm: 'Distans, Hybrid',
        contact: 'Kim\n070-123 45 67\nkim@acme.se',
        senderType: 'BROKER',
        clientHourlyRate: '950',
        customerFee: '10 %',
        customerOrganizationNumber: '556677-8899',
        deleted: false,
      },
    })
  })

  it('drops the fee when the broker is not transparent about it', () => {
    const form = buildForm(answers, { disabled: ['customerFee'] })
    expect(
      readGigPreview(form, { nonTransparentFee: true }).view.customerFee,
    ).toBeNull()
  })

  it('treats a direct listing with no broker fields as such', () => {
    const {
      customerFee: _fee,
      customerOrganizationNumber: _org,
      ...direct
    } = answers
    const form = buildForm({ ...direct, relation: 'direktavtal' })
    const { view } = readGigPreview(form, { nonTransparentFee: false })
    expect(view).toMatchObject({
      senderType: 'DIRECT',
      customerFee: null,
      customerOrganizationNumber: null,
      workForm: null,
    })
  })

  it('falls back to a direct listing for an unknown relation', () => {
    const form = buildForm({ ...answers, relation: '' })
    expect(
      readGigPreview(form, { nonTransparentFee: false }).view.senderType,
    ).toBe('DIRECT')
  })
})

describe('prefillEmail', () => {
  it('uses the contact address only until the sender has typed one', () => {
    expect(prefillEmail('', 'kim@acme.se')).toBe('kim@acme.se')
    expect(prefillEmail('me@example.se', 'kim@acme.se')).toBe('me@example.se')
  })
})
