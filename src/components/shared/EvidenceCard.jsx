import { useState } from 'react';

/**
 * A single evidence item. Collapsed by default; opening it is the
 * "request" action in Stage 3. Content is shown monospaced (Courier
 * New), since it represents logs, configs and other technical extracts.
 *
 * @param {Object} props
 * @param {import('../../data/scenarios/wifi-b12.js').default['evidence'][number]} props.evidence
 * @param {boolean} [props.opened]
 * @param {boolean} [props.unavailable]      destroyed by an earlier containment choice
 * @param {boolean} [props.released]         essential but not requested, auto-released at stage end
 * @param {() => void} [props.onRequest]
 * @param {boolean} [props.selectable]       show a request button at all
 * @param {boolean} [props.selected]         for use as a pickable item elsewhere (e.g. evidence-linking)
 * @param {() => void} [props.onSelect]
 */
export function EvidenceCard({ evidence, opened, unavailable, released, onRequest, selectable = true, selected, onSelect }) {
  const [expanded, setExpanded] = useState(opened);

  function handleOpen() {
    if (unavailable) return;
    if (!opened && onRequest) onRequest();
    setExpanded(true);
  }

  const isOpen = opened || expanded;

  return (
    <div
      className={`evidence-card${unavailable ? ' evidence-card--unavailable' : ''}${selected ? ' evidence-card--selected' : ''}`}
    >
      <div className="evidence-card__header">
        <span className="evidence-card__source">{evidence.source}</span>
        <span className="evidence-card__kind">{evidence.kind}</span>
        {selectable && !isOpen && !unavailable && (
          <button type="button" className="button button--small" onClick={handleOpen}>
            Request
          </button>
        )}
        {onSelect && isOpen && !unavailable && (
          <button type="button" className="button button--small" onClick={onSelect} aria-pressed={selected}>
            {selected ? 'Selected' : 'Use as evidence'}
          </button>
        )}
      </div>
      {unavailable && <p className="evidence-card__note">No longer available - this was destroyed by an earlier decision.</p>}
      {released && !unavailable && <p className="evidence-card__note">Released: you ran out of requests before opening this item.</p>}
      {isOpen && !unavailable && (
        <>
          <pre className="evidence-card__content">{evidence.content}</pre>
          <p className="evidence-card__relevance">{evidence.relevanceNote}</p>
        </>
      )}
    </div>
  );
}
