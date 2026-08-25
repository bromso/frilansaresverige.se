import { Input } from '@frilansaresverige/ui/ui/input'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'UI/Input',
  component: Input,
  args: { placeholder: 'Namn', type: 'text' },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
