/**
 * Triage round data (/triage, section 9.2). Eight short cases: RCA, or
 * no RCA? Half warrant it, half do not, covering the "when not to"
 * part of the handout that the main scenarios cannot test (they all
 * warrant RCA). Ends with a Pareto ranking task.
 *
 * @typedef {Object} TriageReason
 * @property {string} id
 * @property {string} label
 * @property {boolean} correct
 *
 * @typedef {Object} TriageCase
 * @property {string} id
 * @property {string} scenario
 * @property {boolean} correctWarrantsRca
 * @property {TriageReason[]} reasons
 * @property {string} feedback
 */

const sharedReasonLabels = [
  { id: 'recurring', label: 'It keeps happening, not a one-off' },
  { id: 'highImpact', label: 'It has a high impact when it happens' },
  { id: 'security', label: 'It involves security or data' },
  { id: 'failedChange', label: 'It followed a failed change' },
  { id: 'formalRecord', label: 'A formal record is needed' },
];

/**
 * @param {string[]} correctIds
 * @returns {TriageReason[]}
 */
function reasonsWith(correctIds) {
  return sharedReasonLabels.map((r) => ({ ...r, correct: correctIds.includes(r.id) }));
}

/** @type {TriageCase[]} */
export const triageCases = [
  {
    id: 'triage-password',
    scenario: 'A user mistyped their password three times, got locked out, then reset it themselves and logged in fine.',
    correctWarrantsRca: false,
    reasons: reasonsWith([]),
    feedback: 'No RCA needed. This is a one-off, trivial, self-resolved event with no pattern and no real impact.',
  },
  {
    id: 'triage-printer',
    scenario: 'A printer in the staff room ran out of toner and was refilled.',
    correctWarrantsRca: false,
    reasons: reasonsWith([]),
    feedback: 'No RCA needed. Running out of consumables is routine maintenance, not a fault to investigate.',
  },
  {
    id: 'triage-wifi',
    scenario: 'The campus Wi-Fi went down for the third time this month, each time during an exam.',
    correctWarrantsRca: true,
    reasons: reasonsWith(['recurring', 'highImpact']),
    feedback: 'RCA needed. This is recurring and high impact - exactly the pattern that justifies the effort.',
  },
  {
    id: 'triage-projector',
    scenario: 'The projector in Room 4 flickers on cold mornings. This is a known issue with a documented workaround already applied every time.',
    correctWarrantsRca: false,
    reasons: reasonsWith([]),
    feedback: 'No RCA needed - at least not again. The cause is already known and a workaround is documented. A full RCA would be worth doing once, to fix it properly, but not every time it recurs.',
  },
  {
    id: 'triage-databreach',
    scenario: 'Customer payment data may have been exposed because of a misconfigured server.',
    correctWarrantsRca: true,
    reasons: reasonsWith(['security', 'formalRecord']),
    feedback: 'RCA needed. This involves data security and will need a formal record regardless of how small the exposure turns out to be.',
  },
  {
    id: 'triage-briefslow',
    scenario: '"The internet felt a bit slow for about a minute" is reported, but it is working fine now and nothing was logged at the time.',
    correctWarrantsRca: false,
    reasons: reasonsWith([]),
    feedback: 'No RCA needed - there is no evidence to analyse. Without logs or a repeatable pattern, there is nothing to investigate yet. Ask the reporter to flag it again if it recurs.',
  },
  {
    id: 'triage-attendance',
    scenario: 'A failed software update took the attendance system offline for the whole college on the first day of term.',
    correctWarrantsRca: true,
    reasons: reasonsWith(['highImpact', 'failedChange', 'formalRecord']),
    feedback: 'RCA needed. High impact, caused by a failed change, and serious enough to need a formal record.',
  },
  {
    id: 'triage-billing',
    scenario: 'A billing error has overcharged multiple customers for the third month running.',
    correctWarrantsRca: true,
    reasons: reasonsWith(['recurring', 'highImpact', 'formalRecord']),
    feedback: 'RCA needed. Recurring, financially significant, and needs a formal record for customers who were overcharged.',
  },
];

/**
 * @typedef {Object} ParetoCategory
 * @property {string} id
 * @property {string} label
 * @property {number} count
 */

export const paretoTask = {
  prompt: 'Rank these ticket categories from most to least frequent this term, to help decide where RCA effort is best spent.',
  categories: [
    { id: 'password', label: 'Password resets', count: 95 },
    { id: 'wifi', label: 'Wi-Fi connectivity', count: 42 },
    { id: 'printer', label: 'Printer issues', count: 30 },
    { id: 'login', label: 'Login/authentication failures', count: 18 },
    { id: 'software', label: 'Software installation requests', count: 12 },
  ],
  feedback:
    'Password resets are by far the most frequent ticket, but they are almost always trivial one-offs, not good RCA candidates. ' +
    'Login and authentication failures are far rarer but much more likely to point to a systemic cause worth investigating. ' +
    'Pareto ranking is a starting point for where to look, not an instruction to always chase the biggest number.',
};
