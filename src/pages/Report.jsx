import { Link, useParams } from 'react-router-dom';
import { Header } from '../components/layout/Header.jsx';
import { RcaReport } from '../components/report/RcaReport.jsx';
import { useScenario } from '../hooks/useScenario.js';
import { useProgressState } from '../context/ProgressContext.jsx';

/**
 * /scenario/:id/report - the generated RCA report, with scores and a
 * print view (section 11).
 */
export function Report() {
  const { id } = useParams();
  const { scenario, progress } = useScenario(id);
  const { student } = useProgressState();

  if (!scenario) {
    return (
      <div className="page">
        <Header />
        <p>Scenario not found. <Link to="/">Back home</Link></p>
      </div>
    );
  }
  if (!progress || progress.status !== 'complete') {
    return (
      <div className="page">
        <Header scenarioTitle={scenario.title} />
        <p>This scenario has not been completed yet.</p>
        <Link to={`/scenario/${id}`}>Continue the scenario</Link>
      </div>
    );
  }

  return (
    <div className="page page--report">
      <div className="no-print">
        <Header scenarioTitle={scenario.title} mode={progress.mode} attempt={progress.attempt} />
        <button type="button" className="button" onClick={() => window.print()}>
          Print / save as PDF
        </button>
        <Link to="/" className="button button--secondary">Back home</Link>
      </div>
      <RcaReport scenario={scenario} progress={progress} student={student} />
    </div>
  );
}
