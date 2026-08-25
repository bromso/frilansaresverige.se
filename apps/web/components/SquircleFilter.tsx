// Adapted from Skiper UI's Skiper63 squircle filter (skiper-ui.com): a
// static SVG "goo" filter (blur + alpha-contrast + blend) that smooths a
// rounded rectangle's corners into a squircle. Mounted once in _app; any
// element gets the treatment via the .squircle utility class (defined in
// globals.css as filter: url(#SquiCircle)). Pure CSS filter — no
// re-renders, no per-element JS. The demo's draggable options panel is
// intentionally not included.
export const SquircleFilter = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="absolute bottom-0 left-0 size-0"
    aria-hidden="true"
  >
    <defs>
      <filter id="SquiCircle">
        <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
        <feColorMatrix
          in="blur"
          mode="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -7"
          result="goo"
        />
        <feBlend in="SourceGraphic" in2="goo" />
      </filter>
    </defs>
  </svg>
)
