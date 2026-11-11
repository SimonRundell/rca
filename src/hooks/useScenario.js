import { getScenarioById } from '../data/scenarios/index.js';
import { useProgressActions, useScenarioProgress } from '../context/ProgressContext.jsx';

/**
 * Combines scenario data lookup with the student's saved progress for
 * that scenario, plus the bound progress actions.
 * @param {string} scenarioId
 */
export function useScenario(scenarioId) {
  const scenario = getScenarioById(scenarioId);
  const progress = useScenarioProgress(scenarioId);
  const actions = useProgressActions();
  return { scenario, progress, actions };
}
