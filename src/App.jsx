import { Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home.jsx';
import { Learn } from './pages/Learn.jsx';
import { Triage } from './pages/Triage.jsx';
import { ScenarioPlayer } from './pages/ScenarioPlayer.jsx';
import { Report } from './pages/Report.jsx';
import CMFloatAd from './cmFloatAd.jsx';

/**
 * Top-level routes (section 4.1).
 */
export default function App() {
  return (
    <>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/learn" element={<Learn />} />
      <Route path="/triage" element={<Triage />} />
      <Route path="/scenario/:id" element={<ScenarioPlayer />} />
      <Route path="/scenario/:id/report" element={<Report />} />
    </Routes>
    <CMFloatAd />
    </>
  );
}
