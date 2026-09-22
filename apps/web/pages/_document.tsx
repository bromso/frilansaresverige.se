import Document, { Head, Html, Main, NextScript } from 'next/document'

export default class MyDocument extends Document {
  render() {
    return (
      // next-themes stamps the theme class on <html> before hydration.
      <Html lang="sv" suppressHydrationWarning>
        <Head>
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <link rel="icon" type="image/x-icon" href="/favicon.ico" />
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="/apple-touch-icon.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="/favicon-32x32.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="/favicon-16x16.png"
          />

          <link rel="manifest" href="/site.webmanifest" />
          {/* Browser chrome colour. The site defaults to the blue theme;
              next-themes only knows the toggle after hydration, so the
              light value is the OS hint rather than the toggle. */}
          <meta name="theme-color" content="#4823dc" />
          {/* Global Site Tag (gtag.js) - Google Analytics. Only rendered
              when an ID is configured — otherwise the page would request
              gtag/js?id=undefined on every load. */}
          {process.env.GOOGLE_ANALYTICS_ID && (
            <>
              <script
                async
                src={`https://www.googletagmanager.com/gtag/js?id=${process.env.GOOGLE_ANALYTICS_ID}`}
              />
              <script
                // biome-ignore lint/security/noDangerouslySetInnerHtml: Google Analytics gtag bootstrap requires an inline script; the content is a static literal with no user input.
                dangerouslySetInnerHTML={{
                  __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            // The manage-page id is the only credential for a listing, so it never reaches analytics.
            var maskedPath = window.location.pathname.replace(/^\\/tipsa\\/hantera\\/[^/?#]+/, '/tipsa/hantera');
            gtag('config', '${process.env.GOOGLE_ANALYTICS_ID}', {
              page_path: maskedPath,
              page_location: window.location.origin + maskedPath + window.location.search,
            });
          `,
                }}
              />
            </>
          )}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
