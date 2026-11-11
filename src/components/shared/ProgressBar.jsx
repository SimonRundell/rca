/**
 * A horizontal progress indicator. Drawn as SVG with a computed `width`
 * geometry attribute rather than a CSS width style, consistent with the
 * fault tree's use of SVG for computed geometry (section 3.1).
 *
 * @param {Object} props
 * @param {number} props.percent     0-100
 * @param {'accent'|'success'|'warn'|'neutral'} [props.tone]
 * @param {string} [props.label]     accessible label; defaults to "n percent"
 */
export function ProgressBar({ percent, tone = 'accent', label }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="progress-bar" role="img" aria-label={label ?? `${Math.round(clamped)} percent`}>
      <svg className="progress-bar__svg" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
        <rect className="progress-bar__track" x="0" y="0" width="100" height="8" rx="4" />
        <rect className={`progress-bar__fill progress-bar__fill--${tone}`} x="0" y="0" width={clamped} height="8" rx="4" />
      </svg>
    </div>
  );
}
