import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from '@frilansaresverige/ui/animate-ui/components/animate/tabs'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Animate UI/Tabs',
  component: Tabs,
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

const STEPS = [
  { value: 'ett', label: '1. Uppdraget' },
  { value: 'tva', label: '2. Villkor' },
  { value: 'tre', label: '3. Kontakt' },
]

export const Stepper: Story = {
  render: () => (
    <div className="w-[28rem] rounded-[1.25rem] bg-brand-cream p-6 text-brand-blue">
      <Tabs defaultValue="ett" className="gap-6">
        <TabsList>
          {STEPS.map((step) => (
            <TabsTrigger key={step.value} value={step.value}>
              {step.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContents>
          <TabsContent value="ett">
            <p className="p-2">Första stegets innehåll.</p>
          </TabsContent>
          <TabsContent value="tva">
            <p className="p-2">
              Andra steget är lite högre.
              <br />
              Höjden animeras med.
            </p>
          </TabsContent>
          <TabsContent value="tre">
            <p className="p-2">Sista steget.</p>
          </TabsContent>
        </TabsContents>
      </Tabs>
    </div>
  ),
}
