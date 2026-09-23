import { Button } from '@frilansaresverige/ui/animate-ui/components/buttons/button'
import { Alert, AlertDescription } from '@frilansaresverige/ui/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@frilansaresverige/ui/ui/alert-dialog'
import { Label } from '@frilansaresverige/ui/ui/label'
import { Textarea } from '@frilansaresverige/ui/ui/textarea'
import { useRouter } from 'next/router'
import { type FormEvent, useState } from 'react'
import AssignmentPreview from '../../../components/AssignmentPreview'
import { FIELD_CLASSES, LABEL_CLASSES } from '../../../components/form-classes'
import Seo from '../../../components/Seo'
import { useAssignment } from '../../../hooks/useAssignment'
import { requireRoute } from '../../../lib/routes'

const ERROR_COPY = 'Något gick fel. Försök igen om en stund.'

// Reached only through the link in the receipt mail. Client-rendered:
// the id is secret, so nothing about it is prerendered or indexed.
const Hantera = () => {
  const meta = requireRoute('/tipsa/hantera')
  const router = useRouter()
  const id =
    router.isReady && typeof router.query.id === 'string'
      ? router.query.id
      : undefined
  const { assignment, comments, status, addComment, remove } = useAssignment(id)
  const [comment, setComment] = useState('')
  const [commentState, setCommentState] = useState<
    'editing' | 'saving' | 'saved'
  >('editing')
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!comment.trim() || commentState === 'saving') {
      return
    }
    setCommentState('saving')
    setError(null)
    try {
      await addComment(comment.trim())
      setComment('')
      setCommentState('saved')
    } catch {
      setError(ERROR_COPY)
      setCommentState('editing')
    }
  }

  const confirmDelete = async () => {
    setDeleting(true)
    setError(null)
    try {
      await remove()
      setCommentState('editing')
    } catch {
      setError(ERROR_COPY)
    } finally {
      // Close the dialog on failure too, so the page-level error notice
      // (rendered behind the modal overlay) becomes visible.
      setConfirming(false)
      setDeleting(false)
    }
  }

  return (
    <div className="w-full max-w-[44em] pt-10 pb-24 md:pt-16">
      <Seo
        title={meta.title}
        description={meta.description}
        path={meta.path}
        noindex
      />

      <p className="font-display mb-3 text-sm font-bold tracking-widest text-eyebrow uppercase">
        Konsultuppdrag
      </p>
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
        Hantera ditt uppdrag
      </h1>

      {status === 'loading' && (
        <p className="mt-6 text-brand-cream/75" role="status">
          Hämtar uppdraget…
        </p>
      )}

      {status === 'missing' && (
        <p className="mt-6 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
          Det uppdrag du söker kunde inte hittas.
        </p>
      )}

      {status === 'error' && (
        <p className="mt-6 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
          {ERROR_COPY}
        </p>
      )}

      {status === 'ready' && assignment && (
        <>
          <p className="mt-4 mb-8 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
            {assignment.deleted
              ? 'Uppdraget är borttaget och visas inte längre för andra.'
              : 'Du som har länken hit kan komplettera uppdraget eller ta bort det. Håll därför länken hemlig.'}
          </p>

          {error && (
            <Alert
              role="alert"
              className="mb-6 rounded-[0.75em] border-[#6a6a6a] bg-[#ffaaaa] p-5 text-brand-grey"
            >
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <AssignmentPreview assignment={assignment} comments={comments} />

          {!assignment.deleted && (
            <>
              <form
                className="mt-8 rounded-[1.25rem] bg-brand-cream p-6 text-brand-blue md:p-8"
                onSubmit={submitComment}
                aria-busy={commentState === 'saving'}
              >
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="comment" className={LABEL_CLASSES}>
                    Komplettera uppdraget med ny information
                  </Label>
                  <Textarea
                    id="comment"
                    name="comment"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    disabled={commentState === 'saving'}
                    required
                    maxLength={5000}
                    className={`${FIELD_CLASSES} min-h-[8em]`}
                  />
                </div>
                {commentState === 'saved' && (
                  <p className="mt-3 text-[0.95em]" role="status">
                    <strong>Tack!</strong> Din komplettering är sparad.
                  </p>
                )}
                <div className="mt-5">
                  <Button
                    type="submit"
                    variant="primary"
                    size="none"
                    disabled={!comment.trim() || commentState === 'saving'}
                  >
                    {commentState === 'saving'
                      ? 'Sparar…'
                      : 'Spara komplettering'}
                  </Button>
                </div>
              </form>

              <div className="mt-8">
                <Button
                  type="button"
                  variant="primary-outline"
                  size="none"
                  onClick={() => setConfirming(true)}
                >
                  Ta bort uppdraget
                </Button>
              </div>

              <AlertDialog
                open={confirming}
                onOpenChange={(open) => !deleting && setConfirming(open)}
              >
                <AlertDialogContent className="bg-brand-cream text-brand-blue">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-display text-xl font-extrabold">
                      Ta bort uppdraget?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-brand-blue/80">
                      Uppdraget slutar visas och meddelandena i Slack skrivs
                      över. Det går inte att ångra.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                      <Button
                        type="button"
                        variant="primary-outline"
                        size="none"
                        disabled={deleting}
                      >
                        Avbryt
                      </Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button
                        type="button"
                        variant="primary"
                        size="none"
                        disabled={deleting}
                        onClick={(event) => {
                          // Keep the dialog open until the request settles.
                          event.preventDefault()
                          void confirmDelete()
                        }}
                      >
                        {deleting ? 'Tar bort…' : 'Ta bort'}
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default Hantera
