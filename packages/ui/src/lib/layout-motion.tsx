'use client'

import { LazyMotion } from 'motion/react'
import type { ReactNode } from 'react'

// The app-level LazyMotion (web's _app.tsx) loads motion's domAnimation
// feature set synchronously: enough for every animate/exit/gesture
// effect in the repo, at two thirds the size of the full library. The
// few components that animate layout (`layoutId` — the tabs highlight,
// the tooltip that slides between triggers, the section menu's tick)
// need domMax on top. Wrapping them in this provider fetches it on
// demand: LazyMotion features are cumulative and global, so once the
// chunk arrives every `m.*` element on the page can animate layout.
const loadLayoutFeatures = () =>
  import('./motion-features').then((mod) => mod.default)

export const LayoutMotion = ({ children }: { children: ReactNode }) => (
  <LazyMotion features={loadLayoutFeatures}>{children}</LazyMotion>
)
