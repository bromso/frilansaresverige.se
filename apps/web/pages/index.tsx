import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@frilansaresverige/ui/animate-ui/components/animate/tooltip'
import { Button } from '@frilansaresverige/ui/animate-ui/components/buttons/button'
import { Fade } from '@frilansaresverige/ui/animate-ui/primitives/effects/fade'
import { Slide } from '@frilansaresverige/ui/animate-ui/primitives/effects/slide'
import { HighlightText } from '@frilansaresverige/ui/animate-ui/primitives/texts/highlight'
import {
  RotatingText,
  RotatingTextContainer,
} from '@frilansaresverige/ui/animate-ui/primitives/texts/rotating'
import { SlidingNumber } from '@frilansaresverige/ui/animate-ui/primitives/texts/sliding-number'
import { useReducedMotion } from '@frilansaresverige/ui/lib/use-reduced-motion'
import {
  Marquee,
  MarqueeContent,
  MarqueeFade,
  MarqueeItem,
} from '@frilansaresverige/ui/ui/marquee'
import { VerticalMarquee } from '@frilansaresverige/ui/ui/vertical-marquee'
import type { GetStaticProps, NextPage } from 'next'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import type { ReactElement, ReactNode } from 'react'
import { useEffect, useState } from 'react'

import Seo from '../components/Seo'
import type { BentoShaderVariant } from '../components/BentoCardShader'
import { getRoute } from '../lib/routes'

// The shader backgrounds run on WebGPU and can only render in the browser.
const HeroShaderBackground = dynamic(
  () => import('../components/HeroShaderBackground'),
  { ssr: false },
)
const BentoCardShader = dynamic(() => import('../components/BentoCardShader'), {
  ssr: false,
})

const API_BASE_URL =
  process.env.API_BASE_URL || 'https://uppdrag.frilansaresverige.se/api'
const MEMBER_COUNT_API = `${API_BASE_URL}/member-count`
const FALLBACK_MEMBER_COUNT = 'flera tusen'
const FETCH_TIMEOUT_MS = 1000

export async function fetchMemberCount(): Promise<number | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(MEMBER_COUNT_API, {
      signal: controller.signal,
    })

    if (!response.ok) {
      return null
    }

    const count = parseInt((await response.text()).trim(), 10)
    return Number.isNaN(count) ? null : count
  } catch {
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

interface HomeProps {
  memberCount: number | null
}

const ROTATING_PROFESSIONS = [
  'utvecklare',
  'designers',
  'skribenter',
  'fotografer',
  'projektledare',
  'ekonomer',
  'alla frilansare',
]

const ArrowRight = () => (
  <span className="icon-[lucide--arrow-right] size-6" aria-hidden="true" />
)

const MemberCount = ({ count }: { count: number | null }) => {
  const reduced = useReducedMotion()

  if (count === null) {
    return <>{FALLBACK_MEMBER_COUNT}</>
  }
  if (reduced) {
    return <>{count}</>
  }
  return (
    <>
      <span className="sr-only">{count}</span>
      <span aria-hidden="true">
        <SlidingNumber number={count} />
      </span>
    </>
  )
}

// Fades a block in when it scrolls into view, except when the visitor has
// asked for reduced motion — then the block renders as-is, with no motion
// wrapper attached at all.
const Reveal = ({
  reduced,
  delay = 0,
  className,
  children,
}: {
  reduced: boolean
  delay?: number
  className?: string
  children: ReactNode
}) =>
  reduced ? (
    <div className={className}>{children}</div>
  ) : (
    <Fade
      inView
      inViewOnce
      inViewMargin="-80px"
      delay={delay}
      className={className}
    >
      {children}
    </Fade>
  )

// Slides a card up into place when it scrolls into view, with the same
// reduced-motion escape hatch as Reveal.
const CardSlide = ({
  reduced,
  delay = 0,
  children,
}: {
  reduced: boolean
  delay?: number
  children: ReactElement
}) =>
  reduced ? (
    children
  ) : (
    <Slide
      asChild
      inView
      inViewOnce
      inViewMargin="-60px"
      offset={40}
      delay={delay}
    >
      {children}
    </Slide>
  )

const SectionHeading = ({
  eyebrow,
  title,
}: {
  eyebrow: string
  title: string
}) => (
  <div className="mb-10 max-w-[30em] text-left">
    <p className="font-display mb-3 text-sm font-bold tracking-widest text-brand-coral uppercase">
      {eyebrow}
    </p>
    <h2 className="font-display text-3xl font-extrabold tracking-tight text-brand-cream md:text-4xl">
      {title}
    </h2>
  </div>
)

// Bento grid content for the "Vad du får" section. Each card's background
// is a live liquid-glass shader (see BentoCardShader) with the copy
// floating at the bottom. The corner classes round the four outer corners
// of the grid to 2rem, per card position.
interface BentoCard {
  variant: BentoShaderVariant
  eyebrow: string
  title: string
  text: string
  wrapper: string
  corners: string
  height: string
  slackIcon?: boolean
}

const BENTO_CARDS: BentoCard[] = [
  {
    variant: 'torus',
    eyebrow: 'Community',
    title: 'Hjälp i vardagen',
    text: 'Prissättning, avtal, bokföring eller en knivig kund? Ställ frågan i Slack och få svar från frilansare som har varit i exakt samma sits.',
    wrapper: 'lg:col-span-3',
    corners: 'max-lg:rounded-t-4xl lg:rounded-tl-4xl',
    height: 'min-h-[26rem] lg:min-h-[30rem]',
  },
  {
    variant: 'diamond',
    eyebrow: 'Uppdrag',
    title: 'Uppdrag utan mellanhänder',
    text: 'Medlemmar och företag tipsar löpande om konsultuppdrag — direktkontakt, inga avgifter och ingen som tar en del av kakan.',
    wrapper: 'lg:col-span-3',
    corners: 'lg:rounded-tr-4xl',
    height: 'min-h-[26rem] lg:min-h-[30rem]',
  },
  {
    variant: 'metaballs',
    eyebrow: 'Nätverk',
    title: 'Kollegor i hela landet',
    text: 'Frilansare från hela Sverige, inom alla möjliga branscher. Bolla idéer, hitta samarbeten eller bara snacka av dig en fredag.',
    wrapper: 'lg:col-span-2',
    corners: 'lg:rounded-bl-4xl',
    height: 'min-h-[24rem]',
  },
  {
    variant: 'ribbon',
    eyebrow: 'Slack',
    title: 'Ett Slack-community',
    text: 'Allt händer i vår Slack — trådar, kanaler och direktmeddelanden. Hitta kanalen för din bransch eller din stad och häng med.',
    wrapper: 'lg:col-span-2',
    corners: '',
    height: 'min-h-[24rem]',
    slackIcon: true,
  },
  {
    variant: 'hemisphere',
    eyebrow: 'Gratis',
    title: '0 kr, inga hakar',
    text: 'Ingen medlemsavgift, inga premiumnivåer och inga mellanhänder. Communityt drivs av medlemmarna själva.',
    wrapper: 'lg:col-span-2',
    corners: 'max-lg:rounded-b-4xl lg:rounded-br-4xl',
    height: 'min-h-[24rem]',
  },
]

// Placeholder logos of companies where members have done gigs — swap for
// real client logos (with permission) before this goes live.
const CLIENT_LOGOS = [
  { name: 'Spotify', icon: 'icon-[simple-icons--spotify]' },
  { name: 'Klarna', icon: 'icon-[simple-icons--klarna]' },
  { name: 'IKEA', icon: 'icon-[simple-icons--ikea]' },
  { name: 'Volvo', icon: 'icon-[simple-icons--volvo]' },
  { name: 'Ericsson', icon: 'icon-[simple-icons--ericsson]' },
  { name: 'Polestar', icon: 'icon-[simple-icons--polestar]' },
  { name: 'Scania', icon: 'icon-[simple-icons--scania]' },
  { name: 'H&M', icon: 'icon-[simple-icons--handm]' },
  { name: 'Husqvarna', icon: 'icon-[simple-icons--husqvarna]' },
  { name: 'Tietoevry', icon: 'icon-[simple-icons--tietoevry]' },
]

interface Testimonial {
  name: string
  role: string
  body: string
}

// Placeholder quotes — replace with real member testimonials (and get an OK
// from each member) before this goes live.
const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Sara L.',
    role: 'UX-designer, Stockholm',
    body: '”Mitt största uppdrag hittills kom från ett tips i Slack. Direktkontakt med kunden, inga mellanhänder — bara ett schysst tips från en annan frilansare.”',
  },
  {
    name: 'Johan E.',
    role: 'Fullstack-utvecklare, Göteborg',
    body: '”Jag frilansade i tre år innan jag hittade hit. Skillnaden? Nu har jag kollegor att bolla med, fast jag driver eget.”',
  },
  {
    name: 'Amina H.',
    role: 'Frilansskribent, Malmö',
    body: '”Prissättning var alltid mitt svaga kort. Efter en tråd i Slack vågade jag höja arvodet — och kunden sa ja utan att blinka.”',
  },
  {
    name: 'Erik S.',
    role: 'Fotograf, Umeå',
    body: '”Som frilansare i norr kan det bli ensamt. Här finns alltid någon online som fattar exakt hur frilanslivet funkar.”',
  },
  {
    name: 'Linnea A.',
    role: 'Projektledare, Uppsala',
    body: '”Jag har både hittat uppdrag och hyrt in andra frilansare via communityt. Det går snabbare än via någon förmedlare jag testat.”',
  },
  {
    name: 'David N.',
    role: 'Ekonomikonsult, Lund',
    body: '”Momsfrågor, avtal, försäkringar — svaren i Slack har sparat mig dyra konsulttimmar många gånger om.”',
  },
  {
    name: 'Moa K.',
    role: 'Grafisk designer, Örebro',
    body: '”Jag var livrädd för att släppa fast anställningen. Tråden där andra delade sina första år som frilansare gav mig modet att våga.”',
  },
  {
    name: 'Henrik B.',
    role: 'DevOps-konsult, Stockholm',
    body: '”Ett tips i #uppdrag på tisdagen, kontrakt på fredagen. Snabbare än så blir det inte.”',
  },
  {
    name: 'Elin T.',
    role: 'Copywriter, Västerås',
    body: '”Halva mitt nätverk kommer härifrån. Vi skickar uppdrag till varandra när vi själva är fullbokade — alla vinner.”',
  },
]

const TestimonialCard = ({ name, role, body }: Testimonial) => (
  <figure className="flex min-h-[18rem] w-full flex-col rounded-3xl bg-brand-cream p-9 text-left text-brand-blue">
    <blockquote className="text-base leading-[1.65]">{body}</blockquote>
    <figcaption className="mt-auto flex items-center gap-3 pt-5">
      <span
        aria-hidden="true"
        className="font-display flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-coral text-base font-bold text-brand-grey"
      >
        {name
          .split(' ')
          .map((part) => part[0])
          .join('')
          .replace('.', '')}
      </span>
      <span className="flex flex-col">
        <span className="font-display text-base font-bold">{name}</span>
        <span className="text-sm text-brand-blue/70">{role}</span>
      </span>
    </figcaption>
  </figure>
)

// Bento grid for the "Hitta rätt konsult" section: same liquid-gradient
// card treatment as the "Vad du får" bento (see BentoCardShader) but in
// the warm ember palette and without the 3D glass solids. Same corner
// treatment: the four outer corners of the grid are rounded to 2rem per
// card position.
interface KonsultCard {
  variant: BentoShaderVariant
  icon: string
  title: string
  text: string
  wrapper: string
  corners: string
  height: string
}

const KONSULT_BENTO: KonsultCard[] = [
  {
    variant: 'ember1',
    icon: 'icon-[lucide--building-2]',
    title: 'För företag',
    text: 'Beskriv ert uppdrag och nå tusentals frilansare direkt. Ni väljer själva vem ni vill jobba med — utan förmedlingsavgifter och utan mellanhänder som tar en del av kakan.',
    wrapper: 'lg:col-span-3',
    corners: 'max-lg:rounded-t-4xl lg:rounded-tl-4xl',
    height: 'min-h-[20rem] lg:min-h-[22rem]',
  },
  {
    variant: 'ember2',
    icon: 'icon-[lucide--users]',
    title: 'För frilansare och byråer',
    text: 'Fullbokad, eller behöver du en underkonsult med en annan spets? Tipsa nätverket och hitta rätt kollega till projektet — ofta inom några timmar.',
    wrapper: 'lg:col-span-3',
    corners: 'lg:rounded-tr-4xl',
    height: 'min-h-[20rem] lg:min-h-[22rem]',
  },
  {
    variant: 'ember3',
    icon: 'icon-[lucide--handshake]',
    title: 'Utan mellanhänder',
    text: 'Tipset går rakt ut i communityt och kontakten sker direkt mellan er och frilansaren. Inga avgifter, ingen provision.',
    wrapper: 'lg:col-span-2',
    corners: 'lg:rounded-bl-4xl',
    height: 'min-h-[18rem] lg:min-h-[20rem]',
  },
  {
    variant: 'ember4',
    icon: 'icon-[lucide--sparkles]',
    title: 'Alla kompetenser',
    text: 'Utvecklare, designers, skribenter, projektledare, ekonomer — nätverket täcker de flesta kompetenser och branscher.',
    wrapper: 'lg:col-span-2',
    corners: '',
    height: 'min-h-[18rem] lg:min-h-[20rem]',
  },
]

const STEPS = [
  {
    number: '01',
    title: 'Skicka in din ansökan',
    text: 'Berätta kort om vad du gör och länka till din LinkedIn. Det tar bara ett par minuter.',
  },
  {
    number: '02',
    title: 'Vi tittar på den',
    text: 'Vi godkänner dig som redan är igång som frilansare — med ett bolag att fakturera genom och minst en kund.',
  },
  {
    number: '03',
    title: 'Säg hej i Slack',
    text: 'Du får en inbjudan till vår Slack. Hoppa in, presentera dig och hitta kanalerna som passar dig.',
  },
]

const Home: NextPage<HomeProps> = ({ memberCount }) => {
  const reduced = useReducedMotion()
  const meta = getRoute('/')!

  // The hero shader needs WebGPU; browsers without it just keep the flat
  // brand-blue background.
  const [webgpu, setWebgpu] = useState(false)
  useEffect(() => {
    setWebgpu('gpu' in navigator)
  }, [])

  return (
    <div className="relative flex w-full max-w-[72em] flex-col items-center">
      <Seo title={meta.title} description={meta.description} path={meta.path} />

      {/* Hero — copy on the left, 3D silk ribbon on the right */}
      {/* 5.5rem matches the header's height (h-14 bar + py-4). */}
      <section className="relative flex min-h-[calc(100dvh-5.5rem)] w-full flex-col justify-center py-16 md:py-20">
        {webgpu && (
          <div
            aria-hidden="true"
            className="absolute -top-[5.5rem] bottom-0 left-1/2 -z-[1] w-screen -translate-x-1/2 overflow-hidden"
          >
            <HeroShaderBackground reduced={reduced} />
            {/* Left-to-right scrim over the copy side so the hero text
                stays readable on top of the shader. */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-brand-blue via-brand-blue/60 to-transparent" />
            {/* Blend the canvas edge into the flat page background so the
                shader doesn't look sliced where the next section starts. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-brand-blue" />
          </div>
        )}

        <div className="max-w-[50em] text-left">
          <Reveal reduced={reduced}>
            <p className="mb-6 inline-block rounded-full border border-brand-cream/30 px-4 py-1.5 text-sm tracking-wide text-brand-cream/90">
              Sveriges största frilanscommunity
            </p>
          </Reveal>

          <Reveal reduced={reduced} delay={100}>
            <h1 className="font-display text-5xl leading-[1.05] font-extrabold tracking-tight text-brand-cream md:text-6xl lg:text-7xl">
              Att frilansa är bättre{' '}
              {reduced ? (
                <span className="text-brand-coral">tillsammans.</span>
              ) : (
                <HighlightText
                  inView
                  text="tillsammans."
                  className="rounded-[0.15em] text-brand-coral"
                  style={{
                    backgroundImage:
                      'linear-gradient(var(--color-brand-blue-dark), var(--color-brand-blue-dark))',
                    padding: '0 0.12em',
                  }}
                />
              )}
            </h1>
          </Reveal>

          <Reveal reduced={reduced} delay={200}>
            <div className="mt-6 flex items-baseline gap-[0.35em] text-xl text-brand-cream/90 md:text-2xl">
              <span>För</span>
              {reduced ? (
                <span className="font-display font-bold text-brand-coral">
                  alla frilansare
                </span>
              ) : (
                <RotatingTextContainer
                  text={ROTATING_PROFESSIONS}
                  duration={2400}
                  y={-24}
                >
                  <RotatingText className="font-display font-bold text-brand-coral" />
                </RotatingTextContainer>
              )}
            </div>
          </Reveal>

          <Reveal reduced={reduced} delay={300}>
            <p className="mt-8 max-w-[38em] text-lg leading-[1.6] text-brand-cream/85 md:text-xl">
              Vi är <MemberCount count={memberCount} /> frilansare som delar
              uppdrag, kunskap och kollegskap i Slack. Vårt syfte är att främja
              kontaktskapande och uppdragstipsande mellan frilansare — helt
              gratis, utan mellanhänder.
            </p>
          </Reveal>

          <Reveal reduced={reduced} delay={400}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button asChild variant="primary" size="none">
                <Link href="/ansokan">
                  Ansök om medlemskap
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="primary-outline" size="none">
                <Link href="/tipsa">Tipsa om konsultuppdrag</Link>
              </Button>
            </div>
          </Reveal>

          <Reveal reduced={reduced} delay={500}>
            <p className="mt-7 text-sm text-brand-cream/60">
              Gratis · Inga mellanhänder · Vi ses i Slack
            </p>
          </Reveal>
        </div>
      </section>

      {/* Client logos */}
      <Reveal reduced={reduced} className="w-full py-12 md:py-14">
        <p className="font-display mb-8 text-center text-sm font-bold tracking-widest text-brand-cream/60 uppercase">
          Medlemmarna har gjort uppdrag för bland andra
        </p>
        <TooltipProvider>
          <Marquee>
            <MarqueeContent play={!reduced} speed={40}>
              {CLIENT_LOGOS.map((logo) => (
                <MarqueeItem key={logo.name} className="mx-8 md:mx-12">
                  <Tooltip side="top" sideOffset={8}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={logo.name}
                        className="flex cursor-default items-center"
                      >
                        <span
                          className={`${logo.icon} size-14 text-brand-cream/60 transition-colors duration-200 hover:text-brand-cream md:size-16`}
                          aria-hidden="true"
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{logo.name}</TooltipContent>
                  </Tooltip>
                </MarqueeItem>
              ))}
            </MarqueeContent>
            <MarqueeFade side="left" />
            <MarqueeFade side="right" />
          </Marquee>
        </TooltipProvider>
      </Reveal>

      {/* Features */}
      <section className="w-full py-16 md:py-20">
        <SectionHeading
          eyebrow="Vad du får"
          title="Ett community som jobbar för dig"
        />
        <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-6 lg:grid-rows-2">
          {BENTO_CARDS.map((card, index) => (
            <div key={card.title} className={`relative ${card.wrapper}`}>
              <CardSlide reduced={reduced} delay={index * 100}>
                <div
                  className={`squircle relative flex h-full flex-col overflow-hidden rounded-xl text-left transition-transform duration-200 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${card.height} ${card.corners}`}
                >
                  {/* Fallback wash while the shader initializes (or when
                      WebGPU is unavailable). */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 z-0"
                    style={{
                      background:
                        'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,156,142,0.25), transparent), linear-gradient(to bottom, #2601bb, #16045e)',
                    }}
                  >
                    {webgpu && (
                      <BentoCardShader
                        variant={card.variant}
                        reduced={reduced}
                      />
                    )}
                  </div>
                  {/* Scrim so the copy stays readable over the brighter
                      shader regions. */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-2/3 bg-gradient-to-t from-[#160a4d]/80"
                  />
                  <div className="relative z-10 mt-auto p-8">
                    <h3 className="font-display text-sm font-bold tracking-widest text-brand-coral-light uppercase">
                      {card.eyebrow}
                    </h3>
                    <p className="font-display mt-2 flex items-center gap-2 text-xl font-bold tracking-tight text-[#fffce3]">
                      {card.slackIcon && (
                        <span
                          className="icon-[simple-icons--slack] size-5 shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      {card.title}
                    </p>
                    <p className="mt-2 leading-[1.6] text-[#fffce3]/85">
                      {card.text}
                    </p>
                  </div>
                </div>
              </CardSlide>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="w-full py-8 md:py-12">
        <SectionHeading
          eyebrow="Så går det till"
          title="Tre steg till ditt nya nätverk"
        />
        <ol className="grid w-full gap-10 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.number}>
              <Reveal reduced={reduced} delay={index * 120}>
                <p
                  className="font-display text-5xl font-extrabold text-brand-coral"
                  aria-hidden="true"
                >
                  {step.number}
                </p>
                <h3 className="font-display mt-4 mb-2 text-xl font-bold text-brand-cream">
                  {step.title}
                </h3>
                <p className="leading-[1.6] text-brand-cream/80">{step.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      {/* Testimonials */}
      <section className="w-full py-20 md:py-28">
        <SectionHeading eyebrow="Medlemmarna" title="Röster från communityt" />
        {reduced ? (
          <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.slice(0, 6).map((testimonial) => (
              <TestimonialCard key={testimonial.name} {...testimonial} />
            ))}
          </div>
        ) : (
          <div className="relative h-185 w-full overflow-hidden">
            <div className="flex h-full w-full flex-row items-stretch justify-center gap-4">
              <VerticalMarquee
                pauseOnHover
                className="hidden h-full flex-1 [--duration:34s] sm:flex"
              >
                {TESTIMONIALS.filter((_, i) => i % 3 === 0).map(
                  (testimonial) => (
                    <TestimonialCard key={testimonial.name} {...testimonial} />
                  ),
                )}
              </VerticalMarquee>
              <VerticalMarquee
                reverse
                pauseOnHover
                className="hidden h-full flex-1 [--duration:40s] sm:flex"
              >
                {TESTIMONIALS.filter((_, i) => i % 3 === 1).map(
                  (testimonial) => (
                    <TestimonialCard key={testimonial.name} {...testimonial} />
                  ),
                )}
              </VerticalMarquee>
              <VerticalMarquee
                pauseOnHover
                className="hidden h-full flex-1 [--duration:30s] lg:flex"
              >
                {TESTIMONIALS.filter((_, i) => i % 3 === 2).map(
                  (testimonial) => (
                    <TestimonialCard key={testimonial.name} {...testimonial} />
                  ),
                )}
              </VerticalMarquee>
              <VerticalMarquee
                pauseOnHover
                className="flex h-full flex-1 [--duration:60s] sm:hidden"
              >
                {TESTIMONIALS.map((testimonial) => (
                  <TestimonialCard key={testimonial.name} {...testimonial} />
                ))}
              </VerticalMarquee>
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1/4 bg-gradient-to-b from-background" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1/4 bg-gradient-to-t from-background" />
          </div>
        )}
      </section>

      {/* Freelancer CTA */}
      <section className="flex w-full flex-col items-center py-16 text-center md:py-20">
        <Reveal reduced={reduced}>
          <h2 className="font-display max-w-[14em] text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
            Redo att slippa frilansa ensam?
          </h2>
          <p className="mx-auto mt-4 flex max-w-[30em] items-center justify-center gap-2 text-lg leading-[1.6] text-brand-cream/85">
            Ansökan är gratis och tar bara ett par minuter. Vi ses i Slack!
            <span
              className="icon-[simple-icons--slack] size-5 shrink-0"
              aria-hidden="true"
            />
          </p>
          <div className="mt-8 flex justify-center">
            <Button asChild variant="primary" size="none">
              <Link href="/ansokan">
                Ansök om medlemskap
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </Reveal>
      </section>

      {/* For companies and hiring freelancers: find the right consultant */}
      <section className="w-full pt-8 pb-24 md:pt-12 md:pb-32">
        <SectionHeading
          eyebrow="Hitta rätt konsult"
          title="Rätt frilansare för nästa uppdrag"
        />
        <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-6 lg:grid-rows-2">
          {KONSULT_BENTO.map((card, index) => (
            <div key={card.title} className={`relative ${card.wrapper}`}>
              <CardSlide reduced={reduced} delay={index * 100}>
                <div
                  className={`squircle relative flex h-full flex-col overflow-hidden rounded-xl text-left transition-transform duration-200 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${card.height} ${card.corners}`}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 z-0 bg-[#ff9c8e]"
                  >
                    {webgpu && (
                      <BentoCardShader
                        variant={card.variant}
                        reduced={reduced}
                        showGlass={false}
                      />
                    )}
                  </div>
                  <div className="relative z-10 mt-auto p-8">
                    <span
                      className={`${card.icon} size-8 shrink-0 text-brand-grey`}
                      aria-hidden="true"
                    />
                    <h3 className="font-display mt-4 text-xl font-bold tracking-tight text-brand-grey">
                      {card.title}
                    </h3>
                    <p className="mt-2 leading-[1.6] text-brand-grey">
                      {card.text}
                    </p>
                  </div>
                </div>
              </CardSlide>
            </div>
          ))}
          <div className="relative lg:col-span-2">
            <CardSlide reduced={reduced} delay={400}>
              <div className="squircle relative flex h-full min-h-[18rem] flex-col overflow-hidden rounded-xl text-left transition-transform duration-200 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 max-lg:rounded-b-4xl lg:min-h-[20rem] lg:rounded-br-4xl">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 z-0 bg-[#ff9c8e]"
                >
                  {webgpu && (
                    <BentoCardShader
                      variant="ember5"
                      reduced={reduced}
                      showGlass={false}
                    />
                  )}
                </div>
                <div className="relative z-10 mt-auto p-8">
                  <h3 className="font-display text-xl font-extrabold tracking-tight text-brand-grey">
                    Redo att hitta rätt konsult?
                  </h3>
                  <p className="mt-2 leading-[1.6] text-brand-grey">
                    Nå ut till <MemberCount count={memberCount} /> frilansare
                    med ditt uppdrag — gratis och direkt från källan.
                  </p>
                  <div className="mt-6">
                    <Button
                      asChild
                      variant="primary"
                      size="none"
                      className="bg-brand-blue text-brand-cream hover:bg-brand-blue-dark focus:shadow-[0_0_0_0.1em_var(--color-brand-coral),0_0_0_0.2em_var(--color-brand-blue)]"
                    >
                      <Link href="/tipsa">
                        Tipsa om konsultuppdrag
                        <ArrowRight />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardSlide>
          </div>
        </div>
      </section>
    </div>
  )
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const memberCount = await fetchMemberCount()

  return {
    props: {
      memberCount,
    },
    revalidate: 3600,
  }
}

export default Home
