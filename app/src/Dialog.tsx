import { useEffect, useId, useRef, type ReactNode } from 'react';

interface DialogProps {
  title: string;
  message?: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  onCancel: () => void;
  cancelLabel?: string;
  children?: ReactNode;
}

// Restore focus after the dialog closes. Closing every dialog here unmounts it,
// so this runs from the unmount cleanup — after React has committed the
// surrounding tree changes. That lets us detect a trigger that was removed in
// the same update (Start over rebuilds the editor) and fall back to a real
// control instead of stranding focus on <body>.
function restoreFocus(previous: HTMLElement | null) {
  if (previous?.isConnected) {
    previous.focus();
    return;
  }
  const fallback = document.querySelector<HTMLElement>(
    '.lab-tool button, .lab-tool a[href], .lab-tool input, .lab-tool select, .lab-tool textarea',
  );
  fallback?.focus();
}

export function Dialog({ title, message, confirmLabel, onConfirm, onCancel, cancelLabel, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.showModal();
    return () => restoreFocus(previousFocusRef.current);
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="studio-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onCancel(); }}
    >
      <h3 id={titleId}>{title}</h3>
      {message && <p>{message}</p>}
      {children && <div className="studio-dialog-body">{children}</div>}
      <div className="studio-dialog-actions">
        <button type="button" onClick={onCancel}>{cancelLabel ?? (confirmLabel ? 'Cancel' : 'Close')}</button>
        {confirmLabel && onConfirm && <button className="studio-dialog-confirm" type="button" onClick={onConfirm}>{confirmLabel}</button>}
      </div>
    </dialog>
  );
}
