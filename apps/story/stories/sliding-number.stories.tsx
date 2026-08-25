import { SlidingNumber } from '@frilansaresverige/ui/animate-ui/primitives/texts/sliding-number'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Animate UI/SlidingNumber',
  component: SlidingNumber,
  args: { number: 2500 },
} satisfies Meta<typeof SlidingNumber>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
