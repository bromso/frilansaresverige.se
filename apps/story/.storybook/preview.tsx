import type { Preview } from '@storybook/react-vite'
import { domAnimation, LazyMotion } from 'motion/react'

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
  // _app.tsx, so stories need the same wrapper to move. Same feature set
  // as the app (domAnimation, with layout features loaded on demand via
  // LayoutMotion): with domMax here a component missing its LayoutMotion
  // wrapper would animate in Storybook and silently not in the site.
  decorators: [
    (Story) => (
      <LazyMotion features={domAnimation} strict>
        <Story />
      </LazyMotion>
    ),
  ],
}

export default preview
