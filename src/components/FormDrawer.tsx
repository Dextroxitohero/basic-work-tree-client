import { useState, type FormEventHandler, type ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

/** Drawer lateral con formulario. Cerrarlo con cambios sin guardar pide confirmación. */
export function FormDrawer({
  title,
  description,
  dirty,
  pending,
  submitLabel,
  submitDisabled = false,
  onSubmit,
  onClose,
  children,
}: {
  title: string
  description?: string
  dirty: boolean
  pending: boolean
  submitLabel: string
  submitDisabled?: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
  onClose: () => void
  children: ReactNode
}) {
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  function requestClose() {
    if (dirty && !pending) setConfirmDiscard(true)
    else onClose()
  }

  return (
    <>
      <Sheet open onOpenChange={(open) => !open && requestClose()}>
        <SheetContent className="gap-0 p-0 data-[side=right]:sm:max-w-md">
          <SheetHeader className="border-b p-6 pr-14">
            <SheetTitle className="text-lg font-semibold tracking-tight">{title}</SheetTitle>
            {description ? <SheetDescription>{description}</SheetDescription> : null}
          </SheetHeader>
          <form noValidate onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto px-6 py-5">{children}</div>
            <div className="flex justify-end gap-2 border-t px-6 py-4">
              <Button type="button" variant="ghost" onClick={requestClose} disabled={pending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending || submitDisabled}>
                {pending ? 'Guardando…' : submitLabel}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar los cambios?</AlertDialogTitle>
            <AlertDialogDescription>Lo que has escrito en este formulario se perderá.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir editando</AlertDialogCancel>
            <AlertDialogAction onClick={onClose}>Descartar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
