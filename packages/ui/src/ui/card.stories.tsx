import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Card } from './card'

const meta = {
  title: 'UI/Card',
  component: Card,
  args: {
    className: 'bg-brand-cream text-brand-blue rounded-[10px] p-6 max-w-md',
    children: 'Vi hjälper varandra med allt som rör livet som frilansare!',
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
