import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useScenario } from '../hooks/useScenario.js';
import { Header } from '../components/layout/Header.jsx';
import { StageStepper } from '../components/layout/StageStepper.jsx';
import { ScorePanel } from '../components/layout/ScorePanel.jsx';
import { EvidenceCard } from '../components/shared/EvidenceCard.jsx';
import { Briefing } from '../components/stages/Briefing.jsx';
import { DefineProblem } from '../components/stages/DefineProblem.jsx';
import { RestoreService } from '../components/stages/RestoreService.jsx';
import { EvidenceTimeline } from '../components/stages/EvidenceTimeline.jsx';
import { ContributingFactors } from '../components/stages/ContributingFactors.jsx';
import { TechniqueStage } from '../components/stages/TechniqueStage.jsx';
import { ConfirmRootCause } from '../components/stages/ConfirmRootCause.jsx';
import { ActionsStage } from '../components/stages/ActionsStage.jsx';
import { VerifyMonitor } from '../components/stages/VerifyMonitor.jsx';
import { DocumentStage } from '../components/stages/DocumentStage.jsx';
import { STAGE_COUNT, STAGE_TITLES } from '../config.js';

/**
 * Scenario player: the stage stepper and the current stage's component.
 */
export function ScenarioPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { scenario, progress, actions } = useScenario(id);
  const [viewedStage, setViewedStage] = useState(progress?.currentStage ?? 0);
  const [evidenceDrawerOpen, setEvidenceDrawerOpen] = useState(false);

  useEffect(() => {
    if (scenario && !progress) {
      actions.startScenario(id, 'practice');
    }
  }, [scenario, progress, id, actions]);

  const liveCurrentStage = progress?.currentStage;
  useEffect(() => {
    if (liveCurrentStage !== undefined) setViewedStage(liveCurrentStage);
  }, [liveCurrentStage]);

  if (!scenario) {
    return (
      <div className="page">
        <Header />
        <p>Scenario not found. <Link to="/">Back home</Link></p>
      </div>
    );
  }
  if (!progress) return null;

  const stageIndex = progress.currentStage;
  const isLive = viewedStage === stageIndex;

  function handleComplete(answer, result) {
    actions.answerStage(id, stageIndex, answer, result);
    const nextStage = stageIndex + 1;
    if (nextStage >= STAGE_COUNT) {
      actions.completeScenario(id);
      navigate(`/scenario/${id}/report`);
      return;
    }
    actions.advanceStage(id, nextStage);
  }

  const containmentAnswer = progress.answers['2'];
  const destroyedEvidenceId = containmentAnswer
    ? scenario.containment.options.find((o) => o.id === containmentAnswer.containmentId)?.destroysEvidenceId
    : undefined;

  const essentialIds = scenario.evidence.filter((e) => e.essential).map((e) => e.id);
  const requestedIds = progress.answers['3']?.requestedIds ?? [];
  const availableEvidenceIds = Array.from(new Set([...requestedIds, ...essentialIds])).filter((eid) => eid !== destroyedEvidenceId);

  const savedForStage = progress.answers[String(stageIndex)];

  function renderLiveStage() {
    switch (stageIndex) {
      case 0:
        return <Briefing scenario={scenario} mode={progress.mode} saved={savedForStage} onComplete={handleComplete} />;
      case 1:
        return <DefineProblem scenario={scenario} mode={progress.mode} saved={savedForStage} onComplete={handleComplete} />;
      case 2:
        return <RestoreService scenario={scenario} mode={progress.mode} saved={savedForStage} onComplete={handleComplete} />;
      case 3:
        return (
          <EvidenceTimeline
            scenario={scenario}
            mode={progress.mode}
            destroyedEvidenceId={destroyedEvidenceId}
            saved={savedForStage}
            onComplete={handleComplete}
          />
        );
      case 4:
        return <ContributingFactors scenario={scenario} mode={progress.mode} saved={savedForStage} onComplete={handleComplete} />;
      case 5:
        return (
          <TechniqueStage
            scenario={scenario}
            mode={progress.mode}
            collectedEvidenceIds={availableEvidenceIds}
            saved={savedForStage}
            onComplete={handleComplete}
          />
        );
      case 6:
        return <ConfirmRootCause scenario={scenario} mode={progress.mode} saved={savedForStage} onComplete={handleComplete} />;
      case 7:
        return <ActionsStage scenario={scenario} mode={progress.mode} saved={savedForStage} onComplete={handleComplete} />;
      case 8:
        return <VerifyMonitor scenario={scenario} mode={progress.mode} saved={savedForStage} onComplete={handleComplete} />;
      case 9:
        return <DocumentStage scenario={scenario} mode={progress.mode} saved={savedForStage} onComplete={handleComplete} />;
      default:
        return null;
    }
  }

  return (
    <div className="page page--scenario">
      <Header scenarioTitle={scenario.title} mode={progress.mode} attempt={progress.attempt} />
      <StageStepper currentStage={stageIndex} completedStages={progress.completedStages} onJump={setViewedStage} />

      {isLive ? (
        renderLiveStage()
      ) : (
        <section className="stage stage--review">
          <h2 className="stage__title">Stage {viewedStage}: {STAGE_TITLES[viewedStage]} (completed)</h2>
          {progress.stageResults[String(viewedStage)] && <ScorePanel result={progress.stageResults[String(viewedStage)]} />}
          <p>Full detail for every stage appears in the report once the scenario is finished.</p>
          <button type="button" className="button" onClick={() => setViewedStage(stageIndex)}>
            Return to current stage
          </button>
        </section>
      )}

      {stageIndex >= 3 && (
        <div className="evidence-drawer">
          <button type="button" className="button button--secondary" onClick={() => setEvidenceDrawerOpen((o) => !o)}>
            {evidenceDrawerOpen ? 'Hide' : 'Show'} evidence drawer
          </button>
          {evidenceDrawerOpen && (
            <div className="evidence-drawer__content evidence-grid">
              {scenario.evidence
                .filter((e) => availableEvidenceIds.includes(e.id))
                .map((e) => <EvidenceCard key={e.id} evidence={e} opened selectable={false} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
