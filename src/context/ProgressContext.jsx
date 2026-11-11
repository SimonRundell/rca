import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { STORAGE_KEY } from '../config.js';
import { clearState, loadState, saveState } from '../lib/storage.js';

/**
 * @typedef {Object} ScenarioProgress
 * @property {'practice'|'assessed'} mode
 * @property {number} attempt
 * @property {number} currentStage
 * @property {Object<string, unknown>} answers        Keyed by stage index as string
 * @property {Object<string, Object>} stageResults     Keyed by stage index as string, {earned, possible, details}
 * @property {number[]} completedStages
 * @property {'in-progress'|'complete'} status
 * @property {string} startedAt
 * @property {string|null} completedAt
 */

/**
 * @typedef {Object} ProgressState
 * @property {{name: string, group: string}} student
 * @property {Object<string, ScenarioProgress>} scenarios  Keyed by scenario id
 * @property {{answers: Object<string, unknown>, pareto: unknown, completed: boolean}} triage
 */

/** @type {ProgressState} */
const initialState = {
  student: { name: '', group: '' },
  scenarios: {},
  triage: { answers: {}, pareto: null, completed: false },
};

/**
 * @param {string|undefined} scenarioId
 * @param {'practice'|'assessed'} mode
 * @returns {ScenarioProgress}
 */
function newScenarioProgress(mode) {
  return {
    mode,
    attempt: 1,
    currentStage: 0,
    answers: {},
    stageResults: {},
    completedStages: [],
    status: 'in-progress',
    startedAt: new Date().toISOString(),
    completedAt: null,
  };
}

/**
 * @param {ProgressState} state
 * @param {{type: string, payload?: Object}} action
 * @returns {ProgressState}
 */
function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE': {
      return action.payload ? { ...initialState, ...action.payload } : state;
    }
    case 'SET_STUDENT': {
      return { ...state, student: { ...state.student, ...action.payload } };
    }
    case 'START_SCENARIO': {
      const { scenarioId, mode } = action.payload;
      if (state.scenarios[scenarioId]) return state; // already started, resume as-is
      return {
        ...state,
        scenarios: {
          ...state.scenarios,
          [scenarioId]: newScenarioProgress(mode),
        },
      };
    }
    case 'RESTART_SCENARIO': {
      const { scenarioId } = action.payload;
      const existing = state.scenarios[scenarioId];
      const mode = existing ? existing.mode : action.payload.mode;
      const attempt = existing && existing.mode === 'assessed' ? existing.attempt + 1 : 1;
      return {
        ...state,
        scenarios: {
          ...state.scenarios,
          [scenarioId]: { ...newScenarioProgress(mode), attempt },
        },
      };
    }
    case 'ANSWER_STAGE': {
      const { scenarioId, stageIndex, answer, result } = action.payload;
      const existing = state.scenarios[scenarioId];
      if (!existing) return state;
      const key = String(stageIndex);
      const completedStages = existing.completedStages.includes(stageIndex)
        ? existing.completedStages
        : [...existing.completedStages, stageIndex];
      return {
        ...state,
        scenarios: {
          ...state.scenarios,
          [scenarioId]: {
            ...existing,
            answers: { ...existing.answers, [key]: answer },
            stageResults: { ...existing.stageResults, [key]: result },
            completedStages,
          },
        },
      };
    }
    case 'ADVANCE_STAGE': {
      const { scenarioId, stageIndex } = action.payload;
      const existing = state.scenarios[scenarioId];
      if (!existing) return state;
      return {
        ...state,
        scenarios: {
          ...state.scenarios,
          [scenarioId]: {
            ...existing,
            currentStage: Math.max(existing.currentStage, stageIndex),
          },
        },
      };
    }
    case 'COMPLETE_SCENARIO': {
      const { scenarioId } = action.payload;
      const existing = state.scenarios[scenarioId];
      if (!existing) return state;
      return {
        ...state,
        scenarios: {
          ...state.scenarios,
          [scenarioId]: {
            ...existing,
            status: 'complete',
            completedAt: new Date().toISOString(),
          },
        },
      };
    }
    case 'SET_TRIAGE_ANSWER': {
      const { caseId, answer } = action.payload;
      return {
        ...state,
        triage: { ...state.triage, answers: { ...state.triage.answers, [caseId]: answer } },
      };
    }
    case 'SET_TRIAGE_PARETO': {
      return { ...state, triage: { ...state.triage, pareto: action.payload.pareto } };
    }
    case 'COMPLETE_TRIAGE': {
      return { ...state, triage: { ...state.triage, completed: true } };
    }
    case 'RESET_ALL': {
      return initialState;
    }
    default:
      return state;
  }
}

const ProgressStateContext = createContext(initialState);
const ProgressDispatchContext = createContext(() => {});

/**
 * Wraps the app. Loads saved progress on mount and writes it back to
 * storage after every dispatch.
 * @param {{children: import('react').ReactNode}} props
 */
export function ProgressProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, () => {
    const saved = loadState(STORAGE_KEY);
    return saved ? { ...initialState, ...saved } : initialState;
  });

  useEffect(() => {
    saveState(STORAGE_KEY, state);
  }, [state]);

  return (
    <ProgressStateContext.Provider value={state}>
      <ProgressDispatchContext.Provider value={dispatch}>{children}</ProgressDispatchContext.Provider>
    </ProgressStateContext.Provider>
  );
}

/** @returns {ProgressState} */
export function useProgressState() {
  return useContext(ProgressStateContext);
}

/** @returns {Object} bound action creators */
export function useProgressActions() {
  const dispatch = useContext(ProgressDispatchContext);
  return useMemo(
    () => ({
      setStudent: (student) => dispatch({ type: 'SET_STUDENT', payload: student }),
      startScenario: (scenarioId, mode) => dispatch({ type: 'START_SCENARIO', payload: { scenarioId, mode } }),
      restartScenario: (scenarioId, mode) => dispatch({ type: 'RESTART_SCENARIO', payload: { scenarioId, mode } }),
      answerStage: (scenarioId, stageIndex, answer, result) =>
        dispatch({ type: 'ANSWER_STAGE', payload: { scenarioId, stageIndex, answer, result } }),
      advanceStage: (scenarioId, stageIndex) =>
        dispatch({ type: 'ADVANCE_STAGE', payload: { scenarioId, stageIndex } }),
      completeScenario: (scenarioId) => dispatch({ type: 'COMPLETE_SCENARIO', payload: { scenarioId } }),
      setTriageAnswer: (caseId, answer) => dispatch({ type: 'SET_TRIAGE_ANSWER', payload: { caseId, answer } }),
      setTriagePareto: (pareto) => dispatch({ type: 'SET_TRIAGE_PARETO', payload: { pareto } }),
      completeTriage: () => dispatch({ type: 'COMPLETE_TRIAGE' }),
      resetAll: () => dispatch({ type: 'RESET_ALL' }),
    }),
    [dispatch],
  );
}

/**
 * @param {string} scenarioId
 * @returns {ScenarioProgress|undefined}
 */
export function useScenarioProgress(scenarioId) {
  const state = useProgressState();
  return state.scenarios[scenarioId];
}

export { clearState };
