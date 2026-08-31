import { type RefObject, useEffect, useRef, useState } from 'react'

// Tracks whether an element is within (or near) the viewport, so
// continuously-animating decorations — marquees and the like — can pause
// while offscreen instead of burning frames the visitor never sees.
// Unlike BentoCardShader's mount-once gate this keeps observing, so the
// animation pauses again when the section scrolls back out.
export function useNearViewport<T extends HTMLElement>(
  rootMargin = '25% 0px',
): { ref: RefObject<T | null>; near: boolean } {
  const ref = useRef<T>(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) {
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        setNear(entries.some((entry) => entry.isIntersecting))
      },
      { rootMargin },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [rootMargin])

  return { ref, near }
}
