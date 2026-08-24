import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { SlidingNumber } from './sliding-number'

const meta = {
  title: 'Animate UI/SlidingNumber',
  component: SlidingNumber,
  args: { number: 2500 },
} satisfies Meta<typeof SlidingNumber>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
