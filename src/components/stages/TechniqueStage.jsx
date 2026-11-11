import { useState } from 'react';
import { WhyChain } from '../fivewhys/WhyChain.jsx';
import { FaultTree } from '../fta/FaultTree.jsx';
import { FeedbackBanner } from '../shared/FeedbackBanner.jsx';
import { combineResults } from '../../lib/scoring.js';

/**
 * Stage 5: Apply the RCA technique. Delegates to the 5 Whys engine, the
 * fault tree engine, or both in sequence for the capstone scenario
 * (section 8).
 *
 * @param {Object} props
 * @param {import('../../data/scenarios/wifi-b12.js').default} props.scenario
 * @param {'practice'|'assessed'} props.mode
 * @param {string[]} props.collectedEvidenceIds
 * @param {{fta?: Object, fiveWhys?: Object}|undefined} props.saved
 * @param {(answer: Object, result: Object) => void} props.onComplete
 */
export function TechniqueStage({ scenario, mode, collectedEvidenceIds, saved, onComplete }) {
  const [ftaDone, setFtaDone] = useState(saved?.fta);

  if (scenario.technique === 'fiveWhys') {
    return (
      <section className="stage">
        <h2 className="stage__title">Stage 5: Apply the technique - 5 Whys</h2>
        <WhyChain
          scenario={scenario}
          mode={mode}
          collectedEvidenceIds={collectedEvidenceIds}
          saved={saved?.fiveWhys}
          onComplete={(answer, result) => onComplete({ fiveWhys: answer }, result)}
        />
      </section>
    );
  }

  if (scenario.technique === 'fta') {
    return (
      <section className="stage">
        <h2 className="stage__title">Stage 5: Apply the technique - Fault Tree Analysis</h2>
        <FaultTree
          scenario={scenario}
          mode={mode}
          collectedEvidenceIds={collectedEvidenceIds}
          saved={saved?.fta}
          onComplete={(answer, result) => onComplete({ fta: answer }, result)}
        />
      </section>
    );
  }

  // technique === 'both': FTA narrows it down, then 5 Whys goes deeper.
  if (!ftaDone) {
    return (
      <section className="stage">
        <h2 className="stage__title">Stage 5a: Apply the technique - Fault Tree Analysis</h2>
        <p>Use FTA first to narrow down which branch of the system is actually responsible.</p>
        <FaultTree
          scenario={scenario}
          mode={mode}
          collectedEvidenceIds={collectedEvidenceIds}
          saved={saved?.fta}
          onComplete={(answer, result) => setFtaDone({ answer, result })}
        />
      </section>
    );
  }

  return (
    <section className="stage">
      <h2 className="stage__title">Stage 5b: Apply the technique - 5 Whys</h2>
      <FeedbackBanner kind="info">FTA narrowed the cause down - now dig deeper with 5 Whys.</FeedbackBanner>
      <WhyChain
        scenario={scenario}
        mode={mode}
        collectedEvidenceIds={collectedEvidenceIds}
        saved={saved?.fiveWhys}
        onComplete={(fiveWhysAnswer, fiveWhysResult) =>
          onComplete(
            { fta: ftaDone.answer, fiveWhys: fiveWhysAnswer },
            combineResults([ftaDone.result, fiveWhysResult]),
          )
        }
      />
    </section>
  );
}
