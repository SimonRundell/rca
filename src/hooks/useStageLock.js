import { useState } from 'react';

/**
 * Standardises the Practice vs Assessed feedback/retry behaviour used
 * by every stage (section 5): Practice reveals feedback after each
 * decision with unlimited retries; Assessed reveals everything only
 * once the whole stage is submitted, after which it is final.
 * @param {'practice'|'assessed'} mode
 */
export function useStageLock(mode) {
  const [submitted, setSubmitted] = useState(mode === 'practice');
  const revealed = mode === 'practice' || submitted;
  const locked = mode === 'assessed' && submitted;
  return { revealed, locked, submitStage: () => setSubmitted(true) };
}
