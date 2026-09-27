import { Button } from '@frilansaresverige/ui/animate-ui/components/buttons/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@frilansaresverige/ui/ui/alert-dialog'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'UI/AlertDialog',
  component: AlertDialog,
} satisfies Meta<typeof AlertDialog>

export default meta
type Story = StoryObj<typeof meta>

// The confirmation the manage page shows before withdrawing a listing.
export const Confirm: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="primary-outline" size="none">
          Ta bort uppdraget
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-brand-cream text-brand-blue">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-xl font-extrabold">
            Ta bort uppdraget?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-brand-blue/80">
            Uppdraget slutar visas och meddelandena i Slack skrivs över. Det går
            inte att ångra.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button type="button" variant="primary-outline" size="none">
              Avbryt
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button type="button" variant="primary" size="none">
              Ta bort
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
}
