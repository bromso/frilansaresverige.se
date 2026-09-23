'use client'

import { type HTMLMotionProps, m } from 'motion/react'
import * as React from 'react'

import { Slot, type WithAsChild } from '../animate/slot'

type ButtonProps = WithAsChild<
  HTMLMotionProps<'button'> & {
    hoverScale?: number
    tapScale?: number
  }
>

function Button({
  hoverScale = 1.05,
  tapScale = 0.95,
  asChild = false,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : m.button

  return (
    <Component
      whileTap={{ scale: tapScale }}
      whileHover={{ scale: hoverScale }}
      {...props}
    />
  )
}

export { Button, type ButtonProps }
