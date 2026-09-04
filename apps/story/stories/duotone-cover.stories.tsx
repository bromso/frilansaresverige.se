import { DuotoneCover } from '@frilansaresverige/ui/ui/duotone-cover'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'UI/DuotoneCover',
  component: DuotoneCover,
  args: { seed: 'exempel-artikel' },
  decorators: [
    (Story) => (
      <div className="aspect-video w-96 overflow-hidden rounded-3xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DuotoneCover>

export default meta
type Story = StoryObj<typeof meta>

export const GradientOnly: Story = {}

export const WithPhoto: Story = {
  args: {
    image:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=60',
  },
}

export const SeedVariety: Story = {
  render: (args) => (
    <div className="grid grid-cols-3 gap-3">
      {['ett', 'tva', 'tre', 'fyra', 'fem', 'sex'].map((seed) => (
        <div
          key={seed}
          className="aspect-video w-40 overflow-hidden rounded-xl"
        >
          <DuotoneCover {...args} seed={seed} />
        </div>
      ))}
    </div>
  ),
}
