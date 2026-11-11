import { useState } from 'react';
import { FreeTextRubric } from '../shared/FreeTextRubric.jsx';
import { useStageLock } from '../../hooks/useStageLock.js';

/**
 * Stage 9: Document. No new decisions - the write-up itself is
 * assembled on the report page from the student's answers. One final
 * free-text lessons-learned note for a knowledge base article.
 *
 * @param {Object} props
 * @param {import('../../data/scenarios/wifi-b12.js').default} props.scenario
 * @param {'practice'|'assessed'} props.mode
 * @param {Object|undefined} props.saved
 * @param {(answer: Object, result: Object) => void} props.onComplete
 */
export function DocumentStage({ scenario, mode, saved, onComplete }) {
  const [lessonsLearned, setLessonsLearned] = useState(saved?.lessonsLearned);
  const { revealed, submitStage } = useStageLock(mode);

  const canFinish = Boolean(lessonsLearned?.result);

  function handleFinish() {
    if (!revealed) {
      submitStage();
      return;
    }
    const result = { earned: lessonsLearned.result.score * 2, possible: 2, details: [] };
    onComplete({ lessonsLearned }, result);
  }

  return (
    <section className="stage">
      <h2 className="stage__title">Stage 9: Document</h2>
      <p>
        Your answers from every stage will be assembled into a professional RCA write-up on the next page, ready to
        print or save as a PDF.
      </p>
      <h3>One last thing - write a lessons-learned note</h3>
      <FreeTextRubric
        promptDef={scenario.lessonsLearned}
        saved={lessonsLearned}
        onChange={setLessonsLearned}
        revealModelAnswer={revealed}
        allowResubmit={mode === 'practice'}
      />
      <button type="button" className="button" disabled={!canFinish} onClick={handleFinish}>
        {!revealed ? 'Submit stage' : 'Finish and view report'}
      </button>
    </section>
  );
}
