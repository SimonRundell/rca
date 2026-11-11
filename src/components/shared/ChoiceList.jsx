import { FeedbackBanner } from './FeedbackBanner.jsx';

/**
 * A list of selectable options, used for every choice-based decision in
 * the app (single or multiple selection). Fully keyboard operable - it
 * is a list of real buttons/checkboxes, never a drag target.
 *
 * @param {Object} props
 * @param {Array<{id: string, text: string, feedback?: string}>} props.options
 * @param {'single'|'multi'} props.mode
 * @param {string[]} props.selectedIds
 * @param {(ids: string[]) => void} props.onChange
 * @param {boolean} [props.showFeedback]   when true, each selected option shows its feedback
 * @param {(option: Object) => boolean} [props.isCorrect]  used to style options once feedback is shown
 * @param {boolean} [props.disabled]
 */
export function ChoiceList({ options, mode, selectedIds, onChange, showFeedback, isCorrect, disabled }) {
  function toggle(id) {
    if (disabled) return;
    if (mode === 'single') {
      onChange([id]);
    } else {
      onChange(selectedIds.includes(id) ? selectedIds.filter((s) => s !== id) : [...selectedIds, id]);
    }
  }

  return (
    <ul className="choice-list" role={mode === 'single' ? 'radiogroup' : 'group'}>
      {options.map((option) => {
        const selected = selectedIds.includes(option.id);
        const correct = showFeedback && isCorrect ? isCorrect(option) : null;
        const stateClass = showFeedback && selected ? (correct ? ' choice--correct' : ' choice--incorrect') : '';
        return (
          <li key={option.id} className="choice-list__item">
            <button
              type="button"
              className={`choice${selected ? ' choice--selected' : ''}${stateClass}`}
              role={mode === 'single' ? 'radio' : 'checkbox'}
              aria-checked={selected}
              disabled={disabled}
              onClick={() => toggle(option.id)}
            >
              <span className="choice__marker" aria-hidden="true">
                {mode === 'single' ? (selected ? '◉' : '○') : selected ? '☑' : '☐'}
              </span>
              <span className="choice__text">{option.text}</span>
            </button>
            {showFeedback && selected && option.feedback && (
              <FeedbackBanner kind={correct === false ? 'incorrect' : 'correct'}>{option.feedback}</FeedbackBanner>
            )}
          </li>
        );
      })}
    </ul>
  );
}
