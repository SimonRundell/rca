import { ChoiceList } from '../shared/ChoiceList.jsx';

/**
 * Pass 1 (build): pick direct causes of the node from its cause pool.
 * @param {Object} props
 * @param {Array<{id: string, label: string, correct: boolean, feedback?: string}>} props.buildOptions
 * @param {string[]} props.selectedIds
 * @param {(ids: string[]) => void} props.onChange
 * @param {boolean} props.showFeedback
 * @param {boolean} [props.disabled]
 */
export function CausePool({ buildOptions, selectedIds, onChange, showFeedback, disabled }) {
  return (
    <div className="cause-pool">
      <h4>Which of these are direct causes of this node?</h4>
      <ChoiceList
        options={buildOptions.map((o) => ({ id: o.id, text: o.label, feedback: o.feedback }))}
        mode="multi"
        selectedIds={selectedIds}
        onChange={onChange}
        showFeedback={showFeedback}
        isCorrect={(option) => buildOptions.find((o) => o.id === option.id)?.correct}
        disabled={disabled}
      />
    </div>
  );
}
