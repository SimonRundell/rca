import { ChoiceList } from '../shared/ChoiceList.jsx';
import { FeedbackBanner } from '../shared/FeedbackBanner.jsx';

/**
 * The "keep asking, or stop here?" decision asked at every level
 * (section 8.1). Tests whether the student stops at a tempting but
 * premature level.
 *
 * @param {Object} props
 * @param {import('../../data/scenarios/wifi-b12.js').WhyLevel} props.level
 * @param {boolean} props.isLastLevel
 * @param {string|null} props.decision
 * @param {(decision: string) => void} props.onDecide
 * @param {boolean} props.revealed
 * @param {boolean} props.disabled
 */
export function StopOrContinue({ level, isLastLevel, decision, onDecide, revealed, disabled }) {
  const correctDecision = isLastLevel ? 'stop' : 'continue';
  const options = [
    { id: 'continue', text: 'Keep asking why' },
    { id: 'stop', text: 'Stop here - this is the root cause' },
  ];

  return (
    <div className="stop-or-continue">
      <h4>Keep asking, or stop here?</h4>
      <ChoiceList
        options={options}
        mode="single"
        selectedIds={decision ? [decision] : []}
        onChange={([id]) => onDecide(id)}
        showFeedback={revealed}
        isCorrect={(option) => option.id === correctDecision}
        disabled={disabled}
      />
      {revealed && decision === 'stop' && !isLastLevel && (
        <FeedbackBanner kind="incorrect">
          {level.stopsTooEarly
            ? level.stopFeedback
            : 'There is more to find here - the evidence points to a deeper cause. Keep going.'}
        </FeedbackBanner>
      )}
      {revealed && decision === 'continue' && isLastLevel && (
        <FeedbackBanner kind="incorrect">
          This is as far as the evidence takes this chain - time to stop and confirm the root cause.
        </FeedbackBanner>
      )}
    </div>
  );
}
