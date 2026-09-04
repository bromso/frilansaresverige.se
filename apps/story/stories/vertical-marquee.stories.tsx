import { VerticalMarquee } from '@frilansaresverige/ui/ui/vertical-marquee'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'UI/VerticalMarquee',
  component: VerticalMarquee,
  args: { pauseOnHover: true, play: true },
} satisfies Meta<typeof VerticalMarquee>

export default meta
type Story = StoryObj<typeof meta>

const Card = ({ text }: { text: string }) => (
  <div className="w-56 rounded-2xl bg-brand-cream/5 p-4 leading-snug text-brand-cream/85">
    {text}
  </div>
)

export const Testimonials: Story = {
  render: (args) => (
    <div className="h-80 overflow-hidden">
      <VerticalMarquee {...args} className="h-full [--duration:20s]">
        <Card text="Fick mitt första uppdrag via communityt inom en vecka." />
        <Card text="Bästa stället att bolla prissättning med kollegor." />
        <Card text="AW:erna gör frilanslivet mycket mindre ensamt." />
      </VerticalMarquee>
    </div>
  ),
}

export const Paused: Story = {
  args: { play: false },
  render: (args) => (
    <div className="h-80 overflow-hidden">
      <VerticalMarquee {...args} className="h-full [--duration:20s]">
        <Card text="play={false} pausar rullningen, t.ex. utanför viewporten." />
        <Card text="Samma kort, stillastående." />
      </VerticalMarquee>
    </div>
  ),
}
