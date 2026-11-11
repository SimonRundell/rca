import { useState } from 'react';
import { Header } from '../components/layout/Header.jsx';
import { GatePicker } from '../components/fta/GatePicker.jsx';
import { ChoiceList } from '../components/shared/ChoiceList.jsx';
import { FeedbackBanner } from '../components/shared/FeedbackBanner.jsx';
import {
  distractorPractice,
  distractorTypes,
  primerFiveWhys,
  primerFta,
  rcaIntro,
  rootCauseCriteria,
  rootCauseExamples,
  techniqueSummary,
} from '../data/primer.js';

/**
 * /learn - technique primer. Unscored throughout: the point is to make
 * mistakes safely here, before they cost marks inside a scenario.
 */
export function Learn() {
  return (
    <div className="page page--learn">
      <Header />
      <h1>Technique primer</h1>

      <section className="panel learn-intro">
        {rcaIntro.paragraphs.map((p, i) => (
          <p key={i} className={i === rcaIntro.paragraphs.length - 1 ? 'intro' : undefined}>
            {p}
          </p>
        ))}
      </section>

      <DistractorPrimer />
      <FiveWhysPrimer />
      <FtaPrimer />
      <RootCausePrimer />

      <section className="summary-table">
        <h2>All five techniques at a glance</h2>
        <p className="learn-section__intro">
          5 Whys and Fault Tree Analysis carry almost all the marks in this app - they are the two the scenarios put
          you through in depth. The other three turn up as light-touch, supporting activities where a scenario suits
          them.
        </p>
        <table>
          <thead>
            <tr>
              <th>Technique</th>
              <th>Use it when...</th>
              <th>Strength</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {techniqueSummary.map((t) => (
              <tr key={t.technique}>
                <td>
                  {t.technique}
                  {t.core && <span className="badge badge--accent">Core</span>}
                </td>
                <td>{t.useWhen}</td>
                <td>{t.strength}</td>
                <td>{t.risk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function DistractorPrimer() {
  const [answers, setAnswers] = useState({});

  return (
    <section className="learn-section">
      <h2>Spotting a real link from a distractor</h2>
      <p className="learn-section__intro">
        Every "Why?" in this app offers three or four possible answers, and only one of them is a supported next
        link in the chain. The others are not random wrong answers - they are specific traps, and once you can name
        the trap, you stop falling for it.
      </p>

      <table className="tag-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Example</th>
            <th>Why it is a trap</th>
          </tr>
        </thead>
        <tbody>
          {distractorTypes.map((d) => (
            <tr key={d.tag}>
              <td>{d.label}</td>
              <td className="tag-table__example">"{d.example}"</td>
              <td>{d.note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Try it: tag each statement</h3>
      <p>These are not from a real scenario. Pick the type each one is before moving on.</p>
      {distractorPractice.map((item) => (
        <div key={item.id} className="practice-item">
          <p className="practice-item__statement">"{item.statement}"</p>
          <ChoiceList
            options={distractorTypes.map((d) => ({ id: d.tag, text: d.label }))}
            mode="single"
            selectedIds={answers[item.id] ? [answers[item.id]] : []}
            onChange={([id]) => setAnswers((prev) => ({ ...prev, [item.id]: id }))}
            showFeedback={Boolean(answers[item.id])}
            isCorrect={(option) => option.id === item.tag}
          />
          {answers[item.id] && (
            <FeedbackBanner kind={answers[item.id] === item.tag ? 'correct' : 'incorrect'}>
              {distractorTypes.find((d) => d.tag === item.tag).note}
            </FeedbackBanner>
          )}
        </div>
      ))}
    </section>
  );
}

function FiveWhysPrimer() {
  const [revealedCount, setRevealedCount] = useState(0);
  const [guess, setGuess] = useState('');

  const steps = primerFiveWhys.steps;
  const done = revealedCount >= steps.length;

  function reveal() {
    setRevealedCount((c) => c + 1);
    setGuess('');
  }

  return (
    <section className="learn-section primer-fivewhys">
      <h2>5 Whys refresher: "users can't log in"</h2>
      <p className="learn-section__intro">
        Ask "why?" of the previous answer, again and again, until you reach something that is both specific enough
        to fix and would actually stop the problem recurring. The number five is a guide, not a rule - scenarios in
        this app use between four and six links.
      </p>
      <p className="why-step__statement">{primerFiveWhys.startStatement}</p>
      <ol className="why-chain__completed">
        {steps.slice(0, revealedCount).map((step, idx) => (
          <li key={idx} className="why-chain__card">
            <p>
              <strong>Why?</strong> {step.answer}
            </p>
            <p>{step.explanation}</p>
          </li>
        ))}
      </ol>
      {!done && (
        <div className="primer-fivewhys__predict">
          <label htmlFor="why-guess">Before you see the answer, what do you think comes next?</label>
          <textarea id="why-guess" rows={2} className="free-text__input" value={guess} onChange={(e) => setGuess(e.target.value)} />
          <button type="button" className="button" onClick={reveal}>
            Reveal "Why?"
          </button>
        </div>
      )}
      {done && (
        <>
          <FeedbackBanner kind="info">That's the chain - five links from symptom to root cause.</FeedbackBanner>
          <div className="callout">
            <span className="callout__title">The stop-or-continue test</span>
            At every link, ask: "if I only fix this, will it happen again?" Stopping at "the disk is full" fixes
            today's outage and nothing else - the disk fills up again next month. Only "no one was assigned
            responsibility for routine maintenance" closes the gap that let it happen in the first place. In Assessed
            mode, stopping too early on a scenario costs the mark for that decision.
          </div>
        </>
      )}
    </section>
  );
}

function FtaPrimer() {
  const [gates, setGates] = useState({});

  function setGate(nodeId, gate) {
    setGates((prev) => ({ ...prev, [nodeId]: gate }));
  }

  return (
    <section className="learn-section primer-fta">
      <h2>FTA refresher: "website is down"</h2>
      <p className="learn-section__intro">
        A fault tree starts at the incident and branches downward into its causes. Every branch point needs a gate:
        <strong> OR</strong> means any one child alone is enough to cause the parent, <strong> AND</strong> means every
        child listed has to be true at the same time. In this app you build the tree in this order: choose the causes,
        choose the gate, then later test each leaf against the evidence you collected (confirmed, ruled out, or
        cannot tell), and finally trace a path of confirmed causes up to the top event.
      </p>
      {primerFta.decisionNodeIds.map((nodeId) => {
        const node = primerFta.nodes[nodeId];
        const childLabels = node.children.map((c) => primerFta.nodes[c].label);
        return (
          <div key={nodeId} className="primer-fta__node">
            <p>
              <strong>{node.label}</strong>, caused by: {childLabels.join(' / ')}
            </p>
            <GatePicker value={gates[nodeId] ?? null} onChange={(g) => setGate(nodeId, g)} />
            {gates[nodeId] && (
              <FeedbackBanner kind={gates[nodeId] === node.correctGate ? 'correct' : 'incorrect'}>{node.gateFeedback}</FeedbackBanner>
            )}
          </div>
        );
      })}
    </section>
  );
}

function RootCausePrimer() {
  const [verdicts, setVerdicts] = useState({});

  return (
    <section className="learn-section">
      <h2>What makes a root cause strong enough to hold up</h2>
      <p className="learn-section__intro">
        Every scenario in this app tests your proposed root cause against the same four criteria before it counts.
        Learn these now and Stage 6 of every scenario will feel familiar.
      </p>

      <ul className="criteria-checklist">
        {rootCauseCriteria.map((c) => (
          <li key={c.id} className="criteria-checklist__item">
            <p className="criteria-checklist__question">{c.question}</p>
            <p className="criteria-checklist__explanation">{c.explanation}</p>
          </li>
        ))}
      </ul>

      <h3>Try it: strong or weak?</h3>
      {rootCauseExamples.map((ex) => (
        <div key={ex.id} className="practice-item">
          <p className="practice-item__statement">"{ex.text}"</p>
          <ChoiceList
            options={[
              { id: 'strong', text: 'Strong root cause' },
              { id: 'weak', text: 'Weak root cause' },
            ]}
            mode="single"
            selectedIds={verdicts[ex.id] ? [verdicts[ex.id]] : []}
            onChange={([id]) => setVerdicts((prev) => ({ ...prev, [ex.id]: id }))}
            showFeedback={Boolean(verdicts[ex.id])}
            isCorrect={(option) => option.id === ex.verdict}
          />
          {verdicts[ex.id] && (
            <FeedbackBanner kind={verdicts[ex.id] === ex.verdict ? 'correct' : 'incorrect'}>{ex.reason}</FeedbackBanner>
          )}
        </div>
      ))}
    </section>
  );
}
