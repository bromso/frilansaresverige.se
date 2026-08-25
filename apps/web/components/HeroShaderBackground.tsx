import { useTheme } from 'next-themes'
import {
  CursorRipples,
  Engraving,
  MultiPointGradient,
  Shader,
  WaveDistortion,
} from 'shaders/react'

// Gradient point colors per theme: calm ground on the left where the copy
// sits, coral mass on the right, darkest/lightest at the bottom so the
// canvas dissolves into the flat page background.
const DARK_COLORS = {
  colorA: '#8a5cf6',
  colorB: '#4823dc',
  colorC: '#ff9c8e',
  colorD: '#2601bb',
  colorE: '#5b3ae8',
}
const LIGHT_COLORS = {
  colorA: '#ffcfc8',
  colorB: '#fffce3',
  colorC: '#ff9c8e',
  colorD: '#fffce3',
  colorE: '#ffe4d1',
}

// Full-viewport hero background on a single WebGPU canvas, adapted from
// the Shaders "Ripple Bento Grid" hero card: a molten multi-point
// gradient with wave distortion and a faint spiral engraving that
// ripples under the pointer (CursorRipples is fully declarative — no
// event wiring). Recolored from the reference's ember palette to the
// site's brand: calm brand blue on the left where the copy sits, coral
// mass on the right, violet up top and dark blue at the bottom so the
// canvas dissolves into the flat page background. Rendered client-only
// (WebGPU) via next/dynamic — see pages/index.tsx.
const HeroShaderBackground = ({ reduced }: { reduced: boolean }) => {
  const { resolvedTheme } = useTheme()
  const colors = resolvedTheme === 'light' ? LIGHT_COLORS : DARK_COLORS

  return (
    <Shader className="h-full w-full" disableTelemetry>
      <MultiPointGradient
        {...colors}
        colorSpace="oklab"
        positionA={{ x: 0.59, y: -0.05 }}
        positionB={{ x: -0.02, y: 0.23 }}
        positionC={{ x: 1.07, y: 0.52 }}
        positionD={{ x: 0.54, y: 1.05 }}
        positionE={{ x: 0.56, y: 0.43 }}
        smoothness={2.81}
      />
      <WaveDistortion
        angle={232}
        frequency={1.1}
        speed={reduced ? 0 : 1.5}
        strength={0.43}
      />
      <Engraving
        center={{ x: 0.51, y: 1.06 }}
        opacity={0.03}
        relief={2}
        style="spiral"
        waviness={1}
      />
      {!reduced && (
        <CursorRipples
          chromaticSplit={0.1}
          decay={3.6}
          intensity={3.7}
          radius={0.7}
        />
      )}
    </Shader>
  )
}

export default HeroShaderBackground
