import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Button } from './button'

const meta = {
  title: 'UI/Button',
  component: Button,
  args: { children: 'Ansök om medlemskap' },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: { variant: 'primary', size: 'none' },
}

export const Default: Story = {}
