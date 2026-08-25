// The logo mark on its own (the coral circle + cream shape), cropped out
// of the full wordmark SVG for use in the header and footer.
const LogoMark = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 59 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M20.5186 38.1889C30.6202 38.1889 38.8091 29.9879 38.8091 19.8716C38.8091 9.75526 30.6202 1.55434 20.5186 1.55434C10.417 1.55434 2.22803 9.75526 2.22803 19.8716C2.22803 29.9879 10.417 38.1889 20.5186 38.1889Z"
      fill="#FF9C8E"
    />
    <path
      d="M38.8093 19.8717C38.8093 9.75528 46.9983 1.55432 57.1 1.55432V38.1889H38.8093V19.8717Z"
      className="fill-brand-cream"
    />
  </svg>
)

export default LogoMark
