import { type ReactNode, useEffect, useRef, useState } from 'react'
import {
  Blob,
  ContourLines,
  CursorTrail,
  FilmGrain,
  Glass,
  LightLeak,
  LinearGradient,
  Liquify,
  Plasma,
  ProgressiveBlur,
  Shader,
} from 'shaders/react'

// Liquid-glass card backgrounds for the "Vad du får" bento, adapted from
// the Shaders "Liquid Glass Carousel" reference: an OKLab gradient wash,
// film grain, a colored light leak, a cursor-reactive trail and a
// refractive 3D glass solid per card — recolored to the site's palette.
// Each card gets its own <Shader> canvas; the five glass shapes (torus,
// diamond, metaballs, ribbon, hemisphere) come straight from the
// reference, including the auto-animate rotation drivers, which are
// replaced with static angles under reduced motion.
//
// The "Hitta rätt konsult" cards (ember1–ember5) instead use the Shaders
// "Drifting Contours 5" preset: a coral/pink plasma wash with purple
// topographic contour lines traced around an animated blob, warped by a
// cursor-reactive Liquify. Each card varies the blob seed and anchor so
// no two cards match.

export type BentoShaderVariant =
  | 'torus'
  | 'diamond'
  | 'metaballs'
  | 'ribbon'
  | 'hemisphere'
  | 'ember1'
  | 'ember2'
  | 'ember3'
  | 'ember4'
  | 'ember5'

const SPIN = {
  type: 'auto-animate',
  mode: 'loop',
  outputMin: -180,
  outputMax: 180,
  speed: 0.08,
  easing: 'linear',
} as const

interface GlassVariantConfig {
  contours?: undefined
  grad: [string, string, string]
  leak: {
    fringe: string
    hot: string
    mid: string
    pos: { x: number; y: number }
  }
  trail: [string, string]
  glass: {
    center: { x: number; y: number }
    scale: number
    shapeType: string
    fresnel?: number
    shape: (reduced: boolean) => Record<string, unknown>
  }
}

interface ContourVariantConfig {
  contours: {
    seed: number
    blobCenter: { x: number; y: number }
  }
}

type VariantConfig = GlassVariantConfig | ContourVariantConfig

const VARIANTS: Record<BentoShaderVariant, VariantConfig> = {
  torus: {
    grad: ['#a8b4ff', '#4823dc', '#16045e'],
    leak: {
      fringe: '#ff9c8e',
      hot: '#ffcfc8',
      mid: '#4823dc',
      pos: { x: 0.16, y: 0.92 },
    },
    trail: ['#a8b0ff', '#ff9c8e'],
    glass: {
      center: { x: 0.5, y: 0.32 },
      scale: 1.3075,
      shapeType: 'torus3D',
      shape: (reduced) => ({
        type: 'torus3D',
        radius: 0.295,
        tube: 0.11,
        rotX: -49,
        rotY: reduced ? 40 : SPIN,
        rotZ: 30.3,
      }),
    },
  },
  diamond: {
    grad: ['#ffcfc8', '#8a5cf6', '#2601bb'],
    leak: {
      fringe: '#ff9c8e',
      hot: '#ffcfc8',
      mid: '#8a5cf6',
      pos: { x: 1.14, y: -0.01 },
    },
    trail: ['#ff9c8e', '#8a5cf6'],
    glass: {
      center: { x: 0.45, y: 0.38 },
      scale: 1.1885,
      shapeType: 'diamond3D',
      fresnel: 0.39,
      shape: (reduced) => ({
        type: 'diamond3D',
        radius: 0.3,
        height: 0.46,
        rotX: reduced ? 25 : SPIN,
        rotY: reduced ? -30 : SPIN,
        rotZ: -13.2,
      }),
    },
  },
  metaballs: {
    grad: ['#2601bb', '#4823dc', '#ff9c8e'],
    leak: {
      fringe: '#ff9c8e',
      hot: '#ffcfc8',
      mid: '#4823dc',
      pos: { x: 0.14, y: 0.12 },
    },
    trail: ['#ffcfc8', '#ff9c8e'],
    glass: {
      center: { x: 0.5, y: 0.33 },
      scale: 1.1885,
      shapeType: 'metaballs3D',
      fresnel: 0.39,
      shape: (reduced) => ({
        type: 'metaballs3D',
        ballRadius: 0.155,
        spread: 0.265,
        blend: 0.235,
        speed: reduced ? 0 : 0.4,
        rotX: 35,
        rotY: 0,
        rotZ: 0,
      }),
    },
  },
  ribbon: {
    grad: ['#ff9c8e', '#ffcfc8', '#8a5cf6'],
    leak: {
      fringe: '#ff9c8e',
      hot: '#fffce3',
      mid: '#8a5cf6',
      pos: { x: 1.05, y: 0.84 },
    },
    trail: ['#fffce3', '#ff9c8e'],
    glass: {
      center: { x: 0.5, y: 0.33 },
      scale: 1.1885,
      shapeType: 'ribbon3D',
      fresnel: 0.39,
      shape: (reduced) => ({
        type: 'ribbon3D',
        width: 0.15,
        thickness: 0.062,
        length: 0.545,
        wave: 0.1,
        waveFrequency: 7,
        twist: 140,
        speed: reduced ? 0 : 0.4,
        rotX: reduced ? 60 : SPIN,
        rotY: 14.9,
        rotZ: -29.7,
      }),
    },
  },
  hemisphere: {
    grad: ['#16045e', '#4823dc', '#ff9c8e'],
    leak: {
      fringe: '#ff9c8e',
      hot: '#ffcfc8',
      mid: '#8a5cf6',
      pos: { x: 1.5, y: 0.62 },
    },
    trail: ['#8a5cf6', '#ff9c8e'],
    glass: {
      center: { x: 0.5, y: 0.28 },
      scale: 0.9813,
      shapeType: 'hemisphere3D',
      fresnel: 0.39,
      shape: (reduced) => ({
        type: 'hemisphere3D',
        radius: 0.4,
        cut: 0,
        rotX: 30,
        rotY: 46,
        rotZ: reduced ? -20 : SPIN,
      }),
    },
  },
  ember1: {
    contours: { seed: 42, blobCenter: { x: 0.52, y: 1 } },
  },
  ember2: {
    contours: { seed: 7, blobCenter: { x: 0.3, y: 0.95 } },
  },
  ember3: {
    contours: { seed: 18, blobCenter: { x: 0.62, y: 1.05 } },
  },
  ember4: {
    contours: { seed: 63, blobCenter: { x: 0.44, y: 0.9 } },
  },
  ember5: {
    contours: { seed: 29, blobCenter: { x: 0.56, y: 1 } },
  },
}

// Defers mounting its children (a <Shader> canvas) until the card has
// scrolled within a viewport of the screen, then keeps them mounted. All
// bento cards sit below the fold, so without this every WebGPU canvas
// initializes during page load and Lighthouse bills it all as main-thread
// work; the static gradient wash behind each card covers the gap.
const MountNearViewport = ({ children }: { children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || near) {
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true)
          observer.disconnect()
        }
      },
      { rootMargin: '100% 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [near])

  return (
    <div ref={ref} className="h-full w-full">
      {near && children}
    </div>
  )
}

const BentoCardShader = ({
  variant,
  reduced,
  showGlass = true,
}: {
  variant: BentoShaderVariant
  reduced: boolean
  // The "Hitta rätt konsult" cards reuse these compositions without the
  // refractive 3D solid.
  showGlass?: boolean
}) => {
  const config = VARIANTS[variant]

  if (config.contours) {
    // "Drifting Contours 5" preset (Shaders collection "Drifting
    // Contours"), with a particle layer on top. The particles sit after
    // Liquify so the cursor warps the contours but the motes stay crisp.
    return (
      <MountNearViewport>
        <Shader
          className="h-full w-full"
          toneMapping="neutral"
          disableTelemetry
        >
          <Plasma
            balance={40}
            colorA="#ed5fbc"
            colorB="#fe7c74"
            density={0.9}
            speed={reduced ? 0 : 2}
            warp={0.3}
          />
          <ContourLines
            gamma={0.1}
            levels={30}
            lineColor="#ff4a4a"
            lineWidth={1.5}
            source="alpha"
          >
            <Blob
              center={config.contours.blobCenter}
              colorA="#730db1"
              colorB="#cf62dc"
              deformation={0.7}
              highlightColor="#fbffb3"
              highlightIntensity={1}
              highlightX={-0.5}
              highlightY={-0.6}
              highlightZ={-0.1}
              seed={config.contours.seed}
              size={0.7}
              softness={1}
              speed={reduced ? 0 : 0.2}
            />
          </ContourLines>
          {/* The preset exports Liquify for a newer API (decay/intensity/
            radius); translated here to the installed 3.1.x props. */}
          {!reduced && <Liquify damping={1.5} intensity={8} radius={1.2} />}
          {/* Legibility scrim rising from the bottom edge to ~65% of the
            card: the contour work blurs progressively toward the bottom
            and a near-opaque coral gradient covers it, hiding the shader
            behind the card copy so the text stays readable. The top of
            the card stays fully crisp. (ProgressiveBlur grows along
            +angle from `center`, whose y is measured from the bottom:
            angle 90 + center y 0.65 = blur from 35% down.) */}
          <ProgressiveBlur
            angle={90}
            center={{ x: 0.5, y: 0.65 }}
            falloff={0.4}
            intensity={50}
          />
          <LinearGradient
            start={{ x: 0.5, y: 0.35 }}
            end={{ x: 0.5, y: 1 }}
            stops={[
              { color: '#fe7c7400', position: 0 },
              { color: '#fe7c74e6', position: 0.4 },
              { color: '#ff9c8e', position: 1 },
            ]}
          />
        </Shader>
      </MountNearViewport>
    )
  }

  const glass = showGlass ? config.glass : undefined

  return (
    <MountNearViewport>
      <Shader className="h-full w-full" toneMapping="neutral" disableTelemetry>
        <LinearGradient
          colorSpace="oklab"
          start={{ x: 0.11, y: 0.03 }}
          end={{ x: 0.99, y: 0.96 }}
          stops={[
            { color: config.grad[0], position: 0 },
            { color: config.grad[1], position: 0.6038 },
            { color: config.grad[2], position: 1 },
          ]}
        />
        <FilmGrain strength={0.025} />
        <LightLeak
          colorFringe={config.leak.fringe}
          colorHot={config.leak.hot}
          colorMid={config.leak.mid}
          intensity={0.21}
          position={config.leak.pos}
          spread={0.73}
        />
        {!reduced && (
          <CursorTrail
            stops={[
              { color: config.trail[0], position: 0 },
              { color: config.trail[1], position: 1 },
            ]}
          />
        )}
        {glass && (
          <Glass
            aberration={0.61}
            blur={20}
            center={glass.center}
            edgeSoftness={0.45}
            {...(glass.fresnel !== undefined
              ? { fresnel: glass.fresnel, fresnelSoftness: 0.4 }
              : {})}
            highlight={0.37}
            highlightSoftness={0.68}
            innerZoom={3}
            lightAngle={284}
            refraction={2}
            scale={glass.scale}
            shapeType={glass.shapeType}
            shape={JSON.stringify(glass.shape(reduced))}
            thickness={0.97}
          />
        )}
      </Shader>
    </MountNearViewport>
  )
}

export default BentoCardShader
