import { useState } from 'react';
import { ChoiceList } from '../shared/ChoiceList.jsx';
import { useStageLock } from '../../hooks/useStageLock.js';
import { combineResults, scoreBinary } from '../../lib/scoring.js';

/**
 * Stage 1: Define the problem. The student assembles a problem
 * statement from five slots (what, where, who, when, how often).
 *
 * @param {Object} props
 * @param {import('../../data/scenarios/wifi-b12.js').default} props.scenario
 * @param {'practice'|'assessed'} props.mode
 * @param {{selections: Object<string, string>}|undefined} props.saved
 * @param {(answer: Object, result: Object) => void} props.onComplete
 */
export function DefineProblem({ scenario, mode, saved, onComplete }) {
  const { slots } = scenario.problem;
  const [selections, setSelections] = useState(saved?.selections ?? {});
  const { revealed, locked, submitStage } = useStageLock(mode);

  const allAnswered = slots.every((slot) => selections[slot.id]);

  function fragmentFor(slot) {
    const id = selections[slot.id];
    return slot.options.find((o) => o.id === id);
  }

  const assembled = slots
    .map((slot) => fragmentFor(slot)?.text)
    .filter(Boolean)
    .join(', ');

  function computeResult() {
    const results = slots.map((slot) => scoreBinary(fragmentFor(slot)?.correct === true, 1));
    return combineResults(results);
  }

  function handleContinue() {
    if (!revealed) {
      submitStage();
      return;
    }
    onComplete({ selections }, computeResult());
  }

  return (
    <section className="stage">
      <h2 className="stage__title">Stage 1: Define the problem</h2>
      <p>Pick the strongest fragment for each slot. Some are vague, some are assumptions presented as fact.</p>

      {slots.map((slot) => (
        <div key={slot.id} className="problem-slot">
          <h3>{slot.label}</h3>
          <ChoiceList
            options={slot.options.map((o) => ({ id: o.id, text: o.text, feedback: o.feedback }))}
            mode="single"
            selectedIds={selections[slot.id] ? [selections[slot.id]] : []}
            onChange={([id]) => setSelections((prev) => ({ ...prev, [slot.id]: id }))}
            showFeedback={revealed}
            isCorrect={(option) => slot.options.find((o) => o.id === option.id)?.correct}
            disabled={locked}
          />
        </div>
      ))}

      <div className="problem-statement">
        <h3>Your problem statement</h3>
        <p className="problem-statement__text">{assembled || '—'}</p>
      </div>

      <button type="button" className="button" disabled={!allAnswered} onClick={handleContinue}>
        {!revealed ? 'Submit stage' : 'Continue'}
      </button>
    </section>
  );
}
