import { useState } from 'react';
import { ChoiceList } from '../shared/ChoiceList.jsx';
import { FreeTextRubric } from '../shared/FreeTextRubric.jsx';
import { EvidenceCard } from '../shared/EvidenceCard.jsx';
import { StopOrContinue } from './StopOrContinue.jsx';
import { useStageLock } from '../../hooks/useStageLock.js';
import { scoreFiveWhysLevel } from '../../lib/scoring.js';

/**
 * One level of the 5 Whys chain: pick the next "why", link evidence (or
 * mark it a hypothesis), justify it, then decide whether to keep going.
 * Remounted (via a `key` on levelIndex) for every level, so each level
 * gets its own fresh Practice/Assessed reveal state.
 *
 * @param {Object} props
 * @param {import('../../data/scenarios/wifi-b12.js').WhyLevel} props.level
 * @param {string} props.currentStatement
 * @param {boolean} props.isLastLevel
 * @param {Array<import('../../data/scenarios/wifi-b12.js').Evidence>} props.collectedEvidence
 * @param {'practice'|'assessed'} props.mode
 * @param {(levelAnswer: Object, result: Object) => void} props.onLevelComplete
 */
export function WhyStep({ level, currentStatement, isLastLevel, collectedEvidence, mode, onLevelComplete }) {
  const [optionId, setOptionId] = useState(null);
  const [evidenceMode, setEvidenceMode] = useState('evidence'); // 'evidence' | 'hypothesis'
  const [evidenceId, setEvidenceId] = useState(null);
  const [justification, setJustification] = useState(undefined);
  const [decision, setDecision] = useState(null);
  const { revealed, locked, submitStage } = useStageLock(mode);

  const chosenOption = level.options.find((o) => o.id === optionId);
  const readyForDecision = Boolean(optionId) && (evidenceMode === 'hypothesis' || Boolean(evidenceId)) && Boolean(justification?.result);
  const canFinishLevel = readyForDecision && Boolean(decision);

  function handleSubmitLevel() {
    if (!revealed) {
      submitStage();
      return;
    }
  }

  function handleNext() {
    const levelAnswer = { optionId, evidenceMode, evidenceId, justification, decision };
    onLevelComplete(levelAnswer, scoreFiveWhysLevel(level, levelAnswer, isLastLevel));
  }

  return (
    <div className="why-step">
      <p className="why-step__statement">{currentStatement}</p>
      <h3>Why?</h3>
      <ChoiceList
        options={level.options.map((o) => ({ id: o.id, text: o.text, feedback: o.feedback }))}
        mode="single"
        selectedIds={optionId ? [optionId] : []}
        onChange={([id]) => setOptionId(id)}
        showFeedback={revealed}
        isCorrect={(option) => level.options.find((o) => o.id === option.id)?.tag === 'correct'}
        disabled={locked}
      />

      {optionId && (
        <>
          <h4>Which evidence supports this?</h4>
          <div className="evidence-picker">
            {collectedEvidence.length === 0 && <p>No evidence was collected for this - you can mark this as a hypothesis.</p>}
            <div className="evidence-grid evidence-grid--compact">
              {collectedEvidence.map((e) => (
                <EvidenceCard
                  key={e.id}
                  evidence={e}
                  opened
                  selectable={false}
                  selected={evidenceMode === 'evidence' && evidenceId === e.id}
                  onSelect={
                    locked
                      ? undefined
                      : () => {
                          setEvidenceMode('evidence');
                          setEvidenceId(e.id);
                        }
                  }
                />
              ))}
            </div>
            <button
              type="button"
              className={`button button--small${evidenceMode === 'hypothesis' ? ' button--selected' : ''}`}
              onClick={() => {
                setEvidenceMode('hypothesis');
                setEvidenceId(null);
              }}
              disabled={locked}
            >
              Mark as a hypothesis (no supporting evidence)
            </button>
            {revealed && chosenOption?.tag === 'correct' && (
              <p className="evidence-picker__feedback">
                {evidenceMode === 'hypothesis'
                  ? 'Labelled as a hypothesis - partial credit, and it will print as a hypothesis in the report.'
                  : level.supportingEvidenceIds.includes(evidenceId)
                    ? 'Right evidence for this link.'
                    : 'That evidence does not actually support this link - half credit.'}
              </p>
            )}
          </div>

          <h4>Justify the link</h4>
          <FreeTextRubric
            promptDef={level.justification}
            saved={justification}
            onChange={setJustification}
            revealModelAnswer={revealed}
            allowResubmit={mode === 'practice'}
          />
        </>
      )}

      {readyForDecision && (
        <StopOrContinue
          level={level}
          isLastLevel={isLastLevel}
          decision={decision}
          onDecide={setDecision}
          revealed={revealed}
          disabled={locked}
        />
      )}

      {readyForDecision && !revealed && (
        <button type="button" className="button" disabled={!decision} onClick={handleSubmitLevel}>
          Submit this level
        </button>
      )}
      {readyForDecision && revealed && (
        <button type="button" className="button" disabled={!canFinishLevel} onClick={handleNext}>
          {isLastLevel ? 'Finish the chain' : 'Ask why again'}
        </button>
      )}
    </div>
  );
}
