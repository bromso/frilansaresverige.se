import { Label } from '@frilansaresverige/ui/ui/label'
import { Textarea } from '@frilansaresverige/ui/ui/textarea'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const WithLabel: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-1.5 rounded-2xl bg-brand-cream p-6">
      <Label htmlFor="beskrivning" className="text-brand-blue">
        Beskrivning av uppdraget
      </Label>
      <Textarea
        id="beskrivning"
        placeholder="Beskriv uppdraget, teamet och behoven…"
        className="min-h-[8em]"
      />
    </div>
  ),
}
