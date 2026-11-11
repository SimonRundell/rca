import { STAGE_COUNT, STAGE_TITLES } from '../../config.js';

/**
 * Shows all nine (well, ten: 0-9) stages so students learn the shape of
 * the process. Later stages stay locked until the current one is
 * complete (section 6). Rendered as a connected tracker: a thin line
 * joins each step, filled in for the stretch already completed.
 *
 * @param {Object} props
 * @param {number} props.currentStage
 * @param {number[]} props.completedStages
 * @param {(stageIndex: number) => void} props.onJump
 */
export function StageStepper({ currentStage, completedStages, onJump }) {
  const stageIndices = Array.from({ length: STAGE_COUNT }, (_, i) => i);

  return (
    <nav className="stage-stepper" aria-label="Scenario stages">
      <ol>
        {stageIndices.flatMap((stageIndex, i) => {
          const done = completedStages.includes(stageIndex);
          const active = stageIndex === currentStage;
          const reachable = stageIndex <= currentStage;
          const items = [];

          if (i > 0) {
            const connectorDone = completedStages.includes(stageIndex - 1) || stageIndex - 1 < currentStage;
            items.push(
              <li
                key={`connector-${stageIndex}`}
                aria-hidden="true"
                className={`stage-stepper__connector${connectorDone ? ' stage-stepper__connector--done' : ''}`}
              />,
            );
          }

          items.push(
            <li key={stageIndex} className="stage-stepper__item">
              <button
                type="button"
                className={`stage-stepper__button${active ? ' stage-stepper__button--active' : ''}${done ? ' stage-stepper__button--done' : ''}`}
                disabled={!reachable}
                aria-current={active ? 'step' : undefined}
                onClick={() => reachable && onJump(stageIndex)}
              >
                <span className="stage-stepper__number" aria-hidden="true">
                  {done ? '✓' : stageIndex}
                </span>
                <span className="stage-stepper__label">{STAGE_TITLES[stageIndex]}</span>
              </button>
            </li>,
          );

          return items;
        })}
      </ol>
    </nav>
  );
}
