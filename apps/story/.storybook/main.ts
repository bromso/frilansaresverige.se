import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  // The ui package is linked workspace source, so Vite discovers its
  // dependencies lazily — and react-fast-marquee is CJS-only (bare
  // `main`, no `exports`). Without pre-bundling, the default import
  // arrives as a module object and React throws "Element type is
  // invalid … got: object". Forcing it through optimizeDeps gives it
  // esbuild's CJS→ESM default interop up front.
  viteFinal: (viteConfig) => {
    viteConfig.optimizeDeps = {
      ...viteConfig.optimizeDeps,
      include: [
        ...(viteConfig.optimizeDeps?.include ?? []),
        'react-fast-marquee',
      ],
    }
    return viteConfig
  },
}

export default config
