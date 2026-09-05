import type { Preview } from '@storybook/react-vite'
import { domMax, LazyMotion } from 'motion/react'

import '../styles/storybook.css'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'brand',
      values: [{ name: 'brand', value: '#4823dc' }],
    },
  },
  // The ui package animates with motion's `m.*` components, which only
  // animate inside a LazyMotion provider — the web app mounts one in
  // _app.tsx, so stories need the same wrapper to move.
  decorators: [
    (Story) => (
      <LazyMotion features={domMax} strict>
        <Story />
      </LazyMotion>
    ),
  ],
}

export default preview
