// Dynamic-import target for LayoutMotion — a file of its own so the
// bundler can put motion's layout + drag features in a chunk that only
// pages using them fetch. Kept to a single default export: importing
// the 'motion/react' barrel dynamically would pull every export into
// the chunk instead.
export { domMax as default } from 'motion/react'
