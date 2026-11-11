/**
 * Technique primer data (/learn, section 9.1). Two short, unscored
 * interactive refreshers taken from the handout's worked examples,
 * plus the surrounding teaching content: why RCA matters, how to spot
 * a distractor, and what makes a root cause strong enough to hold up.
 */

/** Short framing read before any interactive content on /learn. */
export const rcaIntro = {
  paragraphs: [
    'Most people can already recite the definition of root cause analysis. What catches students out is doing it under a bit of pressure: a server is down, a customer is upset, and an obvious story - "someone made a mistake" - is sitting right there waiting to be written down. Root cause analysis is the discipline of not stopping at that story.',
    'A root cause that actually holds up explains the symptom, is backed by evidence you can point to, and - if you removed it - would stop the problem coming back. A weak one is usually one of three things in disguise: a restatement of the symptom in different words, a guess with no evidence behind it, or a person to blame. All three feel satisfying to write down. None of them survive the four tests in this primer, or the scenarios that follow it.',
  ],
};

/**
 * @typedef {Object} DistractorType
 * @property {'correct'|'restatement'|'leap'|'blame'|'unrelated'} tag
 * @property {string} label
 * @property {string} example
 * @property {string} note
 */

/**
 * The five answer types used throughout the 5 Whys chains (section
 * 8.1), shown here as a reference table before students meet them for
 * real inside a scenario.
 * @type {DistractorType[]}
 */
export const distractorTypes = [
  {
    tag: 'correct',
    label: 'Supported next link',
    example: 'The domain controller is not responding.',
    note: 'Traces the symptom to a specific, checkable condition - and there is evidence to back it.',
  },
  {
    tag: 'restatement',
    label: 'Restatement',
    example: 'Users cannot sign in.',
    note: 'Same symptom, different words. It feels like progress but adds no new information.',
  },
  {
    tag: 'leap',
    label: 'Leap',
    example: 'The server was hacked.',
    note: 'Plausible-sounding, but it skips a link in the chain and has no evidence behind it yet.',
  },
  {
    tag: 'blame',
    label: 'Blame',
    example: 'The admin forgot to check the disk.',
    note: 'Stops at a person instead of asking what let that one person\'s mistake take the whole system down.',
  },
  {
    tag: 'unrelated',
    label: 'Unrelated fact',
    example: 'The server is five years old.',
    note: 'Might well be true. It does not explain why this incident happened today.',
  },
];

/**
 * @typedef {Object} DistractorPracticeItem
 * @property {string} id
 * @property {string} statement
 * @property {'correct'|'restatement'|'leap'|'blame'|'unrelated'} tag
 */

/**
 * A short, unscored tagging exercise: for each statement, decide which
 * of the five types above it is. Used on /learn before students meet
 * live distractors inside a scored scenario.
 * @type {DistractorPracticeItem[]}
 */
export const distractorPractice = [
  { id: 'dp-1', statement: 'The application crashed because it ran out of available memory.', tag: 'correct' },
  { id: 'dp-2', statement: 'The application stopped working correctly.', tag: 'restatement' },
  { id: 'dp-3', statement: 'A competitor must have deliberately attacked the server.', tag: 'leap' },
  { id: 'dp-4', statement: 'The on-call engineer should have noticed the warning sooner.', tag: 'blame' },
  { id: 'dp-5', statement: 'The application was built on an older framework version.', tag: 'unrelated' },
];

/**
 * @typedef {Object} RootCauseCriterion
 * @property {string} id
 * @property {string} question
 * @property {string} explanation
 */

/**
 * The same four criteria every scenario's Stage 6 tests a candidate
 * root cause against (see any scenario's `rootCause.criteria`),
 * reproduced here with the reasoning behind each one spelled out.
 * @type {RootCauseCriterion[]}
 */
export const rootCauseCriteria = [
  {
    id: 'crit-recur',
    question: 'Would removing it prevent recurrence?',
    explanation: 'If the same conditions could still cause the same incident next month, this is not the root yet - keep asking why.',
  },
  {
    id: 'crit-explain',
    question: 'Does it explain the symptoms and "why now"?',
    explanation: 'A real root cause accounts for why this happened on this day, not just in general.',
  },
  {
    id: 'crit-support',
    question: 'Is it supported by logs, configs or measurements?',
    explanation: 'An unsupported root cause is an opinion. Every scenario checks this by asking you to attach the evidence.',
  },
  {
    id: 'crit-action',
    question: 'Does it point to an action that improves the system, not just to blame?',
    explanation: 'If the only fix available is "tell someone to be more careful", the analysis has stopped at a person, not a cause.',
  },
];

/**
 * @typedef {Object} RootCauseExample
 * @property {string} id
 * @property {string} text
 * @property {'strong'|'weak'} verdict
 * @property {string} reason
 */

/**
 * Candidate root cause statements for students to sort as strong or
 * weak against the four criteria above, with the reasoning behind
 * each verdict.
 * @type {RootCauseExample[]}
 */
export const rootCauseExamples = [
  {
    id: 'rc-ex-1',
    text: 'The technician forgot to renew the certificate.',
    verdict: 'weak',
    reason: 'Stops at a person. Ask why the renewal depended on one person remembering, with nothing to catch it if they did not.',
  },
  {
    id: 'rc-ex-2',
    text: 'The website stopped working.',
    verdict: 'weak',
    reason: 'This is the symptom restated, not a cause of it.',
  },
  {
    id: 'rc-ex-3',
    text: 'There was no automated alert for certificates expiring within 14 days, so a manual renewal step was missed during normal staff turnover.',
    verdict: 'strong',
    reason: 'Names a specific missing safeguard, is checkable against the alerting configuration, and points straight at a fix.',
  },
  {
    id: 'rc-ex-4',
    text: 'The IT team is understaffed.',
    verdict: 'weak',
    reason: 'Probably true, but too vague to act on and not specific to why this incident happened.',
  },
];

/**
 * @typedef {Object} PrimerWhyStep
 * @property {string} question    always "Why?" after the first level
 * @property {string} answer      revealed after the student predicts
 * @property {string} explanation
 */

export const primerFiveWhys = {
  startStatement: 'Users cannot log in.',
  steps: [
    { question: 'Why?', answer: 'The domain controller is not responding.', explanation: 'The first link: the symptom traced to a specific failing system.' },
    { question: 'Why?', answer: 'Its hard disk is full.', explanation: 'A concrete, checkable condition - not a guess.' },
    { question: 'Why?', answer: 'The event log grew without limit.', explanation: 'Explains why the disk filled, not just that it did.' },
    { question: 'Why?', answer: 'Log rotation was never configured.', explanation: 'A missing safeguard, not a person to blame.' },
    { question: 'Why?', answer: 'No one was ever assigned responsibility for routine server maintenance tasks like this.', explanation: 'The root cause: a process gap that let the missing safeguard go unnoticed indefinitely.' },
  ],
};

/**
 * @typedef {Object} PrimerFtaNode
 * @property {string} id
 * @property {string} label
 * @property {'AND'|'OR'|null} correctGate   null for leaves
 * @property {string[]} children
 * @property {string} [gateFeedback]
 */

export const primerFta = {
  rootId: 'top',
  decisionNodeIds: ['top', 'serverCrash'],
  nodes: {
    top: {
      id: 'top',
      label: 'Website is down',
      correctGate: 'OR',
      children: ['serverCrash', 'dnsFailure'],
      gateFeedback: 'Either the server crashing or a DNS failure alone would take the site down, so this is an OR gate.',
    },
    dnsFailure: { id: 'dnsFailure', label: 'DNS records point to the wrong server', correctGate: null, children: [] },
    serverCrash: {
      id: 'serverCrash',
      label: 'The server crashed',
      correctGate: 'AND',
      children: ['memoryLeak', 'restartDisabled'],
      gateFeedback:
        'A memory leak alone would normally trigger an automatic restart with no real outage. The crash only became an ' +
        'outage because the automatic restart had also been disabled. Both were needed together, so this is an AND gate.',
    },
    memoryLeak: { id: 'memoryLeak', label: 'A memory leak filled all available RAM', correctGate: null, children: [] },
    restartDisabled: { id: 'restartDisabled', label: 'The automatic restart script had been disabled', correctGate: null, children: [] },
  },
};

/**
 * @typedef {Object} TechniqueSummary
 * @property {string} technique
 * @property {boolean} core        true for the two techniques this app marks in depth
 * @property {string} useWhen
 * @property {string} strength
 * @property {string} risk
 */

/** @type {TechniqueSummary[]} */
export const techniqueSummary = [
  {
    technique: '5 Whys',
    core: true,
    useWhen: 'A single, fairly linear chain of cause and effect - one thing led to another.',
    strength: 'Quick and simple. Good for a single chain of cause and effect.',
    risk: 'Can become opinion-based if you skip evidence, and it is easy to stop too early.',
  },
  {
    technique: 'Fault Tree Analysis',
    core: true,
    useWhen: 'Several possible causes at once, or causes that only matter in combination.',
    strength: 'Systematic and testable with evidence. Handles several causes, including combinations that need AND logic.',
    risk: 'Can be overkill for a simple problem, and the gate logic has to be right or the whole tree misleads.',
  },
  {
    technique: 'Fishbone',
    core: false,
    useWhen: 'Early on, when the contributing factors are not yet narrowed down.',
    strength: 'Good for brainstorming a wide range of contributing factors across categories (people, process, technology...).',
    risk: 'Does not by itself tell you which factor is the real cause - it is a starting point, not a conclusion.',
  },
  {
    technique: 'Pareto',
    core: false,
    useWhen: 'Deciding which of several recurring problems is worth investigating first.',
    strength: 'Helps prioritise where limited RCA effort is best spent.',
    risk: 'The highest-frequency category is not always the most significant one to fix.',
  },
  {
    technique: 'Timeline and Change Analysis',
    core: false,
    useWhen: 'A problem that started suddenly, where something changed recently.',
    strength: 'Good at linking a specific change to exactly when symptoms began.',
    risk: 'Correlation in time is a clue, not proof - something else could coincidentally line up too.',
  },
];
