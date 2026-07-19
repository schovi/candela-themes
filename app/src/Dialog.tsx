import { useEffect, useRef } from 'react';

interface DialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  cancelLabel?: string;
}

export function Dialog({ title, message, confirmLabel, onConfirm, onCancel, cancelLabel = 'Cancel' }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.showModal();
  }, []);

  const closeAndRun = (action: () => void) => {
    dialogRef.current?.close();
    requestAnimationFrame(() => {
      action();
      previousFocusRef.current?.focus();
    });
  };

  return (
    <dialog
      ref={dialogRef}
      className="studio-dialog"
      aria-labelledby="studio-dialog-title"
      onCancel={(event) => { event.preventDefault(); closeAndRun(onCancel); }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const buttons = dialogRef.current?.querySelectorAll<HTMLElement>('button');
        if (!buttons?.length) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
    >
      <h3 id="studio-dialog-title">{title}</h3>
      <p>{message}</p>
      <div className="studio-dialog-actions">
        <button type="button" onClick={() => closeAndRun(onCancel)}>{cancelLabel}</button>
        <button className="studio-dialog-confirm" type="button" onClick={() => closeAndRun(onConfirm)}>{confirmLabel}</button>
      </div>
    </dialog>
  );
}
