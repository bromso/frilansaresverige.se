import { MegaNav } from '@frilansaresverige/ui/ui/mega-nav'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'UI/MegaNav',
  component: MegaNav,
  parameters: { layout: 'fullscreen' },
  args: {
    items: [
      {
        label: 'Frilansare',
        href: '#frilansare',
        sections: [
          {
            title: 'För frilansare',
            large: true,
            links: [
              { label: 'Bli medlem', href: '#medlem' },
              { label: 'Så fungerar det', href: '#fungerar' },
              { label: 'Frågor och svar', href: '#faq' },
            ],
          },
          {
            title: 'Genvägar',
            links: [
              { label: 'Tipsa om uppdrag', href: '#tipsa' },
              { label: 'Kontakt', href: '#kontakt' },
            ],
          },
        ],
      },
      { label: 'Uppdrag', href: '#uppdrag' },
      {
        label: 'Community',
        href: '#community',
        sections: [
          {
            title: 'Community',
            large: true,
            links: [
              { label: 'Nyheter', href: '#nyheter' },
              { label: 'Event', href: '#event' },
              { label: 'Om oss', href: '#om' },
            ],
          },
        ],
      },
    ],
    logo: <span className="font-display font-bold text-brand-cream">Logo</span>,
    actions: <span className="text-sm text-brand-cream/70">🌙</span>,
  },
} satisfies Meta<typeof MegaNav>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <div className="min-h-96">
      <MegaNav {...args} />
      <p className="p-8 text-brand-cream/70">
        Hovra över en flik för att öppna megamenyn.
      </p>
    </div>
  ),
}
