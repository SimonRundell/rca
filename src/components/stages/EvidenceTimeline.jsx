import { useMemo, useState } from 'react';
import { EvidenceCard } from '../shared/EvidenceCard.jsx';
import { ChoiceList } from '../shared/ChoiceList.jsx';
import { FeedbackBanner } from '../shared/FeedbackBanner.jsx';
import { useStageLock } from '../../hooks/useStageLock.js';
import { EVIDENCE_REQUEST_LIMIT } from '../../config.js';
import { combineResults, scoreBinary, scoreOrdering, scorePickEssentials } from '../../lib/scoring.js';

/**
 * Finds the change-tagged event with the latest position strictly
 * before the first symptom, in the scenario's true chronological order.
 * @param {import('../../data/scenarios/wifi-b12.js').default['timeline']} timeline
 * @param {string} firstSymptomEventId
 * @returns {string|null}
 */
function closestChangeBeforeSymptom(timeline, firstSymptomEventId) {
  const symptomIndex = timeline.findIndex((e) => e.id === firstSymptomEventId);
  let best = null;
  for (let i = 0; i < symptomIndex; i += 1) {
    if (timeline[i].isChange) best = timeline[i].id;
  }
  return best;
}

/**
 * Stage 3: Collect evidence and build the timeline.
 *
 * @param {Object} props
 * @param {import('../../data/scenarios/wifi-b12.js').default} props.scenario
 * @param {'practice'|'assessed'} props.mode
 * @param {string|null} props.destroyedEvidenceId  from the Stage 2 containment choice
 * @param {{requestedIds: string[], order: string[], changeEventId: string}|undefined} props.saved
 * @param {(answer: Object, result: Object) => void} props.onComplete
 */
export function EvidenceTimeline({ scenario, mode, destroyedEvidenceId, saved, onComplete }) {
  const [phase, setPhase] = useState(saved ? 'timeline' : 'evidence');
  const [requestedIds, setRequestedIds] = useState(saved?.requestedIds ?? []);
  const initialOrder = useMemo(() => shuffledIds(scenario.timeline), [scenario]);
  const [order, setOrder] = useState(saved?.order ?? initialOrder);
  const [changeEventId, setChangeEventId] = useState(saved?.changeEventId ?? null);
  const { revealed, locked, submitStage } = useStageLock(mode);

  const remaining = EVIDENCE_REQUEST_LIMIT - requestedIds.length;
  const availableEvidence = scenario.evidence.filter((e) => e.id !== destroyedEvidenceId);
  const destroyedEvidence = scenario.evidence.find((e) => e.id === destroyedEvidenceId);

  function handleRequest(id) {
    if (requestedIds.includes(id) || remaining <= 0) return;
    setRequestedIds((prev) => [...prev, id]);
  }

  function move(index, direction) {
    const next = [...order];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  }

  const correctChangeId = closestChangeBeforeSymptom(scenario.timeline, scenario.firstSymptomEventId);

  function computeResult() {
    const essentialIds = scenario.evidence.filter((e) => e.essential && e.id !== destroyedEvidenceId).map((e) => e.id);
    const evidenceResult = scorePickEssentials(requestedIds, essentialIds, { perEssential: 1, perIrrelevantPenalty: 0.5 });
    const correctOrder = scenario.timeline.map((e) => e.id);
    const orderingResult = scoreOrdering(order, correctOrder);
    const changeResult = scoreBinary(changeEventId === correctChangeId, 1);
    return combineResults([evidenceResult, orderingResult, changeResult]);
  }

  function finishEvidencePhase() {
    setPhase('timeline');
  }

  function handleContinue() {
    if (!revealed) {
      submitStage();
      return;
    }
    onComplete({ requestedIds, order, changeEventId }, computeResult());
  }

  if (phase === 'evidence') {
    return (
      <section className="stage">
        <h2 className="stage__title">Stage 3a: Collect evidence</h2>
        <p>
          You have {Math.max(0, remaining)} of {EVIDENCE_REQUEST_LIMIT} requests left. Choose carefully - not everything
          here is useful.
        </p>
        {destroyedEvidence && (
          <FeedbackBanner kind="info">
            {destroyedEvidence.source} is unavailable - it was destroyed by your Stage 2 choice.
          </FeedbackBanner>
        )}
        <div className="evidence-grid">
          {availableEvidence.map((evidence) => (
            <EvidenceCard
              key={evidence.id}
              evidence={evidence}
              opened={requestedIds.includes(evidence.id)}
              onRequest={() => handleRequest(evidence.id)}
            />
          ))}
        </div>
        <button type="button" className="button" disabled={requestedIds.length === 0} onClick={finishEvidencePhase}>
          Continue to the timeline
        </button>
      </section>
    );
  }

  const missedEssential = scenario.evidence.filter(
    (e) => e.essential && e.id !== destroyedEvidenceId && !requestedIds.includes(e.id),
  );

  return (
    <section className="stage">
      <h2 className="stage__title">Stage 3b: Build the timeline</h2>
      {missedEssential.length > 0 && (
        <FeedbackBanner kind="info">
          Released, since you ran out of requests: {missedEssential.map((e) => e.source).join(', ')}.
        </FeedbackBanner>
      )}
      <p>Put these events into chronological order using the timestamps in your evidence.</p>
      <ol className="timeline-list">
        {order.map((id, index) => {
          const event = scenario.timeline.find((e) => e.id === id);
          return (
            <li key={id} className="timeline-list__item">
              <span className="timeline-list__timestamp">{event.timestamp}</span>
              <span className="timeline-list__text">{event.text}</span>
              <span className="timeline-list__controls">
                <button type="button" className="button button--small" disabled={locked || index === 0} onClick={() => move(index, -1)} aria-label="Move earlier">
                  {'↑'}
                </button>
                <button type="button" className="button button--small" disabled={locked || index === order.length - 1} onClick={() => move(index, 1)} aria-label="Move later">
                  {'↓'}
                </button>
              </span>
            </li>
          );
        })}
      </ol>

      <h3>Which event is the change that sits closest before the first symptom?</h3>
      <ChoiceList
        options={scenario.timeline.map((e) => ({ id: e.id, text: `${e.timestamp} - ${e.text}` }))}
        mode="single"
        selectedIds={changeEventId ? [changeEventId] : []}
        onChange={([id]) => setChangeEventId(id)}
        showFeedback={revealed}
        isCorrect={(option) => option.id === correctChangeId}
        disabled={locked}
      />

      <button type="button" className="button" disabled={!changeEventId} onClick={handleContinue}>
        {!revealed ? 'Submit stage' : 'Continue'}
      </button>
    </section>
  );
}

/**
 * @param {Array<{id: string}>} timeline
 * @returns {string[]}
 */
function shuffledIds(timeline) {
  const ids = timeline.map((e) => e.id);
  for (let i = ids.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}
