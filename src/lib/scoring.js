/**
 * Deterministic auto-marking for choices, sorts, orderings and tree
 * construction. Every stage-scoring function returns the same shape:
 * `{ earned, possible, details }`, where `details` is a list of short
 * strings a `FeedbackBanner` or the report can show.
 *
 * @typedef {Object} StageResult
 * @property {number} earned
 * @property {number} possible
 * @property {string[]} details
 */

/**
 * @param {boolean} correct
 * @param {number} [possible]
 * @returns {StageResult}
 */
export function scoreBinary(correct, possible = 1) {
  return { earned: correct ? possible : 0, possible, details: [] };
}

/**
 * Merge several stage results into one.
 * @param {StageResult[]} results
 * @returns {StageResult}
 */
export function combineResults(results) {
  return results.reduce(
    (acc, r) => ({
      earned: acc.earned + r.earned,
      possible: acc.possible + r.possible,
      details: [...acc.details, ...r.details],
    }),
    { earned: 0, possible: 0, details: [] },
  );
}

/**
 * Marks a classification task where every item must be sorted into one
 * of several categories (contributing-factor tagging, corrective /
 * preventative / not-appropriate sorting).
 * @param {Array<{id: string}>} items
 * @param {Object<string, string>} studentChoice  id -> chosen category
 * @param {Object<string, string>} correctChoice  id -> correct category
 * @returns {StageResult}
 */
export function scoreClassification(items, studentChoice, correctChoice) {
  const details = items.map((item) => {
    const ok = studentChoice[item.id] === correctChoice[item.id];
    return ok ? `Correctly classified: ${item.id}` : `Misclassified: ${item.id}`;
  });
  const earned = items.filter((item) => studentChoice[item.id] === correctChoice[item.id]).length;
  return { earned, possible: items.length, details };
}

/**
 * Marks a pick-set task (e.g. evidence requests): credit for each
 * essential item picked, a smaller penalty for each irrelevant pick,
 * floored at zero.
 * @param {string[]} selectedIds
 * @param {string[]} essentialIds
 * @param {Object} [opts]
 * @param {number} [opts.perEssential]
 * @param {number} [opts.perIrrelevantPenalty]
 * @returns {StageResult}
 */
export function scorePickEssentials(selectedIds, essentialIds, opts = {}) {
  const perEssential = opts.perEssential ?? 1;
  const perIrrelevantPenalty = opts.perIrrelevantPenalty ?? 0.5;
  const essentialSet = new Set(essentialIds);
  let earned = 0;
  const details = [];
  for (const id of selectedIds) {
    if (essentialSet.has(id)) {
      earned += perEssential;
      details.push(`Essential item requested: ${id}`);
    } else {
      earned -= perIrrelevantPenalty;
      details.push(`Irrelevant item requested: ${id}`);
    }
  }
  earned = Math.max(0, earned);
  const possible = essentialIds.length * perEssential;
  return { earned: Math.min(earned, possible), possible, details };
}

/**
 * Length of the longest strictly increasing subsequence of a number array.
 * Used to mark timeline ordering as "longest correctly ordered run".
 * @param {number[]} arr
 * @returns {number}
 */
export function longestIncreasingSubsequence(arr) {
  if (arr.length === 0) return 0;
  const tails = [];
  for (const value of arr) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < value) lo = mid + 1;
      else hi = mid;
    }
    tails[lo] = value;
  }
  return tails.length;
}

/**
 * Marks a timeline ordering task as the longest correctly ordered
 * subsequence, as a fraction of the total number of events.
 * @param {string[]} studentOrder   event ids, in the order the student placed them
 * @param {string[]} correctOrder   event ids, in the true chronological order
 * @returns {StageResult}
 */
export function scoreOrdering(studentOrder, correctOrder) {
  const indexInCorrect = new Map(correctOrder.map((id, i) => [id, i]));
  const asIndices = studentOrder.map((id) => indexInCorrect.get(id));
  const runLength = longestIncreasingSubsequence(asIndices);
  const details = [
    `${runLength} of ${correctOrder.length} events are in a correctly ordered run.`,
  ];
  return { earned: runLength, possible: correctOrder.length, details };
}

/**
 * Marks one level of a 5 Whys chain: the answer choice, the evidence or
 * hypothesis link, the justification, and the stop-or-continue decision
 * (section 8.1).
 * @param {import('../data/scenarios/wifi-b12.js').WhyLevel} level
 * @param {{optionId: string, evidenceMode: 'evidence'|'hypothesis', evidenceId: string|null, justification: Object, decision: string}} levelAnswer
 * @param {boolean} isLastLevel
 * @returns {StageResult}
 */
export function scoreFiveWhysLevel(level, levelAnswer, isLastLevel) {
  const chosenOption = level.options.find((o) => o.id === levelAnswer.optionId);
  const answerResult = scoreBinary(chosenOption?.tag === 'correct', 2);

  let evidencePoints = 0;
  if (chosenOption?.tag === 'correct') {
    if (levelAnswer.evidenceMode === 'hypothesis') evidencePoints = 1;
    else if (levelAnswer.evidenceMode === 'evidence' && level.supportingEvidenceIds.includes(levelAnswer.evidenceId)) evidencePoints = 2;
    else if (levelAnswer.evidenceMode === 'evidence' && levelAnswer.evidenceId) evidencePoints = 1;
  }
  const evidenceResult = { earned: evidencePoints, possible: 2, details: [] };
  const justificationResult = { earned: (levelAnswer.justification?.result?.score ?? 0) * 2, possible: 2, details: [] };
  const correctDecision = isLastLevel ? 'stop' : 'continue';
  const decisionResult = scoreBinary(levelAnswer.decision === correctDecision, 1);
  return combineResults([answerResult, evidenceResult, justificationResult, decisionResult]);
}

/**
 * Marks one Pass 1 (build) step of a fault tree node: the causes picked
 * from the pool, and the AND/OR gate chosen (section 8.2).
 * @param {import('../data/scenarios/site-down.js').default['faultTree']['nodes'][string]} node
 * @param {string[]} selectedOptionIds
 * @param {'AND'|'OR'|null} chosenGate
 * @returns {StageResult}
 */
export function scoreBuildStep(node, selectedOptionIds, chosenGate) {
  const correctOptionIds = node.buildOptions.filter((o) => o.correct).map((o) => o.id);
  const childrenResult = scorePickEssentials(selectedOptionIds, correctOptionIds, { perEssential: 1, perIrrelevantPenalty: 1 });
  const gateResult = scoreBinary(chosenGate === node.gate, 1);
  return combineResults([childrenResult, gateResult]);
}

/**
 * Marks one Pass 2 (eliminate) leaf verdict: confirmed/ruledOut/unknown,
 * plus the supporting evidence for confirmed or ruled-out verdicts.
 * @param {import('../data/scenarios/site-down.js').default['faultTree']['nodes'][string]} node
 * @param {'confirmed'|'ruledOut'|'unknown'} verdict
 * @param {string[]} evidenceIds
 * @returns {StageResult}
 */
export function scoreVerdict(node, verdict, evidenceIds) {
  const verdictResult = scoreBinary(verdict === node.correctVerdict, 1);
  if (node.correctVerdict === 'unknown') return verdictResult;
  const evidenceOk = verdict === node.correctVerdict && (evidenceIds ?? []).some((id) => node.verdictEvidenceIds?.includes(id));
  const evidenceResult = scoreBinary(evidenceOk, 1);
  return combineResults([verdictResult, evidenceResult]);
}

/**
 * @param {StageResult} result
 * @returns {number} 0-100, 0 when nothing was possible
 */
export function percentFromResult(result) {
  if (result.possible === 0) return 0;
  return Math.max(0, Math.min(100, (result.earned / result.possible) * 100));
}

/**
 * Combines every stage's result into the scenario's overall percentage,
 * weighted per `STAGE_WEIGHTS`.
 * @param {Object<string, StageResult>} stageResults  keyed by stage index as string
 * @param {Object<string, number>} weights            stage index (string or number) -> weight
 * @returns {number} 0-100
 */
export function weightedOverallPercent(stageResults, weights) {
  let total = 0;
  let weightSeen = 0;
  for (const [stageIndex, weight] of Object.entries(weights)) {
    const result = stageResults[String(stageIndex)];
    if (!result) continue;
    total += percentFromResult(result) * weight;
    weightSeen += weight;
  }
  if (weightSeen === 0) return 0;
  return total / weightSeen;
}
