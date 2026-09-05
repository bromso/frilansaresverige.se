'use client'

import { AnimatePresence, m } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useNearViewport } from '../lib/use-near-viewport'

// A self-cycling stacked-notification mock (after Emil Kowalski's
// stacked-toasts pattern): messages drop in on a timer and older ones
// recede behind the newest — offset, scaled and dimmed. Purely
// decorative: aria-hidden, cycling only while on screen, and a single
// static row under reduced motion.
//
// Backdrop-filter constraint: nothing in the stack ever holds an
// opacity below 1 — an ancestor opacity < 1 isolates backdrop-filter's
// sampling group and the glass blur cuts out. Entry slides in at full
// opacity behind the container's clipping edge, and depth is faded by
// a tint overlay drawn ON TOP of each row, which can animate freely.
export interface NotificationMessage {
  /** Iconify class, e.g. "icon-[lucide--briefcase-business]" */
  icon: string
  title: string
  body: string
}

const MAX_VISIBLE = 3
const STACK_OFFSET_Y = 10
const STACK_SCALE = 0.06
const STACK_OPACITY = 0.35

const NotificationRow = ({ icon, title, body }: NotificationMessage) => (
  <div className="flex items-center gap-3 rounded-2xl bg-white/45 p-3 shadow-[inset_0_0_0_1px_rgba(51,51,51,0.15)] backdrop-blur-sm">
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-blue-dark"
    >
      <span className={`${icon} size-4 text-[#fffce3]`} />
    </span>
    <span className="min-w-0 text-brand-grey">
      <span className="block truncate text-sm font-medium">{title}</span>
      <span className="block truncate font-mono text-xs text-brand-grey/60">
        {body}
      </span>
    </span>
  </div>
)

export const NotificationStack = ({
  messages,
  reduced,
  intervalMs = 2600,
}: {
  messages: NotificationMessage[]
  reduced: boolean
  intervalMs?: number
}) => {
  const { ref, near } = useNearViewport<HTMLDivElement>()
  const [toasts, setToasts] = useState<number[]>([0])
  const nextId = useRef(0)

  useEffect(() => {
    if (reduced || !near) {
      return
    }
    const timer = setInterval(() => {
      setToasts((prev) => [++nextId.current, ...prev].slice(0, MAX_VISIBLE))
    }, intervalMs)
    return () => clearInterval(timer)
  }, [reduced, near, intervalMs])

  if (reduced) {
    return <NotificationRow {...messages[0]} />
  }

  return (
    <div ref={ref} aria-hidden="true" className="relative h-24 overflow-hidden">
      <AnimatePresence initial={false}>
        {toasts.map((id, index) => {
          const message = messages[id % messages.length]
          return (
            <m.div
              key={id}
              className="absolute inset-x-0 bottom-0 origin-bottom will-change-transform"
              style={{ zIndex: MAX_VISIBLE - index }}
              initial={{ y: 72, scale: 0.95 }}
              animate={{
                y: -index * STACK_OFFSET_Y,
                scale: 1 - index * STACK_SCALE,
              }}
              exit={{
                opacity: 0,
                scale: 0.85,
                y: -MAX_VISIBLE * STACK_OFFSET_Y - 8,
                transition: { duration: 0.2, ease: 'easeIn' },
              }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 30,
                delay: index * 0.02,
              }}
            >
              <NotificationRow {...message} />
              <m.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-2xl bg-[#ffe4df]"
                initial={false}
                animate={{ opacity: index * STACK_OPACITY }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            </m.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
