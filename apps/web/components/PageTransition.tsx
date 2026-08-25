import gsap from 'gsap'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import Router from 'next/router'
import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'

// Scribble page transition: on navigation a hand-drawn coral line sweeps
// across the screen, its stroke fattening until it covers the page, then
// retracts to reveal the new one. The Pages Router can't hold navigation
// back the way next-transition-router does in the App Router, so the
// leave timeline plays while the next page loads underneath and the
// enter timeline waits for the leave to finish before retracting. Under
// reduced motion no listeners are attached and navigation is instant.
const PageTransition = ({ children }: { children: ReactNode }) => {
  const overlayRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    gsap.registerPlugin(DrawSVGPlugin)

    const overlay = overlayRef.current
    const path = pathRef.current
    if (!overlay || !path) {
      return
    }

    gsap.set(path, { drawSVG: '0%', strokeWidth: 2 })

    let leaveTl: gsap.core.Timeline | null = null
    let enterTl: gsap.core.Timeline | null = null

    const reset = () => {
      leaveTl?.kill()
      enterTl?.kill()
      leaveTl = null
      enterTl = null
      gsap.set(overlay, { opacity: 0 })
      gsap.set(path, { drawSVG: '0%', strokeWidth: 2 })
    }

    const onStart = (_url: string, { shallow }: { shallow: boolean }) => {
      if (shallow) {
        return
      }
      reset()
      leaveTl = gsap
        .timeline()
        .to(overlay, { opacity: 1, duration: 0.4, ease: 'power2.inOut' })
        .to(
          path,
          {
            drawSVG: '100%',
            strokeWidth: 300,
            duration: 1,
            ease: 'power2.inOut',
          },
          0,
        )
    }

    const playEnter = () => {
      enterTl = gsap
        .timeline()
        .to(path, {
          drawSVG: '100% 100%',
          strokeWidth: 2,
          duration: 1,
          ease: 'power2.inOut',
        })
        .to(overlay, { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, 0.6)
        .set(path, { drawSVG: '0%', strokeWidth: 2 })
    }

    const onComplete = () => {
      if (leaveTl?.isActive()) {
        leaveTl.eventCallback('onComplete', playEnter)
      } else if (leaveTl) {
        playEnter()
      }
    }

    // The Router singleton's events, not useRouter()'s — the hook returns
    // a fresh object identity per navigation, and an effect keyed on it
    // would tear down (and kill the running timelines) mid-transition.
    Router.events.on('routeChangeStart', onStart)
    Router.events.on('routeChangeComplete', onComplete)
    Router.events.on('routeChangeError', reset)

    return () => {
      Router.events.off('routeChangeStart', onStart)
      Router.events.off('routeChangeComplete', onComplete)
      Router.events.off('routeChangeError', reset)
      reset()
    }
  }, [])

  return (
    <>
      <div
        ref={overlayRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[999] flex items-center justify-center opacity-0"
      >
        <svg
          aria-hidden="true"
          width="100%"
          height="100%"
          viewBox="0 0 1316 664"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full scale-130"
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            ref={pathRef}
            d="M13.4746 291.27C13.4746 291.27 100.646 -18.6724 255.617 16.8418C410.588 52.356 61.0296 431.197 233.017 546.326C431.659 679.299 444.494 21.0125 652.73 100.784C860.967 180.556 468.663 430.709 617.216 546.326C765.769 661.944 819.097 48.2722 988.501 120.156C1174.21 198.957 809.424 543.841 988.501 636.726C1189.37 740.915 1301.67 149.213 1301.67 149.213"
            stroke="var(--color-brand-coral)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {children}
    </>
  )
}

export default PageTransition
