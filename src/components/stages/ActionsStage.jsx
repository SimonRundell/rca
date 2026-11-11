import { useState } from 'react';
import { ChoiceList } from '../shared/ChoiceList.jsx';
import { FreeTextRubric } from '../shared/FreeTextRubric.jsx';
import { useStageLock } from '../../hooks/useStageLock.js';
import { combineResults, scoreClassification } from '../../lib/scoring.js';

const CATEGORY_OPTIONS = [
  { id: 'corrective', text: 'Corrective' },
  { id: 'preventative', text: 'Preventative' },
  { id: 'notAppropriate', text: 'Not appropriate' },
];

/**
 * Stage 7: Corrective and preventative actions.
 *
 * @param {Object} props
 * @param {import('../../data/scenarios/wifi-b12.js').default} props.scenario
 * @param {'practice'|'assessed'} props.mode
 * @param {Object|undefined} props.saved
 * @param {(answer: Object, result: Object) => void} props.onComplete
 */
export function ActionsStage({ scenario, mode, saved, onComplete }) {
  const { actions, chooseOnePreventative } = scenario;
  const [categories, setCategories] = useState(saved?.categories ?? {});
  const [explanation, setExplanation] = useState(saved?.explanation);
  const { revealed, locked, submitStage } = useStageLock(mode);

  const allCategorised = actions.every((a) => categories[a.id]);
  const canSubmitStage = allCategorised && Boolean(explanation?.result);

  function computeResult() {
    const correctCategories = Object.fromEntries(actions.map((a) => [a.id, a.category]));
    const sortResult = scoreClassification(actions, categories, correctCategories);
    const freeTextResult = { earned: explanation.result.score * 2, possible: 2, details: [] };
    return combineResults([sortResult, freeTextResult]);
  }

  function handleContinue() {
    if (!revealed) {
      submitStage();
      return;
    }
    onComplete({ categories, explanation }, computeResult());
  }

  return (
    <section className="stage">
      <h2 className="stage__title">Stage 7: Corrective and preventative actions</h2>
      <p>Sort each action.</p>
      {actions.map((action) => (
        <div key={action.id} className="factor-row">
          <p className="factor-row__text">{action.text}</p>
          <ChoiceList
            options={CATEGORY_OPTIONS.map((o) => ({ ...o, feedback: categories[action.id] === o.id ? action.feedback : undefined }))}
            mode="single"
            selectedIds={categories[action.id] ? [categories[action.id]] : []}
            onChange={([id]) => setCategories((prev) => ({ ...prev, [action.id]: id }))}
            showFeedback={revealed}
            isCorrect={(option) => option.id === action.category}
            disabled={locked}
          />
        </div>
      ))}

      <h3>Now explain your choice</h3>
      <FreeTextRubric
        promptDef={chooseOnePreventative}
        saved={explanation}
        onChange={setExplanation}
        revealModelAnswer={revealed}
        allowResubmit={mode === 'practice'}
      />

      <button type="button" className="button" disabled={!canSubmitStage} onClick={handleContinue}>
        {!revealed ? 'Submit stage' : 'Continue'}
      </button>
    </section>
  );
}
