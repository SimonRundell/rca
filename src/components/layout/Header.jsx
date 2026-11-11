import { Link } from 'react-router-dom';
import { APP_TITLE } from '../../config.js';

/**
 * @param {Object} props
 * @param {string} [props.scenarioTitle]
 * @param {'practice'|'assessed'} [props.mode]
 * @param {number} [props.attempt]
 */
export function Header({ scenarioTitle, mode, attempt }) {
  return (
    <header className="app-header">
      <Link to="/" className="app-header__home">
        <img src="/RCA.png" alt="RCA Doctor" className="app-header_logo" />
        {APP_TITLE}
      </Link>
      {scenarioTitle && <span className="app-header__scenario">{scenarioTitle}</span>}
      {mode && (
        <span className={`mode-badge mode-badge--${mode}`}>
          {mode === 'assessed' ? `Assessed - attempt ${attempt}` : 'Practice'}
        </span>
      )}
    </header>
  );
}
