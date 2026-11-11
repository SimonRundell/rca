import { useEffect, useRef } from 'react';

/**
 * A simple in-page confirmation dialog. The design explicitly avoids
 * `window.confirm` (section 3.4), so every confirmation in the app goes
 * through this component instead.
 *
 * @param {Object} props
 * @param {boolean} props.open
 * @param {string} props.title
 * @param {string} props.children
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onCancel
 * @param {string} [props.confirmLabel]
 */
export function Dialog({ open, title, children, onConfirm, onCancel, confirmLabel = 'Confirm' }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (open) confirmRef.current?.focus();
  }, [open]);

  if (!open) return null;

  function handleKeyDown(e) {
    if (e.key === 'Escape') onCancel();
  }

  return (
    <div className="dialog-overlay" onKeyDown={handleKeyDown}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title">
        <h2 id="dialog-title" className="dialog__title">{title}</h2>
        <div className="dialog__body">{children}</div>
        <div className="dialog__actions">
          <button type="button" className="button button--secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="button button--danger" ref={confirmRef} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
