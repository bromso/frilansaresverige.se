import { afterEach, describe, expect, it } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import AssignmentPreview, {
  type AssignmentView,
  formatCommentDate,
} from './AssignmentPreview'

const view: AssignmentView = {
  title: 'Frontendutvecklare',
  description: 'React.\nTypeScript.',
  customerName: 'Acme AB',
  location: 'Göteborg',
  scope: 'Heltid',
  workForm: 'Distans',
  contact: 'Kim\n070-123 45 67',
  senderType: 'BROKER',
  clientHourlyRate: '950',
  deleted: false,
}

describe('AssignmentPreview', () => {
  afterEach(() => cleanup())

  it('renders the listing and its comments', () => {
    render(
      <AssignmentPreview
        assignment={view}
        comments={[{ id: 1, comment: 'Start i maj.', created: 1758542400 }]}
      />,
    )
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Frontendutvecklare',
    )
    expect(screen.getByText('Göteborg')).toBeInTheDocument()
    expect(screen.getByText('950 kr/h')).toBeInTheDocument()
    expect(screen.getByText('Avtal med förmedlare')).toBeInTheDocument()
    expect(screen.getByText('Start i maj.')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 3, name: /^Komplettering den/ }),
    ).toBeInTheDocument()
  })

  it('renders the deleted notice instead of the details', () => {
    render(<AssignmentPreview assignment={{ ...view, deleted: true }} />)
    expect(
      screen.getByText('Denna uppdragsannons har raderats.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Göteborg')).toBeNull()
  })

  it('formats comment timestamps in Swedish', () => {
    // This runtime's ICU data omits "kl." before the time for sv-SE
    // dateStyle: 'long' + timeStyle: 'short' (observed: "den 22 september
    // 2025 14:00"), so the "kl. " prefix is optional here.
    expect(formatCommentDate(1758542400)).toMatch(
      /^den \d{1,2} september 2025 (kl\. )?\d{2}[.:]\d{2}$/,
    )
  })
})
