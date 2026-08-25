// Types the gtag() global that _document.tsx bootstraps via its inline
// Google Analytics script (see apps/web/pages/_document.tsx). Declared here
// so pages can safely call `window.gtag?.(...)` for events that gtag's own
// full-page-load config never sees, e.g. client-side-only route changes.
export {}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}
