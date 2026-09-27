import type { Meta, StoryObj } from '@storybook/react-vite'
import AssignmentPreview, {
  type AssignmentView,
} from '../../web/components/AssignmentPreview'

const meta = {
  title: 'Web/AssignmentPreview',
  component: AssignmentPreview,
} satisfies Meta<typeof AssignmentPreview>

export default meta
type Story = StoryObj<typeof meta>

const broker: AssignmentView = {
  title: 'Senior frontendutvecklare till betalplattform',
  description:
    'Du bygger vidare på vår checkout i React och TypeScript tillsammans med ett team på fem. Start i oktober, sex månader med möjlighet till förlängning.',
  customerName: 'Acme AB',
  location: 'Göteborg',
  scope: 'Heltid',
  workForm: 'Distans, Hybrid',
  contact: 'Kim Lindqvist\n070-123 45 67\nkim@acme.se',
  senderType: 'BROKER',
  clientHourlyRate: '950',
  customerFee: '10 %',
  customerOrganizationNumber: '556677-8899',
  deleted: false,
}

export const Broker: Story = {
  args: {
    assignment: broker,
    comments: [
      { id: 1, comment: 'Start flyttad till november.', created: 1758542400 },
    ],
  },
}

export const Direct: Story = {
  args: {
    assignment: {
      ...broker,
      senderType: 'DIRECT',
      customerFee: null,
      customerOrganizationNumber: null,
      clientHourlyRate: null,
    },
  },
}

export const Deleted: Story = {
  args: {
    assignment: { ...broker, deleted: true },
  },
}
