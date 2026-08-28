import {
  CursorRipples,
  Engraving,
  MultiPointGradient,
  Shader,
  WaveDistortion,
} from 'shaders/react'

// Hero canvas for the "Hitta rätt konsult" bento, adapted from the
// Shaders "Ripple Bento Grid" section reference: a molten multi-point
// gradient with wave distortion and a faint spiral engraving that
// ripples under the pointer via the declarative CursorRipples layer (no
// event wiring — the component tracks the cursor itself). Recolored
// from the reference's ember oranges to the same palette as the "Vad du
// får" glass cards (periwinkle/brand blue/deep navy with coral light
// leaks); all other props match the reference. Under reduced motion the
// wave stops and the pointer ripples are dropped.
const KonsultRippleShader = ({ reduced }: { reduced: boolean }) => (
  <Shader className="h-full w-full" toneMapping="neutral" disableTelemetry>
    <MultiPointGradient
      colorA="#a8b4ff"
      colorB="#8a5cf6"
      colorC="#ffcfc8"
      colorD="#ff9c8e"
      colorE="#4823dc"
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

export default KonsultRippleShader
