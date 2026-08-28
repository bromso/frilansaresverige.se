import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

// Chat-conversation illustration for the konsult hero card (equivalent
// of Aceternity's chat-conversation, built natively): a looping Slack
// exchange where a company posts a gig and a freelancer answers.
// Messages spring in one by one, hold, then the thread resets. Under
// reduced motion the whole conversation renders statically.
const MESSAGES = [
  {
    id: 'gig',
    initials: 'AB',
    name: 'Acme AB',
    meta: '#uppdrag',
    text: 'Vi söker en frontendutvecklare till vår betalplattform — remote, 950 kr/h.',
    align: 'left',
  },
  {
    id: 'reply',
    initials: 'SL',
    name: 'Sara L.',
    meta: 'UX-designer',
    text: 'Intresserad! Skickar portfolio i DM.',
    align: 'right',
  },
  {
    id: 'close',
    initials: 'AB',
    name: 'Acme AB',
    meta: '#uppdrag',
    text: 'Perfekt — kan vi höras imorgon?',
    align: 'left',
  },
] as const

const STEP_MS = 1600

const KonsultChat = ({ reduced }: { reduced: boolean }) => {
  const [count, setCount] = useState(reduced ? MESSAGES.length : 0)

  useEffect(() => {
    if (reduced) {
      setCount(MESSAGES.length)
      return
    }
    const timer = setInterval(() => {
      // Hold the full thread for one extra beat before starting over.
      setCount((current) => (current > MESSAGES.length ? 0 : current + 1))
    }, STEP_MS)
    return () => clearInterval(timer)
  }, [reduced])

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence>
        {MESSAGES.slice(0, count).map((message) => (
          <motion.div
            key={message.id}
            initial={reduced ? false : { opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className={`flex w-fit max-w-[17rem] items-start gap-2.5 rounded-2xl bg-white/10 p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)] backdrop-blur-sm ${
              message.align === 'right' ? 'self-end' : 'self-start'
            }`}
          >
            <span
              aria-hidden="true"
              className="font-display flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-coral text-xs font-bold text-brand-grey"
            >
              {message.initials}
            </span>
            <span className="min-w-0 text-[#fffce3]">
              <span className="flex items-baseline gap-2">
                <span className="text-xs font-bold">{message.name}</span>
                <span className="font-mono text-[0.65rem] text-[#fffce3]/50">
                  {message.meta}
                </span>
              </span>
              <span className="mt-0.5 block text-xs leading-[1.5] text-[#fffce3]/85">
                {message.text}
              </span>
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default KonsultChat
