import { useEffect, useRef, type ReactNode } from 'react';

interface DialogProps {
  title: string;
  message?: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  onCancel: () => void;
  cancelLabel?: string;
  children?: ReactNode;
}

export function Dialog({ title, message, confirmLabel, onConfirm, onCancel, cancelLabel, children }: DialogProps) {
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
    >
      <h3 id="studio-dialog-title">{title}</h3>
      {message && <p>{message}</p>}
      {children && <div className="studio-dialog-body">{children}</div>}
      <div className="studio-dialog-actions">
        <button type="button" onClick={() => closeAndRun(onCancel)}>{cancelLabel ?? (confirmLabel ? 'Cancel' : 'Close')}</button>
        {confirmLabel && onConfirm && <button className="studio-dialog-confirm" type="button" onClick={() => closeAndRun(onConfirm)}>{confirmLabel}</button>}
      </div>
    </dialog>
  );
}
