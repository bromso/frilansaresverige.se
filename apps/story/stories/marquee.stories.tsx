import {
  Marquee,
  MarqueeContent,
  MarqueeFade,
  MarqueeItem,
} from '@frilansaresverige/ui/ui/marquee'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'UI/Marquee',
  component: Marquee,
} satisfies Meta<typeof Marquee>

export default meta
type Story = StoryObj<typeof meta>

const LOGOS = [
  'icon-[simple-icons--spotify]',
  'icon-[simple-icons--klarna]',
  'icon-[simple-icons--ikea]',
  'icon-[simple-icons--volvo]',
]

export const LogoRow: Story = {
  render: () => (
    <div className="w-[32rem]">
      <Marquee>
        <MarqueeContent play speed={40}>
          {LOGOS.map((icon) => (
            <MarqueeItem key={icon} className="mx-8">
              <span
                className={`${icon} size-12 text-brand-cream/60`}
                aria-hidden="true"
              />
            </MarqueeItem>
          ))}
        </MarqueeContent>
        <MarqueeFade side="left" />
        <MarqueeFade side="right" />
      </Marquee>
    </div>
  ),
}
