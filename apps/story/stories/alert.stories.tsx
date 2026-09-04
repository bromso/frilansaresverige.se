import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@frilansaresverige/ui/ui/alert'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'UI/Alert',
  component: Alert,
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Status: Story = {
  render: () => (
    <Alert className="w-96 rounded-[0.75em] border-[#6a6a6a] bg-brand-cream p-5 text-brand-grey">
      <AlertTitle>Tack för din ansökan</AlertTitle>
      <AlertDescription>
        Vi hör av oss via mejl när den är granskad.
      </AlertDescription>
    </Alert>
  ),
}

export const ErrorState: Story = {
  render: () => (
    <Alert className="w-96 rounded-[0.75em] border-[#6a6a6a] bg-[#ffaaaa] p-5 text-brand-grey">
      <AlertDescription>Något gick fel. Försök igen.</AlertDescription>
    </Alert>
  ),
}
