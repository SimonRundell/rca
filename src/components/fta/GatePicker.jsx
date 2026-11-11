/**
 * Choose the gate (AND/OR) for a node being built in Pass 1.
 * @param {Object} props
 * @param {'AND'|'OR'|null} props.value
 * @param {(gate: string) => void} props.onChange
 * @param {boolean} [props.disabled]
 */
export function GatePicker({ value, onChange, disabled }) {
  return (
    <fieldset className="gate-picker">
      <legend>Choose the gate</legend>
      <div className="gate-picker__options">
        <button
          type="button"
          className={`button${value === 'OR' ? ' button--selected' : ''}`}
          disabled={disabled}
          onClick={() => onChange('OR')}
        >
          OR - any one is enough
        </button>
        <button
          type="button"
          className={`button${value === 'AND' ? ' button--selected' : ''}`}
          disabled={disabled}
          onClick={() => onChange('AND')}
        >
          AND - all must be true together
        </button>
      </div>
    </fieldset>
  );
}
