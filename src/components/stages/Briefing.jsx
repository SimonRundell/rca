import { useState } from 'react';
import { ChoiceList } from '../shared/ChoiceList.jsx';
import { FeedbackBanner } from '../shared/FeedbackBanner.jsx';
import { useStageLock } from '../../hooks/useStageLock.js';
import { combineResults, scoreBinary, scorePickEssentials } from '../../lib/scoring.js';

/**
 * Stage 0: Briefing. Shows the ticket and asks whether this warrants a
 * full RCA, with reasons selected from the handout's criteria.
 *
 * @param {Object} props
 * @param {import('../../data/scenarios/wifi-b12.js').default} props.scenario
 * @param {'practice'|'assessed'} props.mode
 * @param {{warrantsRca: boolean, reasonIds: string[]}|undefined} props.saved
 * @param {(answer: Object, result: Object) => void} props.onComplete
 */
export function Briefing({ scenario, mode, saved, onComplete }) {
  const { briefing } = scenario;
  const [warrantsRca, setWarrantsRca] = useState(saved?.warrantsRca ?? null);
  const [reasonIds, setReasonIds] = useState(saved?.reasonIds ?? []);
  const { revealed, locked, submitStage } = useStageLock(mode);

  const yesNoOptions = [
    { id: 'yes', text: 'Yes - this warrants a full RCA', feedback: briefing.correctWarrantsRca ? 'Correct.' : 'This does not meet the bar for a full RCA.' },
    { id: 'no', text: 'No - this does not warrant a full RCA', feedback: !briefing.correctWarrantsRca ? 'Correct.' : 'This does meet the bar for a full RCA.' },
  ];

  const canSubmitStage = warrantsRca !== null && reasonIds.length > 0;

  function computeResult() {
    const binary = scoreBinary(warrantsRca === (briefing.correctWarrantsRca ? 'yes' : 'no'), 2);
    const correctReasonIds = briefing.reasons.filter((r) => r.correct).map((r) => r.id);
    const reasonsResult = scorePickEssentials(reasonIds, correctReasonIds, { perEssential: 1, perIrrelevantPenalty: 0.5 });
    return combineResults([binary, reasonsResult]);
  }

  function handleContinue() {
    if (!revealed) {
      submitStage();
      return;
    }
    onComplete({ warrantsRca, reasonIds }, computeResult());
  }

  return (
    <section className="stage">
      <h2 className="stage__title">Stage 0: Briefing</h2>
      <div className="ticket">
        <p className="ticket__ref">Ticket {briefing.ticketRef} - logged {briefing.loggedAt}</p>
        <ul className="ticket__reports">
          {briefing.reports.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>

      <h3>{briefing.question}</h3>
      <ChoiceList
        options={yesNoOptions}
        mode="single"
        selectedIds={warrantsRca ? [warrantsRca] : []}
        onChange={([id]) => setWarrantsRca(id)}
        showFeedback={revealed}
        isCorrect={(option) => option.id === (briefing.correctWarrantsRca ? 'yes' : 'no')}
        disabled={locked}
      />

      <h3>Which of these apply? Select all that are relevant.</h3>
      <ChoiceList
        options={briefing.reasons.map((r) => ({ id: r.id, text: r.label }))}
        mode="multi"
        selectedIds={reasonIds}
        onChange={setReasonIds}
        showFeedback={revealed}
        isCorrect={(option) => briefing.reasons.find((r) => r.id === option.id)?.correct}
        disabled={locked}
      />

      {revealed && mode === 'assessed' && (
        <FeedbackBanner kind="info">Stage submitted. Review the feedback above, then continue.</FeedbackBanner>
      )}

      <button type="button" className="button" disabled={!canSubmitStage} onClick={handleContinue}>
        {!revealed ? 'Submit stage' : 'Continue'}
      </button>
    </section>
  );
}
