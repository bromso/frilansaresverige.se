import { FilterChip } from '@frilansaresverige/ui/ui/filter-chip'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

const meta = {
  title: 'UI/FilterChip',
  component: FilterChip,
} satisfies Meta<typeof FilterChip>

export default meta
type Story = StoryObj<typeof meta>

const CATEGORIES = ['Alla', 'Utveckling', 'Design', 'Innehåll']

const ChipRow = () => {
  const [active, setActive] = useState('Alla')
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((category) => (
        <FilterChip
          key={category}
          active={active === category}
          onClick={() => setActive(category)}
        >
          {category}
        </FilterChip>
      ))}
    </div>
  )
}

export const ChipGroup: Story = {
  args: { active: true, onClick: () => {}, children: 'Alla' },
  render: () => <ChipRow />,
}
