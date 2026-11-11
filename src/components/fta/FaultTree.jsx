import { useMemo, useState } from 'react';
import { TreeNode } from './TreeNode.jsx';
import { CausePool } from './CausePool.jsx';
import { GatePicker } from './GatePicker.jsx';
import { BranchVerdict } from './BranchVerdict.jsx';
import { FreeTextRubric } from '../shared/FreeTextRubric.jsx';
import { FeedbackBanner } from '../shared/FeedbackBanner.jsx';
import { useStageLock } from '../../hooks/useStageLock.js';
import { layoutTree } from '../../lib/treeLayout.js';
import { combineResults, scoreBuildStep, scoreVerdict, scoreBinary } from '../../lib/scoring.js';

/**
 * @param {Object<string, Object>} nodes
 * @param {string} rootId
 * @returns {string[]} breadth-first order of node ids that have children (gate !== null)
 */
function buildStepOrder(nodes, rootId) {
  const order = [];
  const queue = [rootId];
  while (queue.length) {
    const id = queue.shift();
    const node = nodes[id];
    if (node.gate) {
      order.push(id);
      queue.push(...node.children);
    }
  }
  return order;
}

/** @returns {Object<string, string>} child id -> parent id */
function parentMap(nodes) {
  const map = {};
  for (const node of Object.values(nodes)) {
    for (const childId of node.children) map[childId] = node.id;
  }
  return map;
}

/**
 * One Pass 1 build step for a single node. Remounted per node (via a
 * `key` from the caller) so each node gets a fresh reveal state.
 */
function BuildStep({ node, mode, onSubmit }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [gate, setGate] = useState(null);
  const { revealed, locked, submitStage } = useStageLock(mode);
  const canSubmit = selectedIds.length > 0 && Boolean(gate);

  function handleClick() {
    if (!revealed) {
      submitStage();
      return;
    }
    onSubmit({ selectedOptionIds: selectedIds, gate }, scoreBuildStep(node, selectedIds, gate));
  }

  return (
    <div className="build-step">
      <h3>Building: {node.label}</h3>
      <CausePool
        buildOptions={node.buildOptions}
        selectedIds={selectedIds}
        onChange={setSelectedIds}
        showFeedback={revealed}
        disabled={locked}
      />
      <GatePicker value={gate} onChange={setGate} disabled={locked} />
      {revealed && <FeedbackBanner kind={gate === node.gate ? 'correct' : 'incorrect'}>{node.gateFeedback}</FeedbackBanner>}
      <button type="button" className="button" disabled={!canSubmit} onClick={handleClick}>
        {!revealed ? 'Submit this node' : 'Continue building'}
      </button>
    </div>
  );
}

/**
 * The fault tree engine: Pass 1 (build), Pass 2 (eliminate), Pass 3
 * (trace), per section 8.2. Renders as SVG that grows as the student
 * works, with the same structure exposed as a nested list for screen
 * readers and keyboard users (section 8.2, Accessibility).
 *
 * @param {Object} props
 * @param {import('../../data/scenarios/site-down.js').default} props.scenario
 * @param {'practice'|'assessed'} props.mode
 * @param {string[]} props.collectedEvidenceIds
 * @param {Object|undefined} props.saved
 * @param {(answer: Object, result: Object) => void} props.onComplete
 */
export function FaultTree({ scenario, mode, collectedEvidenceIds, saved, onComplete }) {
  const { faultTree } = scenario;
  const { nodes, rootId } = faultTree;
  const [buildAnswers, setBuildAnswers] = useState(saved?.buildAnswers ?? {});
  const [verdicts, setVerdicts] = useState(saved?.verdicts ?? {});
  const [tracedIds, setTracedIds] = useState(saved?.tracedIds ?? []);
  const [explanation, setExplanation] = useState(saved?.explanation);
  const { revealed: eliminateRevealed, submitStage: submitEliminate } = useStageLock(mode);

  const buildSteps = useMemo(() => buildStepOrder(nodes, rootId), [nodes, rootId]);
  const parents = useMemo(() => parentMap(nodes), [nodes]);
  const leafIds = useMemo(() => Object.values(nodes).filter((n) => n.gate === null).map((n) => n.id), [nodes]);

  const visibleIds = useMemo(() => {
    const ids = new Set([rootId]);
    for (const nodeId of buildSteps) {
      if (buildAnswers[nodeId]) nodes[nodeId].children.forEach((c) => ids.add(c));
    }
    return ids;
  }, [buildAnswers, buildSteps, nodes, rootId]);

  const buildComplete = buildSteps.every((id) => buildAnswers[id]);
  const eliminateComplete = leafIds.every((id) => verdicts[id]?.verdict);
  const evidenceOptions = scenario.evidence.filter((e) => collectedEvidenceIds?.includes(e.id));

  const confirmedPathIds = useMemo(() => {
    if (!eliminateComplete) return new Set();
    const ids = new Set();
    for (const leafId of leafIds) {
      if (nodes[leafId].correctVerdict === 'confirmed') {
        let cur = leafId;
        while (cur) {
          ids.add(cur);
          cur = parents[cur];
        }
      }
    }
    return ids;
  }, [eliminateComplete, leafIds, nodes, parents]);

  const traceComplete = confirmedPathIds.size > 0 && tracedIds.includes(rootId);

  const { layout, width, height, nodeWidth, nodeHeight } = layoutTree(nodes, rootId, visibleIds);

  function handleBuildSubmit(nodeId, answer, result) {
    setBuildAnswers((prev) => ({ ...prev, [nodeId]: { ...answer, result } }));
  }

  function handleEliminateContinue() {
    if (!eliminateRevealed) {
      submitEliminate();
    }
  }

  function clickableForTrace(nodeId) {
    if (tracedIds.includes(nodeId)) return false;
    if (!confirmedPathIds.has(nodeId)) return false;
    const node = nodes[nodeId];
    const relevantChildren = node.children.filter((c) => confirmedPathIds.has(c));
    return relevantChildren.every((c) => tracedIds.includes(c));
  }

  function handleTraceClick(nodeId) {
    if (!clickableForTrace(nodeId)) return;
    setTracedIds((prev) => [...prev, nodeId]);
  }

  function computeTotalResult() {
    const buildResults = Object.values(buildAnswers).map((a) => a.result);
    const verdictResults = leafIds.map((id) => scoreVerdict(nodes[id], verdicts[id]?.verdict, verdicts[id]?.evidenceIds ?? []));
    const traceResult = scoreBinary(tracedIds.includes(rootId), 2);
    const explanationResult = { earned: (explanation?.result?.score ?? 0) * 2, possible: 2, details: [] };
    return combineResults([...buildResults, ...verdictResults, traceResult, explanationResult]);
  }

  function handleFinish() {
    onComplete({ buildAnswers, verdicts, tracedIds, explanation }, computeTotalResult());
  }

  const currentBuildStepId = buildSteps.find((id) => !buildAnswers[id]);

  return (
    <div className="fault-tree">
      <svg className="fault-tree__svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Fault tree diagram, also available below as a list">
        {Array.from(visibleIds).map((id) => {
          const node = nodes[id];
          return node.children
            .filter((childId) => visibleIds.has(childId))
            .map((childId) => {
              const from = layout[id];
              const to = layout[childId];
              const midY = (from.y + to.y) / 2;
              return (
                <g key={`${id}-${childId}`} className="fault-tree__edge">
                  <line x1={from.x} y1={from.y + nodeHeight / 2} x2={to.x} y2={to.y - nodeHeight / 2} />
                  {childId === node.children.find((c) => visibleIds.has(c)) && (
                    <text x={from.x + 8} y={midY} className="fault-tree__gate-label">
                      {node.gate}
                    </text>
                  )}
                </g>
              );
            });
        })}
        {Array.from(visibleIds).map((id) => {
          const node = nodes[id];
          const verdict = verdicts[id]?.verdict ?? null;
          return (
            <TreeNode
              key={id}
              label={node.label}
              x={layout[id].x}
              y={layout[id].y}
              width={nodeWidth}
              height={nodeHeight}
              verdict={verdict}
              isTop={id === rootId}
            />
          );
        })}
      </svg>

      <details className="fault-tree__list-view">
        <summary>View the tree as a list</summary>
        <ul>
          <TreeList nodeId={rootId} nodes={nodes} visibleIds={visibleIds} verdicts={verdicts} />
        </ul>
      </details>

      {!buildComplete && currentBuildStepId && (
        <BuildStep
          key={currentBuildStepId}
          node={nodes[currentBuildStepId]}
          mode={mode}
          onSubmit={(answer, result) => handleBuildSubmit(currentBuildStepId, answer, result)}
        />
      )}

      {buildComplete && !eliminateRevealed && (
        <div className="eliminate-pass">
          <h3>Pass 2: Eliminate</h3>
          <p>Give every leaf a verdict, with evidence for Confirmed or Ruled out.</p>
          {leafIds.map((id) => (
            <BranchVerdict
              key={id}
              node={nodes[id]}
              evidenceOptions={evidenceOptions}
              verdict={verdicts[id]?.verdict ?? null}
              evidenceIds={verdicts[id]?.evidenceIds ?? []}
              onVerdict={(verdict) => setVerdicts((prev) => ({ ...prev, [id]: { verdict, evidenceIds: prev[id]?.evidenceIds ?? [] } }))}
              onEvidence={(evidenceIds) => setVerdicts((prev) => ({ ...prev, [id]: { verdict: prev[id]?.verdict, evidenceIds } }))}
              showFeedback={false}
              disabled={false}
            />
          ))}
          <button type="button" className="button" disabled={!eliminateComplete} onClick={handleEliminateContinue}>
            Submit verdicts
          </button>
        </div>
      )}

      {buildComplete && eliminateRevealed && !traceComplete && (
        <div className="trace-pass">
          <FeedbackBanner kind="info">Verdicts submitted - see the tree above for how each branch was marked.</FeedbackBanner>
          <h3>Pass 3: Trace</h3>
          <p>Click the confirmed path from a confirmed leaf up to the top event, respecting the gates.</p>
          <ul className="trace-pass__nodes">
            {Array.from(confirmedPathIds).map((id) => (
              <li key={id}>
                <button
                  type="button"
                  className={`button button--small${tracedIds.includes(id) ? ' button--selected' : ''}`}
                  disabled={tracedIds.includes(id) || !clickableForTrace(id)}
                  onClick={() => handleTraceClick(id)}
                >
                  {nodes[id].label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {buildComplete && eliminateRevealed && traceComplete && (
        <div className="explain-pass">
          <FeedbackBanner kind="correct">Path traced to the top event.</FeedbackBanner>
          <FreeTextRubric
            promptDef={faultTree.explanation}
            saved={explanation}
            onChange={setExplanation}
            revealModelAnswer
            allowResubmit={mode === 'practice'}
          />
          <button type="button" className="button" disabled={!explanation?.result} onClick={handleFinish}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Accessible nested-list view of the tree, driven from the same state
 * as the SVG (section 8.2, Accessibility).
 */
function TreeList({ nodeId, nodes, visibleIds, verdicts }) {
  const node = nodes[nodeId];
  const children = node.children.filter((id) => visibleIds.has(id));
  const verdict = verdicts[nodeId]?.verdict;
  return (
    <li>
      {node.label}
      {verdict ? ` (${verdict})` : ''}
      {children.length > 0 && (
        <>
          {node.gate && <span> - {node.gate} gate</span>}
          <ul>
            {children.map((childId) => (
              <TreeList key={childId} nodeId={childId} nodes={nodes} visibleIds={visibleIds} verdicts={verdicts} />
            ))}
          </ul>
        </>
      )}
    </li>
  );
}
