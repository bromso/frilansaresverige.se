import { NotificationStack } from '@frilansaresverige/ui/ui/notification-stack'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'UI/NotificationStack',
  component: NotificationStack,
  args: {
    reduced: false,
    messages: [
      {
        icon: 'icon-[lucide--briefcase-business]',
        title: 'Nytt uppdragstips — Frontendutvecklare',
        body: 'direktkontakt · 950 kr/h · #uppdrag',
      },
      {
        icon: 'icon-[lucide--pen-tool]',
        title: 'Nytt uppdragstips — UX-designer',
        body: 'distans · 900 kr/h · #uppdrag',
      },
      {
        icon: 'icon-[lucide--camera]',
        title: 'Nytt uppdragstips — Fotograf',
        body: 'Stockholm · 7 500 kr/dag · #uppdrag',
      },
    ],
  },
  decorators: [
    // The stack's glass rows sample their backdrop — give them the warm
    // card wash they sit on in the konsult bento.
    (Story) => (
      <div
        className="w-96 rounded-3xl p-8"
        style={{
          background:
            'linear-gradient(to bottom right, #ffcfc8, #ff9c8e 55%, #fe7c74)',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NotificationStack>

export default meta
type Story = StoryObj<typeof meta>

export const Cycling: Story = {}

export const ReducedMotion: Story = {
  args: { reduced: true },
}
