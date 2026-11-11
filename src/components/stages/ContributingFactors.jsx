import { useState } from 'react';
import { ChoiceList } from '../shared/ChoiceList.jsx';
import { useStageLock } from '../../hooks/useStageLock.js';
import { combineResults, scoreClassification } from '../../lib/scoring.js';

const CATEGORY_OPTIONS = [
  { id: 'contributing', text: 'Contributing factor' },
  { id: 'notRelevant', text: 'Not relevant' },
  { id: 'possibleRootCause', text: 'Possible root cause - needs investigation' },
];

const FISHBONE_OPTIONS = [
  { id: 'people', text: 'People' },
  { id: 'process', text: 'Process' },
  { id: 'technology', text: 'Technology' },
  { id: 'environment', text: 'Environment' },
  { id: 'policy', text: 'Policy' },
  { id: 'supplier', text: 'Supplier' },
];

/**
 * Stage 4: Contributing factors. Each candidate factor is tagged, plus
 * a lightly-weighted optional fishbone category sort.
 *
 * @param {Object} props
 * @param {import('../../data/scenarios/wifi-b12.js').default} props.scenario
 * @param {'practice'|'assessed'} props.mode
 * @param {{categories: Object<string, string>, fishbone: Object<string, string>}|undefined} props.saved
 * @param {(answer: Object, result: Object) => void} props.onComplete
 */
export function ContributingFactors({ scenario, mode, saved, onComplete }) {
  const { factors } = scenario;
  const [categories, setCategories] = useState(saved?.categories ?? {});
  const [fishbone, setFishbone] = useState(saved?.fishbone ?? {});
  const { revealed, locked, submitStage } = useStageLock(mode);

  const hasFishbone = factors.some((f) => f.fishboneCategory);
  const allCategorised = factors.every((f) => categories[f.id]);
  const allFishboned = !hasFishbone || factors.every((f) => fishbone[f.id]);

  function computeResult() {
    const correctCategories = Object.fromEntries(factors.map((f) => [f.id, f.category]));
    const categoryResult = scoreClassification(factors, categories, correctCategories);
    if (!hasFishbone) return categoryResult;
    const fishboneFactors = factors.filter((f) => f.fishboneCategory);
    const correctFishbone = Object.fromEntries(fishboneFactors.map((f) => [f.id, f.fishboneCategory]));
    const fishboneCorrectCount = fishboneFactors.filter((f) => fishbone[f.id] === correctFishbone[f.id]).length;
    const fishboneResult = {
      earned: fishboneCorrectCount * 0.5,
      possible: fishboneFactors.length * 0.5,
      details: [`Fishbone sort: ${fishboneCorrectCount} of ${fishboneFactors.length} correct`],
    };
    return combineResults([categoryResult, fishboneResult]);
  }

  function handleContinue() {
    if (!revealed) {
      submitStage();
      return;
    }
    onComplete({ categories, fishbone }, computeResult());
  }

  return (
    <section className="stage">
      <h2 className="stage__title">Stage 4: Contributing factors</h2>
      <p>Tag each candidate factor.</p>
      {factors.map((factor) => (
        <div key={factor.id} className="factor-row">
          <p className="factor-row__text">{factor.text}</p>
          <ChoiceList
            options={CATEGORY_OPTIONS.map((o) => ({ ...o, feedback: categories[factor.id] === o.id ? factor.feedback : undefined }))}
            mode="single"
            selectedIds={categories[factor.id] ? [categories[factor.id]] : []}
            onChange={([id]) => setCategories((prev) => ({ ...prev, [factor.id]: id }))}
            showFeedback={revealed}
            isCorrect={(option) => option.id === factor.category}
            disabled={locked}
          />
          {hasFishbone && factor.fishboneCategory && (
            <>
              <p className="factor-row__subheading">Which fishbone category?</p>
              <ChoiceList
                options={FISHBONE_OPTIONS}
                mode="single"
                selectedIds={fishbone[factor.id] ? [fishbone[factor.id]] : []}
                onChange={([id]) => setFishbone((prev) => ({ ...prev, [factor.id]: id }))}
                showFeedback={revealed}
                isCorrect={(option) => option.id === factor.fishboneCategory}
                disabled={locked}
              />
            </>
          )}
        </div>
      ))}

      <button type="button" className="button" disabled={!allCategorised || !allFishboned} onClick={handleContinue}>
        {!revealed ? 'Submit stage' : 'Continue'}
      </button>
    </section>
  );
}
