export interface AssignmentView {
  title: string
  description: string
  customerName: string
  location: string | null
  scope: string | null
  workForm: string | null
  /** Rendered contact lines, structured or legacy free text. */
  contact: string
  senderType: 'BROKER' | 'DIRECT'
  clientHourlyRate: string | number | null
  deleted: boolean
}

export interface CommentView {
  id: number
  comment: string
  created: number
}

const SENDER_TYPE_LABELS: Record<AssignmentView['senderType'], string> = {
  BROKER: 'Avtal med förmedlare',
  DIRECT: 'Direktavtal med kunden',
}

// "den 22 september 2026 kl. 14.05" (the Intl time separator varies by
// runtime, which is why the spec accepts both).
export const formatCommentDate = (created: number): string =>
  `den ${new Intl.DateTimeFormat('sv-SE', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Europe/Stockholm',
  }).format(new Date(created * 1000))}`

const Fact = ({ label, value }: { label: string; value: string | null }) =>
  value ? (
    <div>
      <dt className="text-sm font-bold tracking-wide text-brand-blue/70 uppercase">
        {label}
      </dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  ) : null

const SectionHeading = ({ children }: { children: string }) => (
  <h3 className="font-display mt-6 text-sm font-bold tracking-widest uppercase">
    {children}
  </h3>
)

// The listing as it appears to the sender: the preview step of the form
// and the manage page both render it, so what they approve is what the
// manage page shows them later.
const AssignmentPreview = ({
  assignment,
  comments = [],
}: {
  assignment: AssignmentView
  comments?: CommentView[]
}) => (
  <article className="rounded-[1.25rem] bg-brand-cream p-6 text-brand-blue md:p-8">
    <h2 className="font-display text-2xl font-extrabold tracking-tight">
      {assignment.title}
    </h2>
    {assignment.deleted ? (
      <p className="mt-3 text-brand-blue/70 italic">
        Denna uppdragsannons har raderats.
      </p>
    ) : (
      <>
        <dl className="mt-4 grid gap-x-8 gap-y-3 md:grid-cols-2">
          <Fact label="Plats" value={assignment.location} />
          <Fact label="Omfattning" value={assignment.scope} />
          <Fact label="Arbetsform" value={assignment.workForm} />
          <Fact
            label="Lägsta arvode"
            value={
              assignment.clientHourlyRate === null
                ? null
                : `${assignment.clientHourlyRate} kr/h`
            }
          />
          <Fact
            label="Avtal"
            value={SENDER_TYPE_LABELS[assignment.senderType]}
          />
        </dl>
        <SectionHeading>Beskrivning</SectionHeading>
        <p className="mt-1 leading-[1.6] whitespace-pre-wrap">
          {assignment.description}
        </p>
        <SectionHeading>Uppdragsgivare</SectionHeading>
        <p className="mt-1">{assignment.customerName}</p>
        <SectionHeading>Kontaktuppgifter</SectionHeading>
        <p className="mt-1 whitespace-pre-wrap">{assignment.contact}</p>
        {comments.map((comment) => (
          <section key={comment.id}>
            <h3 className="font-display mt-6 text-sm font-bold tracking-widest uppercase">
              Komplettering {formatCommentDate(comment.created)}
            </h3>
            <p className="mt-1 leading-[1.6] whitespace-pre-wrap">
              {comment.comment}
            </p>
          </section>
        ))}
      </>
    )}
  </article>
)

export default AssignmentPreview
