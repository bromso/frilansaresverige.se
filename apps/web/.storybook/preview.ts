import type { Preview } from '@storybook/nextjs-vite'

import '../styles/globals.css'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'brand',
      values: [{ name: 'brand', value: '#4823dc' }],
    },
  },
}

export default preview
