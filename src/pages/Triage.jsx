import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout/Header.jsx';
import { ChoiceList } from '../components/shared/ChoiceList.jsx';
import { FeedbackBanner } from '../components/shared/FeedbackBanner.jsx';
import { paretoTask, triageCases } from '../data/triageCases.js';
import { useProgressActions, useProgressState } from '../context/ProgressContext.jsx';

/**
 * /triage - the "RCA, or not?" warm-up round, ending with a Pareto
 * ranking task (section 9.2). Unscored towards any scenario; gives
 * immediate feedback throughout.
 */
export function Triage() {
  const { triage } = useProgressState();
  const actions = useProgressActions();
  const [caseIndex, setCaseIndex] = useState(Object.keys(triage.answers).length < triageCases.length ? Object.keys(triage.answers).length : triageCases.length);

  if (caseIndex < triageCases.length) {
    const triageCase = triageCases[caseIndex];
    const saved = triage.answers[triageCase.id];
    return (
      <div className="page page--triage">
        <Header />
        <h1>Triage round</h1>
        <p>Case {caseIndex + 1} of {triageCases.length}</p>
        <TriageCaseCard
          triageCase={triageCase}
          saved={saved}
          onChange={(answer) => actions.setTriageAnswer(triageCase.id, answer)}
          onNext={() => setCaseIndex(caseIndex + 1)}
        />
      </div>
    );
  }

  return (
    <div className="page page--triage">
      <Header />
      <ParetoRound onFinish={() => actions.completeTriage()} />
    </div>
  );
}

function TriageCaseCard({ triageCase, saved, onChange, onNext }) {
  const warrantsRca = saved?.warrantsRca ?? null;
  const reasonIds = saved?.reasonIds ?? [];
  const answered = Boolean(warrantsRca);

  return (
    <section className="stage">
      <p className="ticket__report">{triageCase.scenario}</p>
      <h3>RCA, or no RCA?</h3>
      <ChoiceList
        options={[{ id: 'yes', text: 'RCA' }, { id: 'no', text: 'No RCA' }]}
        mode="single"
        selectedIds={warrantsRca ? [warrantsRca] : []}
        onChange={([id]) => onChange({ warrantsRca: id, reasonIds })}
        showFeedback={answered}
        isCorrect={(option) => option.id === (triageCase.correctWarrantsRca ? 'yes' : 'no')}
      />
      {answered && (
        <>
          <h4>Which reasons apply?</h4>
          <ChoiceList
            options={triageCase.reasons.map((r) => ({ id: r.id, text: r.label }))}
            mode="multi"
            selectedIds={reasonIds}
            onChange={(ids) => onChange({ warrantsRca, reasonIds: ids })}
            showFeedback
            isCorrect={(option) => triageCase.reasons.find((r) => r.id === option.id)?.correct}
          />
          <FeedbackBanner kind={warrantsRca === (triageCase.correctWarrantsRca ? 'yes' : 'no') ? 'correct' : 'incorrect'}>
            {triageCase.feedback}
          </FeedbackBanner>
          <button type="button" className="button" onClick={onNext}>
            Next case
          </button>
        </>
      )}
    </section>
  );
}

function ParetoRound({ onFinish }) {
  const { triage } = useProgressState();
  const actions = useProgressActions();
  const [order, setOrder] = useState(
    triage.pareto?.order ?? paretoTask.categories.map((c) => c.id),
  );
  const [submitted, setSubmitted] = useState(Boolean(triage.pareto));

  function move(index, direction) {
    const next = [...order];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  }

  function handleSubmit() {
    actions.setTriagePareto({ order });
    setSubmitted(true);
  }

  const correctOrder = [...paretoTask.categories].sort((a, b) => b.count - a.count).map((c) => c.id);

  return (
    <section className="stage">
      <h2>Pareto ranking</h2>
      <p>{paretoTask.prompt}</p>
      <ol className="timeline-list">
        {order.map((id, index) => {
          const category = paretoTask.categories.find((c) => c.id === id);
          return (
            <li key={id} className="timeline-list__item">
              <span className="timeline-list__text">{category.label}</span>
              <span className="timeline-list__controls">
                <button type="button" className="button button--small" disabled={submitted || index === 0} onClick={() => move(index, -1)} aria-label="Move up">
                  {'↑'}
                </button>
                <button type="button" className="button button--small" disabled={submitted || index === order.length - 1} onClick={() => move(index, 1)} aria-label="Move down">
                  {'↓'}
                </button>
              </span>
            </li>
          );
        })}
      </ol>
      {!submitted && (
        <button type="button" className="button" onClick={handleSubmit}>
          Submit ranking
        </button>
      )}
      {submitted && (
        <>
          <p>Actual order by frequency: {correctOrder.map((id) => paretoTask.categories.find((c) => c.id === id).label).join(' > ')}</p>
          <FeedbackBanner kind="info">{paretoTask.feedback}</FeedbackBanner>
          <button type="button" className="button" onClick={onFinish}>
            Finish triage round
          </button>
          <p><Link to="/">Back home</Link></p>
        </>
      )}
    </section>
  );
}
