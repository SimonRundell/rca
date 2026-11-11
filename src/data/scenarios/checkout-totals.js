/**
 * Scenario 5: Checkout totals are wrong.
 * Development / 5 Whys / difficulty 2.
 * Root cause (outline): rounding regression in a VAT calculation. No
 * unit test covered it, and code review was skipped to meet a sprint
 * deadline, which the team's process allowed.
 * Deliberately makes the "blame the developer" option tempting - the
 * feedback must redirect to what allowed the error through.
 */

const scenario = {
  id: 'checkout-totals',
  title: 'Checkout totals are wrong',
  domain: 'development',
  difficulty: 2,
  technique: 'fiveWhys',
  estimatedMinutes: 25,

  briefing: {
    ticketRef: 'INC-7745',
    loggedAt: 'Thursday 11:00',
    reports: [
      '"My order total was 2p more than the receipt breakdown adds up to." - Customer, Tuesday 14:20',
      "\"We've had several complaints this week about totals not matching.\" - Support lead, Thursday 09:30",
      '"Reconciliation shows a small but consistent discrepancy since Tuesday." - Finance, Wednesday 10:00',
    ],
    question: 'Does this warrant a full Root Cause Analysis?',
    correctWarrantsRca: true,
    reasons: [
      { id: 'recurring', label: 'It is happening repeatedly, across multiple orders', correct: true },
      { id: 'highImpact', label: 'It makes the website completely unusable', correct: false },
      { id: 'security', label: 'It involves a confirmed security breach', correct: false },
      { id: 'failedChange', label: "It followed Tuesday's release", correct: true },
      { id: 'formalRecord', label: 'A formal record is needed because finance has flagged a discrepancy', correct: true },
    ],
  },

  problem: {
    slots: [
      {
        id: 'what',
        label: 'What',
        options: [
          { id: 'what-1', text: 'the checkout is broken', correct: false, feedback: 'Too vague - checkout works, the total is just wrong by a small amount.' },
          { id: 'what-2', text: 'checkout totals are incorrect by a few pence for some orders', correct: true, feedback: 'Precise and matches exactly what customers and finance reported.' },
          { id: 'what-3', text: 'the developer made a coding mistake', correct: false, feedback: 'An assumption about cause and blame, not a description of the symptom.' },
        ],
      },
      {
        id: 'where',
        label: 'Where',
        options: [
          { id: 'where-1', text: 'the VAT calculation in checkout', correct: true, feedback: 'Matches the evidence so far - the discrepancy is in the VAT rounding, not elsewhere.' },
          { id: 'where-2', text: 'the payment gateway', correct: false, feedback: 'Nothing yet points to the payment gateway specifically.' },
          { id: 'where-3', text: 'the whole website', correct: false, feedback: 'Too broad - only totals are affected, not the whole site.' },
        ],
      },
      {
        id: 'who',
        label: 'Who',
        options: [
          { id: 'who-1', text: 'customers buying certain combinations of items', correct: true, feedback: 'Matches the pattern in the complaint tickets.' },
          { id: 'who-2', text: 'every customer, every order', correct: false, feedback: 'Not supported - the discrepancy is small and intermittent, not universal.' },
          { id: 'who-3', text: 'whoever wrote the pricing code', correct: false, feedback: 'A guess about blame, not about who is affected by the fault.' },
        ],
      },
      {
        id: 'when',
        label: 'When',
        options: [
          { id: 'when-1', text: "since Tuesday's release", correct: true, feedback: 'Matches the finance reconciliation and the first customer complaint.' },
          { id: 'when-2', text: 'for as long as the website has existed', correct: false, feedback: 'The discrepancy appears to have started this week, not from the start.' },
          { id: 'when-3', text: 'only at weekends', correct: false, feedback: 'Not supported by the evidence so far.' },
        ],
      },
      {
        id: 'howOften',
        label: 'How often',
        options: [
          { id: 'often-1', text: 'every single order, without exception', correct: false, feedback: "Not supported - only orders with certain item combinations seem affected." },
          { id: 'often-2', text: 'intermittently, for orders with certain item combinations', correct: true, feedback: 'Matches the pattern finance and support have both noticed.' },
          { id: 'often-3', text: 'this is the first time any pricing issue has occurred', correct: false, feedback: 'Not something the brief actually supports either way.' },
        ],
      },
    ],
  },

  containment: {
    options: [
      {
        id: 'contain-rollback',
        text: "Roll back to the previous release while the cause is investigated",
        best: true,
        feedback: 'Restores correct totals quickly, and keeps the faulty code and its history intact for investigation.',
      },
      {
        id: 'contain-flatrate',
        text: 'Disable the VAT calculation module and apply a single flat rate to every order until fixed',
        best: false,
        feedback: 'Risky - a flat rate could be wrong for a different set of orders, trading one pricing error for another.',
      },
      {
        id: 'contain-hotfix',
        text: 'Patch the live production code directly, without review or tests, to stop the clock',
        best: false,
        feedback: 'This overwrites the faulty code before it can be properly diffed and investigated, and risks introducing a second untested change.',
        destroysEvidenceId: 'ev-codediff',
      },
      {
        id: 'contain-refund',
        text: 'Manually refund the few pence difference to affected customers',
        best: false,
        feedback: 'Fair to those customers, but it does not stop the next order from being calculated wrongly too.',
      },
    ],
    finishedQuestion: 'The release has been rolled back. Is the RCA finished?',
    prematureConsequence:
      'Two sprints later, a different change is merged under deadline pressure without review, and a new pricing bug reaches production the same way.',
  },

  evidence: [
    {
      id: 'ev-codediff',
      source: 'Git diff for the merged pull request',
      kind: 'change',
      essential: true,
      destroyedBy: 'contain-hotfix',
      content:
        '- total = round(subtotal * (1 + VAT_RATE), 2)\n' +
        '+ total = sum(round(line.price * (1 + VAT_RATE), 2) for line in lines)\n' +
        '  // changed to round VAT per line for performance',
      relevanceNote: 'Shows the calculation changed from rounding the total once to rounding each line and summing - a classic rounding regression.',
    },
    {
      id: 'ev-ordersample',
      source: 'Sample order calculation trace',
      kind: 'log',
      essential: true,
      content:
        'Order #4482: 3 lines at £3.335 VAT each, rounded individually to £3.34 x 3 = £10.02\n' +
        'Expected (round once): £10.005 x 3 = £10.015, rounded = £10.02... but other combinations differ by 1-2p',
      relevanceNote: 'Shows concretely how rounding per line instead of once produces a different total for some item combinations.',
    },
    {
      id: 'ev-unittest',
      source: 'Test coverage report',
      kind: 'report',
      essential: true,
      content: 'pricing/vat.js: 40% line coverage. The changed rounding branch has no test asserting the total against a known-correct value.',
      relevanceNote: 'Confirms no automated test would have caught this specific regression.',
    },
    {
      id: 'ev-prreview',
      source: 'Pull request record',
      kind: 'report',
      essential: true,
      content: 'PR #1182 "Optimise VAT calculation". Status: merged by author. Review: none requested. Comment: "skipping review, need this in for the deadline".',
      relevanceNote: 'Shows the change was merged without any review, under explicit time pressure.',
    },
    {
      id: 'ev-processdoc',
      source: "Team's code review policy",
      kind: 'config',
      essential: true,
      content: 'Policy: "All pull requests require at least one approving review before merge." No exception process is documented for deadlines, and no tooling enforces the rule.',
      relevanceNote: "Shows a review policy exists on paper, but nothing technical actually enforces it, so it can be skipped under pressure.",
    },
    {
      id: 'ev-financerecon',
      source: 'Finance reconciliation report',
      kind: 'report',
      essential: true,
      content: 'Small discrepancies totalling a few pounds across several hundred orders, beginning Tuesday, none before.',
      relevanceNote: "Confirms the discrepancy is real, small per order, and started exactly when the release went out.",
    },
    {
      id: 'ev-deploylog',
      source: 'Deployment log',
      kind: 'change',
      essential: true,
      content: 'Release 2025.11.4 deployed Tuesday 09:00, including PR #1182.',
      relevanceNote: 'Matches the timing of the first complaint and the start of the finance discrepancy.',
    },
    {
      id: 'ev-ticketlist',
      source: 'Support ticket list',
      kind: 'ticket',
      essential: true,
      content: 'Six tickets since Tuesday, all citing totals 1-2p different from the itemised breakdown, all for multi-item orders.',
      relevanceNote: 'Shows a consistent pattern across several customers, not an isolated one-off.',
    },
    {
      id: 'ev-paymentgateway',
      source: 'Payment gateway status page',
      kind: 'monitoring',
      essential: false,
      content: 'All systems green. No incidents reported this week.',
      relevanceNote: 'Rules out the payment gateway - the discrepancy is in the calculated total, not how it is charged.',
    },
    {
      id: 'ev-currencyrates',
      source: 'Currency exchange rate log',
      kind: 'report',
      essential: false,
      content: 'The site trades in a single currency; no exchange rate conversions are applied at checkout.',
      relevanceNote: 'Rules out currency conversion, which was never part of this checkout flow anyway.',
    },
  ],

  timeline: [
    { id: 'tl-1', text: 'Developer opens a pull request to optimise the VAT calculation', timestamp: 'Monday' },
    { id: 'tl-2', text: 'PR is merged without review to meet the sprint deadline', timestamp: 'Monday 18:00', isChange: true },
    { id: 'tl-3', text: 'Release deployed to production', timestamp: 'Tuesday 09:00' },
    { id: 'tl-4', text: 'First customer complaint about an incorrect total', timestamp: 'Tuesday 14:20' },
    { id: 'tl-5', text: 'Finance flags a small reconciliation discrepancy', timestamp: 'Wednesday 10:00' },
    { id: 'tl-6', text: 'Support has logged six similar complaints', timestamp: 'Thursday 09:30' },
    { id: 'tl-7', text: 'Incident formally raised for investigation', timestamp: 'Thursday 11:00' },
  ],
  firstSymptomEventId: 'tl-4',

  factors: [
    { id: 'fac-rounding', text: 'VAT is rounded per line item and summed, instead of rounding the total once', category: 'possibleRootCause', fishboneCategory: 'technology', feedback: 'Worth investigating further - this is the specific change that produces a different total for some orders.' },
    { id: 'fac-noreview', text: 'The pull request was merged without any review', category: 'contributing', fishboneCategory: 'process', feedback: 'A contributing factor: a second pair of eyes would likely have questioned the rounding change.' },
    { id: 'fac-notest', text: 'No unit test covered the changed rounding path', category: 'contributing', fishboneCategory: 'technology', feedback: 'A contributing factor: automated testing had no chance to catch this before release.' },
    { id: 'fac-noenforcement', text: "The review policy exists on paper but nothing enforces it under deadline pressure", category: 'contributing', fishboneCategory: 'process', feedback: 'A contributing factor: this is why the policy could be skipped at all.' },
    { id: 'fac-blame-dev', text: 'The developer who wrote the change made a mistake', category: 'notRelevant', fishboneCategory: 'people', feedback: 'Everybody makes coding mistakes sometimes - the real issue is why nothing in the process caught this one before it reached customers.' },
    { id: 'fac-payment', text: 'The payment gateway status page shows no incidents', category: 'notRelevant', fishboneCategory: 'technology', feedback: 'Not relevant - the payment gateway was never implicated.' },
  ],

  fiveWhys: {
    startStatement: 'Checkout totals are incorrect by a few pence for some orders.',
    levels: [
      {
        options: [
          { id: 'l1-correct', text: 'The VAT calculation now rounds each line item individually and sums the rounded values, instead of rounding the total once', tag: 'correct', feedback: 'Right - the order trace shows exactly this mechanism producing a different total.' },
          { id: 'l1-restate', text: 'The totals are wrong', tag: 'restatement', feedback: 'That restates the symptom rather than explaining it.' },
          { id: 'l1-leap', text: 'The payment gateway is overcharging customers', tag: 'leap', feedback: 'The payment gateway status page shows no incidents - this skips a link in the chain.' },
          { id: 'l1-blame', text: 'The developer who touched the pricing code made an error', tag: 'blame', feedback: 'This blames a person instead of explaining the mechanism.' },
        ],
        supportingEvidenceIds: ['ev-ordersample'],
        justification: {
          id: 'j1',
          prompt: 'In one sentence, explain how the evidence supports this answer.',
          minWords: 8,
          concepts: [{ label: 'Cites the order calculation trace', terms: ['order trace', 'per line', 'round each', 'line item'], required: true }],
          modelAnswer: 'The order calculation trace shows rounding each line individually and summing produces a different total than rounding once at the end.',
        },
        stopsTooEarly: false,
      },
      {
        options: [
          { id: 'l2-correct', text: 'A pull request changed the rounding approach to improve performance, and that change was merged', tag: 'correct', feedback: 'Right - the git diff shows exactly this change.' },
          { id: 'l2-restate', text: 'The code was changed', tag: 'restatement', feedback: 'That restates the previous level without explaining why the change reached production.' },
          { id: 'l2-leap', text: 'The database stores prices with the wrong precision', tag: 'leap', feedback: 'The diff shows the rounding logic itself changed - this is not a database precision issue.' },
          { id: 'l2-unrelated', text: "Last year's website redesign changed the checkout layout", tag: 'unrelated', feedback: 'The layout is unrelated to how the total is calculated.' },
        ],
        supportingEvidenceIds: ['ev-codediff'],
        justification: {
          id: 'j2',
          prompt: 'In one sentence, explain how the evidence supports this answer.',
          minWords: 8,
          concepts: [{ label: 'Cites the code diff', terms: ['diff', 'pull request', 'round per line', 'merged'], required: true }],
          modelAnswer: 'The git diff for the merged pull request shows the rounding call moved from the total to each line, explicitly for performance.',
        },
        stopsTooEarly: true,
        stopFeedback: 'If you only revert this one change, nothing stops the next risky change reaching production the same way. Why did this change reach production without being caught?',
      },
      {
        options: [
          { id: 'l3-correct', text: 'No unit test covered the changed rounding path, so the regression was not caught automatically', tag: 'correct', feedback: 'Right - the coverage report confirms this exact branch had no test.' },
          { id: 'l3-restate', text: 'Testing missed it', tag: 'restatement', feedback: 'That restates the gap without pointing at what specifically was missing.' },
          { id: 'l3-leap', text: 'The test environment was down that week', tag: 'leap', feedback: 'Nothing in the evidence suggests the test environment was unavailable - the issue is a coverage gap, not an outage.' },
          { id: 'l3-blame', text: 'The QA team should have caught this manually', tag: 'blame', feedback: 'This blames a team rather than pointing at the specific missing automated coverage.' },
        ],
        supportingEvidenceIds: ['ev-unittest'],
        justification: {
          id: 'j3',
          prompt: 'In one sentence, explain how the evidence supports this answer.',
          minWords: 8,
          concepts: [{ label: 'Cites the test coverage gap', terms: ['coverage', 'unit test', 'no test', 'untested'], required: true }],
          modelAnswer: 'The coverage report shows the changed rounding branch had no test asserting the total against a known-correct value.',
        },
        stopsTooEarly: false,
      },
      {
        options: [
          { id: 'l4-correct', text: "The review was skipped to meet the sprint deadline, which the team's process allowed because nothing enforced the review policy", tag: 'correct', feedback: 'Right - the PR record and the review policy together show this exact gap.' },
          { id: 'l4-restate', text: 'Nobody reviewed it properly', tag: 'restatement', feedback: 'That restates the gap without explaining why it was allowed to happen.' },
          { id: 'l4-leap', text: 'The usual reviewer happened to be on holiday that week', tag: 'leap', feedback: 'The PR record shows review was never requested at all, not that a specific reviewer was unavailable.' },
          { id: 'l4-blame', text: 'The developer should not have merged their own change without a review', tag: 'blame', feedback: "True in isolation, but it does not explain why the process let a developer merge without a review at all. What allowed that?" },
        ],
        supportingEvidenceIds: ['ev-prreview', 'ev-processdoc'],
        justification: {
          id: 'j4',
          prompt: 'In one sentence, explain how the evidence supports this answer.',
          minWords: 8,
          concepts: [{ label: 'Cites the skipped review and the unenforced policy', terms: ['review', 'policy', 'enforce', 'deadline'], required: true }],
          modelAnswer: 'The PR record shows the review was explicitly skipped for the deadline, and the policy document shows nothing technical actually enforces a review before merge.',
        },
        stopsTooEarly: false,
      },
    ],
  },

  rootCause: {
    candidates: [
      { id: 'rc-symptom', type: 'symptom', text: 'Checkout totals are wrong for some orders', feedback: 'This is the symptom you started from, not an explanation of it.' },
      { id: 'rc-immediate', type: 'immediate', text: 'VAT is rounded per line item and summed instead of rounding the total once', feedback: 'This is the immediate mechanism, but it does not explain why this change reached production unnoticed.' },
      { id: 'rc-blame', type: 'blame', text: 'The developer who wrote the change made a mistake', feedback: 'This blames a person rather than the process that let an unreviewed, untested change reach production.' },
      { id: 'rc-root', type: 'root', text: 'No unit test covered the changed rounding path, and the team\'s review policy was not enforced, so a rounding regression reached production under deadline pressure', feedback: 'This explains the mechanism and the missing safeguards, and points to fixes rather than blame.' },
    ],
    criteria: [
      { id: 'crit-recur', question: 'Would removing it prevent recurrence?', correctAnswerForRoot: true, needsEvidence: true, supportingEvidenceIds: ['ev-processdoc'] },
      { id: 'crit-explain', question: 'Does it explain the symptoms and "why now"?', correctAnswerForRoot: true, needsEvidence: false },
      { id: 'crit-support', question: 'Is it supported by logs, configs or measurements?', correctAnswerForRoot: true, needsEvidence: true, supportingEvidenceIds: ['ev-unittest', 'ev-codediff'] },
      { id: 'crit-action', question: 'Does it point to an action that improves the system, not just to blame?', correctAnswerForRoot: true, needsEvidence: false },
    ],
    statement: {
      id: 'rc-statement',
      prompt: 'Write the root cause statement in your own words.',
      minWords: 15,
      concepts: [
        { label: 'Names the missing test coverage', terms: ['test', 'unit test', 'coverage'], required: true },
        { label: 'Names the skipped or unenforced review process', terms: ['review', 'process', 'deadline', 'enforce'], required: false },
      ],
      modelAnswer:
        'No unit test covered the changed rounding path, and the team\'s review policy was never enforced, so when the change was merged without review to meet a deadline, the regression reached production unnoticed.',
    },
  },

  actions: [
    { id: 'act-add-tests', text: 'Add unit tests that assert checkout totals against known-correct values, including the rounding edge cases', category: 'preventative', feedback: 'Preventative - gives automated testing a real chance to catch this class of regression.' },
    { id: 'act-enforce-review', text: 'Make the review policy technically enforced (e.g. a required approval before merge is allowed), with no silent exceptions', category: 'preventative', feedback: 'Preventative - closes the gap that let a policy exist on paper but not in practice.' },
    { id: 'act-revert', text: 'Revert the rounding change immediately', category: 'corrective', feedback: 'Corrective - fixes today\'s totals but does not by itself prevent the next unreviewed change.' },
    { id: 'act-fix-finance', text: "Correct finance's reconciliation records for the affected period", category: 'corrective', feedback: 'Corrective - cleans up the specific discrepancy already caused.' },
    { id: 'act-discipline-dev', text: 'Formally discipline the developer who wrote the change', category: 'notAppropriate', feedback: 'Not appropriate - blames an individual instead of fixing the process that let it through.' },
    { id: 'act-remove-permissions', text: "Permanently remove that developer's ability to merge any code", category: 'notAppropriate', feedback: 'Not appropriate - disproportionate, and the same gap would let anyone else\'s unreviewed change through too.' },
    { id: 'act-rounding-ci-check', text: 'Add an automated check in CI that compares calculated totals against a reference rounding implementation', category: 'preventative', feedback: 'Preventative - catches this entire class of rounding bug automatically, not just this one instance.' },
    { id: 'act-adjust-deadlines', text: 'Review sprint planning so review time is budgeted into every deadline, not treated as optional', category: 'preventative', feedback: 'Preventative - removes the pressure that made skipping review seem necessary.' },
  ],
  chooseOnePreventative: {
    id: 'pref-explain',
    prompt: 'Choose one preventative action and explain how it stops this root cause recurring.',
    minWords: 20,
    concepts: [
      { label: 'Names a specific preventative action', terms: ['test', 'review', 'enforce', 'ci check'], required: true },
      { label: 'Links the action to preventing recurrence', terms: ['recur', 'prevent', 'again', 'future', 'before it'], required: false },
    ],
    modelAnswer:
      'Making the review policy technically enforced means no pull request can be merged without an approval, so a future rounding-style regression would be caught by a second reviewer before it ever reaches production.',
  },

  verification: {
    steps: [
      { id: 'ver-1', text: 'Confirm the new unit test fails on the old buggy code and passes on the fix', correct: true, feedback: 'A direct test of the fix against the original failure condition.' },
      { id: 'ver-2', text: 'Confirm the merge tooling actually blocks a test pull request that has no approval', correct: true, feedback: 'Confirms the enforcement mechanism works, not just the policy document.' },
      { id: 'ver-3', text: 'Ask customers if the checkout feels easier to use', correct: false, feedback: 'Subjective and unrelated to verifying this specific fix.' },
      { id: 'ver-4', text: 'Monitor finance reconciliation for the next month', correct: true, feedback: 'A real-world check that the fix holds under normal use.' },
      { id: 'ver-5', text: 'Re-test the payment gateway', correct: false, feedback: 'Irrelevant - the payment gateway was never implicated.' },
      { id: 'ver-6', text: 'Check currency exchange rates are up to date', correct: false, feedback: 'Unrelated - this checkout only ever traded in one currency.' },
    ],
    pickCount: 2,
    monitoring: [
      { id: 'mon-1', text: 'Run an automated nightly job comparing calculated totals to a rounding-safe reference calculation, and alert on any mismatch', correct: true, feedback: 'Catches this entire class of rounding bug automatically and quickly.' },
      { id: 'mon-2', text: 'Check totals manually once a term', correct: false, feedback: 'Far too infrequent to catch a regression affecting live orders.' },
      { id: 'mon-3', text: 'Only investigate if finance happens to notice a discrepancy', correct: false, feedback: 'Reactive and slow - finance only noticed this one after several days.' },
      { id: 'mon-4', text: 'Ask customers to self-report any mismatches', correct: false, feedback: 'Reactive, not monitoring - most customers will not notice a few pence difference.' },
    ],
  },

  lessonsLearned: {
    id: 'lessons-checkout',
    prompt: 'Write a two or three sentence lessons-learned note for a knowledge base article.',
    minWords: 20,
    concepts: [
      { label: 'Generalises beyond this one calculation', terms: ['any calculation', 'general', 'across', 'other'], required: false },
      { label: 'Names a reusable preventative principle', terms: ['test', 'review', 'enforce'], required: true },
    ],
    modelAnswer:
      'A policy that is not technically enforced can always be skipped under deadline pressure, so review gates should be built into the tooling, not left to good intentions. Rounding and currency logic especially need explicit test cases, since small regressions are easy to miss by eye.',
  },
};

export default scenario;
