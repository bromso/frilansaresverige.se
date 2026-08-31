import Seo from '../components/Seo'

// Deliberately dependency-free (no motion, no shaders, no hooks): if the
// server is unwell this page must still render as static HTML.
const Custom500 = () => (
  <section className="flex w-full max-w-[44em] flex-col items-start py-20 md:py-28">
    <Seo
      title="Något gick fel"
      description="Ett tekniskt fel inträffade."
      path="/500"
      noindex
    />
    <p className="font-display mb-3 text-sm font-bold tracking-widest text-eyebrow uppercase">
      500
    </p>
    <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
      Något gick fel
    </h1>
    <p className="mt-4 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
      Ett tekniskt fel inträffade på servern. Ladda om sidan om en stund — och
      om det fortsätter, säg till i Slacken eller öppna ett ärende på GitHub.
    </p>
    <a
      href="/"
      className="mt-8 inline-block rounded-full bg-brand-coral px-5 py-2 font-bold text-brand-grey"
    >
      Till startsidan
    </a>
  </section>
)

export default Custom500
