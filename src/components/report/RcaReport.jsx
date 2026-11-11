import { ReportSection } from './ReportSection.jsx';
import { STAGE_TITLES, STAGE_WEIGHTS, bandForPercent } from '../../config.js';
import { percentFromResult, scoreOrdering, weightedOverallPercent } from '../../lib/scoring.js';

/**
 * The printable RCA report: the student's own answers laid out in the
 * handout's nine-section professional format, followed by the analysis
 * record and the marking summary (section 11).
 *
 * @param {Object} props
 * @param {import('../../data/scenarios/wifi-b12.js').default} props.scenario
 * @param {import('../../context/ProgressContext.jsx').ScenarioProgress} props.progress
 * @param {{name: string, group: string}} props.student
 */
export function RcaReport({ scenario, progress, student }) {
  const a = progress.answers;
  const briefing = a['0'];
  const problem = a['1'];
  const containment = a['2'];
  const evidenceTimeline = a['3'];
  const factors = a['4'];
  const technique = a['5'];
  const rootCause = a['6'];
  const actions = a['7'];
  const verification = a['8'];
  const document = a['9'];

  const problemStatement = problem
    ? scenario.problem.slots
        .map((slot) => slot.options.find((o) => o.id === problem.selections[slot.id])?.text)
        .filter(Boolean)
        .join(', ')
    : '';

  const chosenReasons = briefing
    ? scenario.briefing.reasons.filter((r) => briefing.reasonIds.includes(r.id)).map((r) => r.label)
    : [];

  const chosenContainment = containment && scenario.containment.options.find((o) => o.id === containment.containmentId);

  const orderingResult = evidenceTimeline
    ? scoreOrdering(evidenceTimeline.order, scenario.timeline.map((e) => e.id))
    : null;

  const chosenCandidate = rootCause && scenario.rootCause.candidates.find((c) => c.id === rootCause.candidateId);

  const total = Math.round(weightedOverallPercent(progress.stageResults, STAGE_WEIGHTS));
  const band = bandForPercent(total);

  return (
    <article className="rca-report">
      <header className="rca-report__header">
        <h1>RCA Report: {scenario.title}</h1>
        <dl className="rca-report__meta">
          <div><dt>Student</dt><dd>{student.name || '—'}</dd></div>
          <div><dt>Group</dt><dd>{student.group || '—'}</dd></div>
          <div><dt>Mode</dt><dd>{progress.mode === 'assessed' ? `Assessed (attempt ${progress.attempt})` : 'Practice'}</dd></div>
          <div><dt>Completed</dt><dd>{progress.completedAt ? new Date(progress.completedAt).toLocaleString() : '—'}</dd></div>
        </dl>
      </header>

      <ReportSection title="1. Incident summary">
        <p>{problemStatement || 'Not completed.'}</p>
      </ReportSection>

      <ReportSection title="2. Impact assessment">
        <p>Ticket {scenario.briefing.ticketRef}, logged {scenario.briefing.loggedAt}.</p>
        <p>Warrants RCA: {briefing?.warrantsRca === 'yes' ? 'Yes' : 'No'}.</p>
        <ul>{chosenReasons.map((r) => <li key={r}>{r}</li>)}</ul>
      </ReportSection>

      <ReportSection title="3. Timeline">
        <ol>
          {evidenceTimeline?.order.map((id) => {
            const event = scenario.timeline.find((e) => e.id === id);
            return <li key={id}>{event.timestamp} - {event.text}</li>;
          })}
        </ol>
        {orderingResult && (
          <p>{orderingResult.earned} of {orderingResult.possible} events in a correctly ordered run.</p>
        )}
      </ReportSection>

      <ReportSection title="4. Detection and response">
        <p>{chosenContainment?.text}</p>
        <p>RCA considered finished immediately after restoring service: {containment?.finishedAnswer === 'yes' ? 'Yes' : 'No'}.</p>
      </ReportSection>

      <ReportSection title="5. Root cause">
        <p><strong>Candidate chosen:</strong> {chosenCandidate?.text}</p>
        <ul>
          {rootCause &&
            scenario.rootCause.criteria.map((c) => (
              <li key={c.id}>
                {c.question} - {rootCause.criteriaAnswers[c.id] === 'yes' ? 'Yes' : 'No'}
              </li>
            ))}
        </ul>
        <p><strong>Statement (in the student's own words):</strong> {rootCause?.statement?.text}</p>
      </ReportSection>

      <ReportSection title="6. Contributing factors">
        <ul>
          {factors &&
            scenario.factors.map((f) => (
              <li key={f.id}>{f.text} - tagged: {factors.categories[f.id]}</li>
            ))}
        </ul>
      </ReportSection>

      <ReportSection title="7. Corrective actions">
        <ul>
          {actions &&
            scenario.actions
              .filter((act) => actions.categories[act.id] === 'corrective')
              .map((act) => <li key={act.id}>{act.text}</li>)}
        </ul>
      </ReportSection>

      <ReportSection title="8. Preventative actions">
        <ul>
          {actions &&
            scenario.actions
              .filter((act) => actions.categories[act.id] === 'preventative')
              .map((act) => <li key={act.id}>{act.text}</li>)}
        </ul>
        <p>{actions?.explanation?.text}</p>
      </ReportSection>

      <ReportSection title="9. Verification">
        <ul>
          {verification &&
            verification.stepIds.map((id) => <li key={id}>{scenario.verification.steps.find((s) => s.id === id)?.text}</li>)}
        </ul>
        <p>
          Monitoring: {verification && scenario.verification.monitoring.find((m) => m.id === verification.monitoringId)?.text}
        </p>
      </ReportSection>

      <ReportSection title="Analysis record">
        <AnalysisRecord scenario={scenario} technique={technique} />
      </ReportSection>

      {document?.lessonsLearned && (
        <ReportSection title="Lessons learned">
          <p>{document.lessonsLearned.text}</p>
        </ReportSection>
      )}

      <ReportSection title="Marking summary">
        <table className="marking-table">
          <thead>
            <tr><th>Stage</th><th>Score</th><th>Percent</th></tr>
          </thead>
          <tbody>
            {Object.entries(STAGE_WEIGHTS).map(([stageIndex, weight]) => {
              const result = progress.stageResults[stageIndex];
              if (!result) return null;
              return (
                <tr key={stageIndex}>
                  <td>{STAGE_TITLES[stageIndex]} ({weight}%)</td>
                  <td>{Math.round(result.earned * 10) / 10} / {result.possible}</td>
                  <td>{Math.round(percentFromResult(result))}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="marking-table__total">
          Total: {total}% - {band}
        </p>
      </ReportSection>
    </article>
  );
}

/**
 * Renders the full 5 Whys chain, the fault tree as built, or both, with
 * evidence, justifications and hypothesis labels exactly as built.
 */
function AnalysisRecord({ scenario, technique }) {
  if (!technique) return <p>Not completed.</p>;
  return (
    <>
      {technique.fta && (
        <div className="analysis-record__fta">
          <h3>Fault Tree Analysis</h3>
          <ul>
            {Object.entries(technique.fta.verdicts).map(([nodeId, v]) => (
              <li key={nodeId}>{scenario.faultTree.nodes[nodeId].label}: {v.verdict}</li>
            ))}
          </ul>
          <p>{technique.fta.explanation?.text}</p>
        </div>
      )}
      {technique.fiveWhys && (
        <div className="analysis-record__fivewhys">
          <h3>5 Whys</h3>
          <ol>
            {technique.fiveWhys.map((levelAnswer, idx) => {
              const level = scenario.fiveWhys.levels[idx];
              const option = level.options.find((o) => o.id === levelAnswer.optionId);
              return (
                <li key={idx}>
                  <strong>{option?.text}</strong>
                  {levelAnswer.evidenceMode === 'hypothesis' ? ' (hypothesis)' : ''}
                  <br />
                  {levelAnswer.justification?.text}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </>
  );
}
