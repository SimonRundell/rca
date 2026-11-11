import { useState } from 'react';
import { ChoiceList } from '../shared/ChoiceList.jsx';
import { FeedbackBanner } from '../shared/FeedbackBanner.jsx';
import { useStageLock } from '../../hooks/useStageLock.js';
import { combineResults, scoreBinary } from '../../lib/scoring.js';

/**
 * Stage 8: Verify and monitor. Choose two verification steps from six,
 * and one monitoring measure with a threshold.
 *
 * @param {Object} props
 * @param {import('../../data/scenarios/wifi-b12.js').default} props.scenario
 * @param {'practice'|'assessed'} props.mode
 * @param {{stepIds: string[], monitoringId: string}|undefined} props.saved
 * @param {(answer: Object, result: Object) => void} props.onComplete
 */
export function VerifyMonitor({ scenario, mode, saved, onComplete }) {
  const { verification } = scenario;
  const [stepIds, setStepIds] = useState(saved?.stepIds ?? []);
  const [monitoringId, setMonitoringId] = useState(saved?.monitoringId ?? null);
  const { revealed, locked, submitStage } = useStageLock(mode);

  const pickCount = verification.pickCount;
  const canSubmitStage = stepIds.length === pickCount && Boolean(monitoringId);

  function computeResult() {
    const correctCount = stepIds.filter((id) => verification.steps.find((s) => s.id === id)?.correct).length;
    const stepsResult = { earned: correctCount, possible: pickCount, details: [] };
    const monitoring = verification.monitoring.find((m) => m.id === monitoringId);
    const monitoringResult = scoreBinary(Boolean(monitoring?.correct), 1);
    return combineResults([stepsResult, monitoringResult]);
  }

  function handleContinue() {
    if (!revealed) {
      submitStage();
      return;
    }
    onComplete({ stepIds, monitoringId }, computeResult());
  }

  function handleStepsChange(newIds) {
    if (newIds.length <= pickCount) setStepIds(newIds);
  }

  return (
    <section className="stage">
      <h2 className="stage__title">Stage 8: Verify and monitor</h2>
      <h3>Choose {pickCount} verification steps</h3>
      {stepIds.length >= pickCount && !revealed && (
        <FeedbackBanner kind="info">You have picked {pickCount}. Deselect one to change your answer.</FeedbackBanner>
      )}
      <ChoiceList
        options={verification.steps.map((s) => ({ id: s.id, text: s.text, feedback: s.feedback }))}
        mode="multi"
        selectedIds={stepIds}
        onChange={handleStepsChange}
        showFeedback={revealed}
        isCorrect={(option) => verification.steps.find((s) => s.id === option.id)?.correct}
        disabled={locked}
      />

      <h3>Choose one monitoring measure</h3>
      <ChoiceList
        options={verification.monitoring.map((m) => ({ id: m.id, text: m.text, feedback: m.feedback }))}
        mode="single"
        selectedIds={monitoringId ? [monitoringId] : []}
        onChange={([id]) => setMonitoringId(id)}
        showFeedback={revealed}
        isCorrect={(option) => verification.monitoring.find((m) => m.id === option.id)?.correct}
        disabled={locked}
      />

      <button type="button" className="button" disabled={!canSubmitStage} onClick={handleContinue}>
        {!revealed ? 'Submit stage' : 'Continue'}
      </button>
    </section>
  );
}
