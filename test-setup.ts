import { GlobalRegistrator } from '@happy-dom/global-registrator'

GlobalRegistrator.register()

// @testing-library/jest-dom's type declarations are side-effect-only (no
// exports), so TS can't type a dynamic import() of it as a module.
// @ts-expect-error TS2306: File is not a module
await import('@testing-library/jest-dom')
