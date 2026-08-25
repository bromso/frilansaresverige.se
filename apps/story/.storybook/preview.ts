import type { Preview } from '@storybook/react-vite'

import '../styles/storybook.css'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'brand',
      values: [{ name: 'brand', value: '#4823dc' }],
    },
  },
}

export default preview
