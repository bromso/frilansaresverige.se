// Archive filter chip (used by /uppdrag and /recensioner): coral when
// active, quiet cream tint otherwise.
const FilterChip = ({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={`font-display rounded-full px-4 py-2 text-sm font-bold transition-colors ${
      active
        ? 'bg-brand-coral text-brand-grey'
        : 'bg-brand-cream/10 text-brand-cream/80 hover:bg-brand-cream/15'
    }`}
  >
    {children}
  </button>
)

export default FilterChip
