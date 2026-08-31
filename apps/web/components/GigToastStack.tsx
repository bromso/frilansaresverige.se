import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useNearViewport } from '../hooks/useNearViewport'

// The "Utan mellanhänder" bento card's notification mock, as a living
// stack: fictional gig tips drop in on a timer and older ones recede
// behind the newest — offset, scaled and faded like a toast stack (after
// Emil Kowalski's stacked-notifications pattern). Purely decorative:
// aria-hidden, self-cycling only while the card is on screen, and a
// single static notification under reduced motion.
const MESSAGES = [
  {
    icon: 'icon-[lucide--briefcase-business]',
    title: 'Nytt uppdragstips — Frontendutvecklare',
    body: 'direktkontakt · 950 kr/h · #uppdrag',
  },
  {
    icon: 'icon-[lucide--pen-tool]',
    title: 'Nytt uppdragstips — UX-designer',
    body: 'distans · 900 kr/h · #uppdrag',
  },
  {
    icon: 'icon-[lucide--text]',
    title: 'Nytt uppdragstips — Teknisk skribent',
    body: 'direktkontakt · 780 kr/h · #uppdrag',
  },
  {
    icon: 'icon-[lucide--chart-line]',
    title: 'Nytt uppdragstips — Projektledare',
    body: 'hybrid · 880 kr/h · #uppdrag',
  },
  {
    icon: 'icon-[lucide--camera]',
    title: 'Nytt uppdragstips — Fotograf',
    body: 'Stockholm · 7 500 kr/dag · #uppdrag',
  },
]

const MAX_VISIBLE = 3
const INTERVAL_MS = 2600
const STACK_OFFSET_Y = 10
const STACK_SCALE = 0.06
const STACK_OPACITY = 0.3

const NotificationRow = ({
  icon,
  title,
  body,
}: {
  icon: string
  title: string
  body: string
}) => (
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

const GigToastStack = ({ reduced }: { reduced: boolean }) => {
  const { ref, near } = useNearViewport<HTMLDivElement>()
  const [toasts, setToasts] = useState<number[]>([0])
  const nextId = useRef(0)

  useEffect(() => {
    if (reduced || !near) {
      return
    }
    const timer = setInterval(() => {
      setToasts((prev) => [++nextId.current, ...prev].slice(0, MAX_VISIBLE + 1))
    }, INTERVAL_MS)
    return () => clearInterval(timer)
  }, [reduced, near])

  if (reduced) {
    return <NotificationRow {...MESSAGES[0]} />
  }

  return (
    // overflow-hidden lets the entering toast slide up from behind the
    // container edge at full opacity — animating an ancestor's opacity
    // would isolate the backdrop-filter's sampling group, so the glass
    // blur wouldn't apply until the fade finished (it popped in late).
    // Only the receding back toasts fade, where the artifact can't show.
    <div ref={ref} aria-hidden="true" className="relative h-24 overflow-hidden">
      <AnimatePresence initial={false}>
        {toasts.map((id, index) => {
          const message = MESSAGES[id % MESSAGES.length]
          const inStack = index < MAX_VISIBLE
          return (
            <motion.div
              key={id}
              className="absolute inset-x-0 bottom-0 origin-bottom will-change-transform"
              style={{ zIndex: MAX_VISIBLE - index }}
              initial={{ y: 72, scale: 0.95 }}
              animate={{
                opacity: inStack ? 1 - index * STACK_OPACITY : 0,
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
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export default GigToastStack
