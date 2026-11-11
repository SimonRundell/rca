/**
 * A short feedback message with an icon and a word as well as colour,
 * so meaning never depends on colour alone (section 13).
 */

/**
 * @param {Object} props
 * @param {'correct'|'incorrect'|'partial'|'info'} props.kind
 * @param {string} props.children
 */
export function FeedbackBanner({ kind, children }) {
  const wordByKind = { correct: 'Correct', incorrect: 'Not quite', partial: 'Partly right', info: 'Note' };
  const iconByKind = { correct: '✓', incorrect: '✗', partial: '≈', info: 'ℹ' };
  return (
    <div className={`feedback-banner feedback-banner--${kind}`} role="status">
      <span className="feedback-banner__icon" aria-hidden="true">{iconByKind[kind]}</span>
      <span className="feedback-banner__word">{wordByKind[kind]}:</span>
      <span className="feedback-banner__text">{children}</span>
    </div>
  );
}
