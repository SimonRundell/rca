import { percentFromResult } from '../../lib/scoring.js';

/**
 * Shows a single stage result as "x / y" and a percentage.
 * @param {Object} props
 * @param {{earned: number, possible: number}} props.result
 * @param {string} [props.label]
 */
export function ScorePanel({ result, label = 'Stage score' }) {
  const percent = Math.round(percentFromResult(result));
  return (
    <div className="score-panel">
      <span className="score-panel__label">{label}</span>
      <span className="score-panel__value">
        {Math.round(result.earned * 10) / 10} / {result.possible} ({percent}%)
      </span>
    </div>
  );
}
