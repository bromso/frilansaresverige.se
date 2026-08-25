import Link from 'next/link'
import Breadcrumbs from '../components/Breadcrumbs'
import Seo from '../components/Seo'
import { getRoute } from '../lib/routes'

const Integritetspolicy = () => {
  const meta = getRoute('/integritetspolicy')!
  return (
    <>
      <Seo title={meta.title} description={meta.description} path={meta.path} />
      <Breadcrumbs path={meta.path} />
      <section className="flex w-full max-w-[44em] flex-col py-12 md:py-16">
        <p className="font-display mb-3 text-sm font-bold tracking-widest text-brand-coral uppercase">
          Juridik
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          Integritetspolicy
        </h1>
        <p className="mt-4 text-lg leading-[1.6] text-brand-cream/85">
          Så hanterar vi de personuppgifter du lämnar när du ansöker om
          medlemskap eller tipsar om ett uppdrag.
        </p>

        <h2 className="font-display mt-10 text-2xl font-bold text-brand-cream">
          Vilka uppgifter vi samlar in
        </h2>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          I{' '}
          <Link href="/ansokan" className="underline hover:no-underline">
            ansökan
          </Link>{' '}
          om medlemskap ber vi om namn, mejl, hur länge du varit frilansare,
          företagsnamn, länk till din LinkedIn-profil och en fritextmotivering
          om dig själv.
        </p>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          När du{' '}
          <Link href="/tipsa" className="underline hover:no-underline">
            tipsar om ett uppdrag
          </Link>{' '}
          samlar vi in de uppdrags- och kontaktuppgifter du själv anger:
          uppdragstitel, ort, uppdragsgivare, minimiarvode, en beskrivning, en
          kontaktuppgift och din relation till kunden.
        </p>

        <h2 className="font-display mt-10 text-2xl font-bold text-brand-cream">
          Vad uppgifterna används till
        </h2>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          Uppgifterna i din ansökan används för att bedöma om du kan bli medlem.
          Godkänns ansökan används mejladressen för att skicka en inbjudan till
          vårt Slack-community.
        </p>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          Uppgifterna i ett uppdragstips publiceras till communityt, det vill
          säga postas i en Slack-kanal där våra medlemmar kan se och svara på
          uppdraget.
        </p>

        <h2 className="font-display mt-10 text-2xl font-bold text-brand-cream">
          Var uppgifterna hanteras
        </h2>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          Båda formulären skickar uppgifterna direkt till Slack via en webhook.
          Vi sparar dem inte i en egen databas på sajten — Slack är den
          plattform där uppgifterna sedan finns, och Slacks egna villkor styr
          hur de hanteras där.
        </p>

        <h2 className="font-display mt-10 text-2xl font-bold text-brand-cream">
          Cookies och statistik
        </h2>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          Sajten använder Google Analytics för besöksstatistik. Läs mer om vilka
          cookies det innebär på{' '}
          <Link href="/cookies" className="underline hover:no-underline">
            cookiessidan
          </Link>
          .
        </p>

        <h2 className="font-display mt-10 text-2xl font-bold text-brand-cream">
          Dina rättigheter
        </h2>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          Vill du be om ett utdrag av vad vi har om dig, eller be om att få det
          raderat, hör av dig via{' '}
          <Link href="/kontakt" className="underline hover:no-underline">
            kontaktsidan
          </Link>
          .
        </p>

        <p className="mt-10 text-sm text-brand-cream/60">
          Senast uppdaterad: 2026-08-25
        </p>
      </section>
    </>
  )
}

export default Integritetspolicy
