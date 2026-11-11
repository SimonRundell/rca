import { useState } from 'react';
import { ChoiceList } from '../shared/ChoiceList.jsx';
import { FreeTextRubric } from '../shared/FreeTextRubric.jsx';
import { FeedbackBanner } from '../shared/FeedbackBanner.jsx';
import { useStageLock } from '../../hooks/useStageLock.js';
import { combineResults, scoreBinary } from '../../lib/scoring.js';

/**
 * Stage 6: Confirm the root cause. Choose a candidate, test it against
 * the handout's four criteria, then write it in your own words. If a
 * weak candidate was chosen, the criteria test visibly fails against it.
 *
 * @param {Object} props
 * @param {import('../../data/scenarios/wifi-b12.js').default} props.scenario
 * @param {'practice'|'assessed'} props.mode
 * @param {Object|undefined} props.saved
 * @param {(answer: Object, result: Object) => void} props.onComplete
 */
export function ConfirmRootCause({ scenario, mode, saved, onComplete }) {
  const { rootCause } = scenario;
  const [candidateId, setCandidateId] = useState(saved?.candidateId ?? null);
  const [criteriaAnswers, setCriteriaAnswers] = useState(saved?.criteriaAnswers ?? {});
  const [criteriaEvidence, setCriteriaEvidence] = useState(saved?.criteriaEvidence ?? {});
  const [statement, setStatement] = useState(saved?.statement);
  const { revealed, locked, submitStage } = useStageLock(mode);

  const candidate = rootCause.candidates.find((c) => c.id === candidateId);
  const isRoot = candidate?.type === 'root';

  const allCriteriaAnswered = rootCause.criteria.every((c) => criteriaAnswers[c.id]);
  const canSubmitStage = Boolean(candidate) && allCriteriaAnswered && Boolean(statement?.result);

  function expectedAnswer(criterion) {
    return isRoot && criterion.correctAnswerForRoot ? 'yes' : 'no';
  }

  function computeResult() {
    const candidateResult = scoreBinary(isRoot, 3);
    const criteriaResults = rootCause.criteria.map((criterion) => {
      const yesNo = scoreBinary(criteriaAnswers[criterion.id] === expectedAnswer(criterion), 1);
      if (!criterion.needsEvidence) return yesNo;
      const picked = criteriaEvidence[criterion.id] ?? [];
      const evidenceOk =
        expectedAnswer(criterion) === 'yes'
          ? picked.some((id) => criterion.supportingEvidenceIds.includes(id))
          : picked.length === 0;
      const evidenceResult = scoreBinary(evidenceOk, 1);
      return combineResults([yesNo, evidenceResult]);
    });
    const freeTextResult = { earned: statement.result.score * 3, possible: 3, details: [] };
    return combineResults([candidateResult, ...criteriaResults, freeTextResult]);
  }

  function handleContinue() {
    if (!revealed) {
      submitStage();
      return;
    }
    onComplete({ candidateId, criteriaAnswers, criteriaEvidence, statement }, computeResult());
  }

  return (
    <section className="stage">
      <h2 className="stage__title">Stage 6: Confirm the root cause</h2>

      <h3>1. Choose the root cause statement</h3>
      <ChoiceList
        options={rootCause.candidates.map((c) => ({ id: c.id, text: c.text, feedback: c.feedback }))}
        mode="single"
        selectedIds={candidateId ? [candidateId] : []}
        onChange={([id]) => setCandidateId(id)}
        showFeedback={revealed}
        isCorrect={(option) => rootCause.candidates.find((c) => c.id === option.id)?.type === 'root'}
        disabled={locked}
      />

      {candidate && (
        <>
          <h3>2. Test it against the four criteria</h3>
          {!isRoot && revealed && (
            <FeedbackBanner kind="incorrect">
              Watch what happens when you test this candidate against the criteria below - it will not hold up.
            </FeedbackBanner>
          )}
          {rootCause.criteria.map((criterion) => (
            <div key={criterion.id} className="criterion-row">
              <p className="criterion-row__question">{criterion.question}</p>
              <ChoiceList
                options={[{ id: 'yes', text: 'Yes' }, { id: 'no', text: 'No' }]}
                mode="single"
                selectedIds={criteriaAnswers[criterion.id] ? [criteriaAnswers[criterion.id]] : []}
                onChange={([id]) => setCriteriaAnswers((prev) => ({ ...prev, [criterion.id]: id }))}
                showFeedback={revealed}
                isCorrect={(option) => option.id === expectedAnswer(criterion)}
                disabled={locked}
              />
              {criterion.needsEvidence && criteriaAnswers[criterion.id] === 'yes' && (
                <>
                  <p className="criterion-row__subheading">Which evidence supports that?</p>
                  <ChoiceList
                    options={scenario.evidence.map((e) => ({ id: e.id, text: e.source }))}
                    mode="single"
                    selectedIds={criteriaEvidence[criterion.id] ?? []}
                    onChange={(ids) => setCriteriaEvidence((prev) => ({ ...prev, [criterion.id]: ids }))}
                    showFeedback={revealed}
                    isCorrect={(option) => criterion.supportingEvidenceIds?.includes(option.id)}
                    disabled={locked}
                  />
                </>
              )}
              {revealed && isRoot && criterion.needsEvidence && criteriaAnswers[criterion.id] === 'yes' && (
                <FeedbackBanner kind="info">
                  Supporting evidence: {scenario.evidence.find((e) => criterion.supportingEvidenceIds?.includes(e.id))?.source}
                </FeedbackBanner>
              )}
            </div>
          ))}

          <h3>3. Write it in your own words</h3>
          <FreeTextRubric
            promptDef={rootCause.statement}
            saved={statement}
            onChange={setStatement}
            revealModelAnswer={revealed}
            allowResubmit={mode === 'practice'}
          />
        </>
      )}

      <button type="button" className="button" disabled={!canSubmitStage} onClick={handleContinue}>
        {!revealed ? 'Submit stage' : 'Continue'}
      </button>
    </section>
  );
}
