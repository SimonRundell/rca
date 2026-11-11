import { useState } from 'react';
import { WhyStep } from './WhyStep.jsx';
import { combineResults, scoreFiveWhysLevel } from '../../lib/scoring.js';

/**
 * Container for the 5 Whys engine (section 8.1). Builds the chain one
 * level at a time - the student never sees the whole chain in advance.
 * Completed levels stack as a chain of cards once built.
 *
 * @param {Object} props
 * @param {import('../../data/scenarios/wifi-b12.js').default} props.scenario
 * @param {'practice'|'assessed'} props.mode
 * @param {string[]} props.collectedEvidenceIds
 * @param {Object[]|undefined} props.saved    completed level answers, if the chain was already finished
 * @param {(answer: Object[], result: Object) => void} props.onComplete
 */
export function WhyChain({ scenario, mode, collectedEvidenceIds, saved, onComplete }) {
  const { fiveWhys } = scenario;
  const [completedLevels, setCompletedLevels] = useState(saved && saved.length === fiveWhys.levels.length ? saved : []);
  const alreadyFinished = Boolean(saved && saved.length === fiveWhys.levels.length);

  const collectedEvidence = scenario.evidence.filter((e) => collectedEvidenceIds?.includes(e.id));

  function statementFor(levelIdx) {
    if (levelIdx === 0) return fiveWhys.startStatement;
    const previous = completedLevels[levelIdx - 1];
    return fiveWhys.levels[levelIdx - 1].options.find((o) => o.id === previous.optionId)?.text ?? fiveWhys.startStatement;
  }

  function handleLevelComplete(levelAnswer) {
    const next = [...completedLevels, levelAnswer];
    setCompletedLevels(next);
    if (next.length === fiveWhys.levels.length) {
      const allResults = next.map((answer, idx) => scoreFiveWhysLevel(fiveWhys.levels[idx], answer, idx === fiveWhys.levels.length - 1));
      onComplete(next, combineResults(allResults));
    }
  }

  function handleContinueFromSummary() {
    const allResults = completedLevels.map((answer, idx) =>
      scoreFiveWhysLevel(fiveWhys.levels[idx], answer, idx === fiveWhys.levels.length - 1),
    );
    onComplete(completedLevels, combineResults(allResults));
  }

  return (
    <div className="why-chain">
      {completedLevels.length > 0 && (
        <ol className="why-chain__completed">
          {completedLevels.map((answer, idx) => {
            const level = fiveWhys.levels[idx];
            const option = level.options.find((o) => o.id === answer.optionId);
            return (
              <li key={idx} className="why-chain__card">
                <p className="why-chain__statement">{statementFor(idx)}</p>
                <p className="why-chain__answer">
                  <strong>Why?</strong> {option?.text}
                  {answer.evidenceMode === 'hypothesis' && <span className="badge badge--hypothesis">Hypothesis</span>}
                </p>
                <p className="why-chain__justification">{answer.justification?.text}</p>
              </li>
            );
          })}
        </ol>
      )}

      {alreadyFinished ? (
        <button type="button" className="button" onClick={handleContinueFromSummary}>
          Continue
        </button>
      ) : completedLevels.length < fiveWhys.levels.length ? (
        <WhyStep
          key={completedLevels.length}
          level={fiveWhys.levels[completedLevels.length]}
          currentStatement={statementFor(completedLevels.length)}
          isLastLevel={completedLevels.length === fiveWhys.levels.length - 1}
          collectedEvidence={collectedEvidence}
          mode={mode}
          onLevelComplete={handleLevelComplete}
        />
      ) : null}
    </div>
  );
}
