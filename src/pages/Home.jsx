import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { scenarios } from '../data/scenarios/index.js';
import { useProgressActions, useProgressState } from '../context/ProgressContext.jsx';
import { Dialog } from '../components/shared/Dialog.jsx';
import { ProgressBar } from '../components/shared/ProgressBar.jsx';
import { Header } from '../components/layout/Header.jsx';
import { APP_TITLE, STAGE_WEIGHTS, bandForPercent } from '../config.js';
import { weightedOverallPercent } from '../lib/scoring.js';

const MAX_DIFFICULTY = 3;

const DOMAIN_LABELS = { support: 'Support', development: 'Development' };

const TECHNIQUE_LABELS = { both: 'FTA then 5 Whys', fta: 'Fault Tree Analysis', fiveWhys: '5 Whys' };

/** @param {string} band */
function toneForBand(band) {
  if (band === 'Strong') return 'success';
  if (band === 'Developing') return 'warn';
  return 'accent';
}

/** @param {number} value 1-3 */
function DifficultyDots({ value }) {
  return (
    <span className="difficulty-dots" role="img" aria-label={`Difficulty ${value} of ${MAX_DIFFICULTY}`}>
      {Array.from({ length: MAX_DIFFICULTY }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`difficulty-dots__dot${i < value ? ' difficulty-dots__dot--filled' : ''}`}
        />
      ))}
    </span>
  );
}

/**
 * Home: a progress dashboard. Name entry, an at-a-glance summary of
 * how the student is doing across all scenarios, and the scenario
 * catalogue as a grid of status cards rather than a plain list.
 */
export function Home() {
  const state = useProgressState();
  const actions = useProgressActions();
  const navigate = useNavigate();
  const [name, setName] = useState(state.student.name);
  const [group, setGroup] = useState(state.student.group);
  const [modeByScenario, setModeByScenario] = useState({});
  const [resetOpen, setResetOpen] = useState(false);

  function handleStart(scenarioId) {
    const mode = modeByScenario[scenarioId] ?? 'practice';
    actions.setStudent({ name, group });
    actions.startScenario(scenarioId, mode);
    navigate(`/scenario/${scenarioId}`);
  }

  function handleRestart(scenarioId) {
    const progress = state.scenarios[scenarioId];
    actions.setStudent({ name, group });
    actions.restartScenario(scenarioId, progress.mode);
    navigate(`/scenario/${scenarioId}`);
  }

  const scenarioStats = scenarios.map((scenario) => {
    const progress = state.scenarios[scenario.id];
    const percent =
      progress?.status === 'complete' ? Math.round(weightedOverallPercent(progress.stageResults, STAGE_WEIGHTS)) : null;
    return { scenario, progress, percent };
  });

  const completedCount = scenarioStats.filter((s) => s.progress?.status === 'complete').length;
  const inProgressCount = scenarioStats.filter((s) => s.progress && s.progress.status !== 'complete').length;
  const completedPercents = scenarioStats.filter((s) => s.percent !== null).map((s) => s.percent);
  const averagePercent =
    completedPercents.length > 0 ? Math.round(completedPercents.reduce((a, b) => a + b, 0) / completedPercents.length) : null;
  const overallPercent = (completedCount / scenarios.length) * 100;

  const recommended =
    scenarioStats.find((s) => !s.progress) ?? scenarioStats.find((s) => s.progress && s.progress.status !== 'complete');

  return (
    <div className="page page--home">
      <Header />

      <section className="dashboard-hero">
        <div className="dashboard-hero__intro">
          <p className="dashboard-hero__eyebrow">Root cause analysis practice</p>
          <h1>{APP_TITLE}</h1>
          <p className="intro">
            Work through realistic incidents and build your root cause analysis skills, decision by decision. New
            here? Start with the technique primer or the triage round below.
          </p>
          <div className="dashboard-hero__links">
            <Link to="/learn" className="button button--secondary">
              Technique primer
            </Link>
            <Link to="/triage" className="button button--secondary">
              Triage round
            </Link>
          </div>
        </div>

        <div className="dashboard-stats" aria-label="Your progress overview">
          <div className="stat-card">
            <span className="stat-card__value">
              {completedCount}/{scenarios.length}
            </span>
            <span className="stat-card__label">Scenarios complete</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{averagePercent !== null ? `${averagePercent}%` : '—'}</span>
            <span className="stat-card__label">Average score</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{inProgressCount}</span>
            <span className="stat-card__label">In progress</span>
          </div>
          <div className="stat-card stat-card--wide">
            <span className="stat-card__label">Overall progress</span>
            <ProgressBar percent={overallPercent} label={`${completedCount} of ${scenarios.length} scenarios complete`} />
          </div>
        </div>
      </section>

      <section className="student-details panel">
        <h2>Your details</h2>
        <div>
          <label htmlFor="student-name">Name</label>
          <input id="student-name" value={name} onChange={(e) => setName(e.target.value)} />
          <label htmlFor="student-group">Class</label>
          <input id="student-group" value={group} onChange={(e) => setGroup(e.target.value)} />
        </div>
      </section>

      <section className="scenario-dashboard">
        <div className="scenario-dashboard__header">
          <h2>Scenarios</h2>
          <p className="scenario-dashboard__hint">
            {recommended
              ? `Ordered by difficulty - suggested next: ${recommended.scenario.title}.`
              : 'Ordered by difficulty - every scenario is complete. Nice work.'}
          </p>
        </div>

        <ul className="scenario-grid">
          {scenarioStats.map(({ scenario, progress, percent }) => {
            const band = percent !== null ? bandForPercent(percent) : null;
            const isRecommended = recommended?.scenario.id === scenario.id;
            return (
              <li key={scenario.id} className={`scenario-card${isRecommended ? ' scenario-card--recommended' : ''}`}>
                <div className="scenario-card__top">
                  <h3>{scenario.title}</h3>
                  {isRecommended && <span className="badge badge--accent">Start here</span>}
                  {progress?.status === 'complete' && <span className={`badge badge--${toneForBand(band)}`}>{band}</span>}
                </div>

                <div className="scenario-card__meta">
                  <span className={`chip chip--domain-${scenario.domain}`}>{DOMAIN_LABELS[scenario.domain]}</span>
                  <span className="chip">{TECHNIQUE_LABELS[scenario.technique]}</span>
                  <DifficultyDots value={scenario.difficulty} />
                  <span className="scenario-card__time">~{scenario.estimatedMinutes} min</span>
                </div>

                {progress?.status === 'complete' ? (
                  <div className="scenario-card__progress">
                    <div className="scenario-card__progress-label">
                      <span>Score</span>
                      <span>{percent}%</span>
                    </div>
                    <ProgressBar percent={percent} tone={toneForBand(band)} label={`Score ${percent}%, ${band}`} />
                    <p className="scenario-card__status-text">
                      {progress.mode === 'assessed' ? `Assessed, attempt ${progress.attempt}` : 'Practice'}
                    </p>
                  </div>
                ) : progress ? (
                  <p className="scenario-card__status-text">
                    In progress - stage {progress.currentStage} - {progress.mode === 'assessed' ? `Assessed, attempt ${progress.attempt}` : 'Practice'}
                  </p>
                ) : (
                  <div className="scenario-card__mode-picker">
                    <label>
                      <input
                        type="radio"
                        name={`mode-${scenario.id}`}
                        checked={(modeByScenario[scenario.id] ?? 'practice') === 'practice'}
                        onChange={() => setModeByScenario((prev) => ({ ...prev, [scenario.id]: 'practice' }))}
                      />
                      Practice
                    </label>
                    <label>
                      <input
                        type="radio"
                        name={`mode-${scenario.id}`}
                        checked={modeByScenario[scenario.id] === 'assessed'}
                        onChange={() => setModeByScenario((prev) => ({ ...prev, [scenario.id]: 'assessed' }))}
                      />
                      Assessed
                    </label>
                  </div>
                )}

                <div className="scenario-card__actions">
                  {!progress && (
                    <button type="button" className="button" onClick={() => handleStart(scenario.id)}>
                      Start
                    </button>
                  )}
                  {progress && progress.status !== 'complete' && (
                    <button type="button" className="button" onClick={() => navigate(`/scenario/${scenario.id}`)}>
                      Resume
                    </button>
                  )}
                  {progress && progress.status === 'complete' && (
                    <>
                      <button type="button" className="button button--secondary" onClick={() => navigate(`/scenario/${scenario.id}/report`)}>
                        View report
                      </button>
                      <button type="button" className="button" onClick={() => handleRestart(scenario.id)}>
                        {progress.mode === 'assessed' ? 'Restart (new attempt)' : 'Try again'}
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="dashboard-footer">
        <button type="button" className="link-button link-button--danger" onClick={() => setResetOpen(true)}>
          Reset my progress
        </button>
      </div>

      <Dialog
        open={resetOpen}
        title="Reset all progress?"
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          actions.resetAll();
          setResetOpen(false);
        }}
        confirmLabel="Reset everything"
      >
        This clears every scenario's progress, scores and your name and group. This cannot be undone.
      </Dialog>
    </div>
  );
}
