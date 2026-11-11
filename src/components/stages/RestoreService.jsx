import { useState } from 'react';
import { ChoiceList } from '../shared/ChoiceList.jsx';
import { FeedbackBanner } from '../shared/FeedbackBanner.jsx';
import { useStageLock } from '../../hooks/useStageLock.js';
import { combineResults, scoreBinary } from '../../lib/scoring.js';

/**
 * Stage 2: Restore service. A containment choice, followed by the
 * "is the RCA finished?" check that teaches containment vs root cause.
 *
 * @param {Object} props
 * @param {import('../../data/scenarios/wifi-b12.js').default} props.scenario
 * @param {'practice'|'assessed'} props.mode
 * @param {{containmentId: string, finishedAnswer: 'yes'|'no'}|undefined} props.saved
 * @param {(answer: Object, result: Object) => void} props.onComplete
 */
export function RestoreService({ scenario, mode, saved, onComplete }) {
  const { containment } = scenario;
  const [containmentId, setContainmentId] = useState(saved?.containmentId ?? null);
  const [finishedAnswer, setFinishedAnswer] = useState(saved?.finishedAnswer ?? null);
  const { revealed, locked, submitStage } = useStageLock(mode);

  const chosen = containment.options.find((o) => o.id === containmentId);
  const canSubmitStage = Boolean(containmentId) && Boolean(finishedAnswer);

  function computeResult() {
    const containmentResult = scoreBinary(Boolean(chosen), 1);
    const finishedResult = scoreBinary(finishedAnswer === 'no', 1);
    return combineResults([containmentResult, finishedResult]);
  }

  function handleContinue() {
    if (!revealed) {
      submitStage();
      return;
    }
    onComplete({ containmentId, finishedAnswer }, computeResult());
  }

  return (
    <section className="stage">
      <h2 className="stage__title">Stage 2: Restore service</h2>
      <p>Choose how to restore service right now.</p>
      <ChoiceList
        options={containment.options.map((o) => ({ id: o.id, text: o.text, feedback: o.feedback }))}
        mode="single"
        selectedIds={containmentId ? [containmentId] : []}
        onChange={([id]) => setContainmentId(id)}
        showFeedback={revealed}
        isCorrect={(option) => containment.options.find((o) => o.id === option.id)?.best}
        disabled={locked}
      />

      {containmentId && (
        <>
          <h3>{containment.finishedQuestion}</h3>
          <ChoiceList
            options={[
              { id: 'yes', text: 'Yes, that\'s it done' },
              { id: 'no', text: 'No - this only restored service, it has not found the cause' },
            ]}
            mode="single"
            selectedIds={finishedAnswer ? [finishedAnswer] : []}
            onChange={([id]) => setFinishedAnswer(id)}
            showFeedback={revealed}
            isCorrect={(option) => option.id === 'no'}
            disabled={locked}
          />
          {revealed && finishedAnswer === 'yes' && (
            <FeedbackBanner kind="incorrect">{containment.prematureConsequence}</FeedbackBanner>
          )}
        </>
      )}

      <button type="button" className="button" disabled={!canSubmitStage} onClick={handleContinue}>
        {!revealed ? 'Submit stage' : 'Continue'}
      </button>
    </section>
  );
}
