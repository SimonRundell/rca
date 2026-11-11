/**
 * Scenario 6: The 9am slowdown (capstone).
 * Development / FTA then 5 Whys / difficulty 3.
 * Root cause (outline): FTA isolates slow database queries. 5 Whys then
 * finds an index dropped by a migration, untested because the test
 * database held a fraction of production data.
 * `technique: 'both'` - Stage 5 runs the fault tree first to narrow down
 * to "a missing index", then runs 5 Whys starting from that confirmed
 * leaf to go deeper into why it was missing and why nothing caught it.
 */

const scenario = {
  id: 'slow-api',
  title: 'The 9am slowdown',
  domain: 'development',
  difficulty: 3,
  technique: 'both',
  estimatedMinutes: 35,

  briefing: {
    ticketRef: 'INC-8810',
    loggedAt: 'Thursday 09:20',
    reports: [
      '"The app has been crawling every morning around 9, three days running now." - Support lead, 09:12',
      '"Some requests are timing out completely during the morning rush." - On-call engineer, 09:15',
      '"This is the third day in a row, customers are noticing." - Customer success, 09:20',
    ],
    question: 'Does this warrant a full Root Cause Analysis?',
    correctWarrantsRca: true,
    reasons: [
      { id: 'recurring', label: 'It has happened every morning for three days', correct: true },
      { id: 'highImpact', label: 'It affects the whole platform during peak usage', correct: true },
      { id: 'security', label: 'It involves a confirmed security breach', correct: false },
      { id: 'failedChange', label: 'It may be linked to a recent database migration', correct: true },
      { id: 'formalRecord', label: 'A formal record is required', correct: false },
    ],
  },

  problem: {
    slots: [
      {
        id: 'what',
        label: 'What',
        options: [
          { id: 'what-1', text: 'the app is laggy', correct: false, feedback: 'Too vague to act on.' },
          { id: 'what-2', text: 'API responses are much slower than normal, with some requests timing out', correct: true, feedback: 'Precise and matches exactly what was reported.' },
          { id: 'what-3', text: 'the database has crashed', correct: false, feedback: 'An assumption about cause - the database is still up and responding, just slowly.' },
        ],
      },
      {
        id: 'where',
        label: 'Where',
        options: [
          { id: 'where-1', text: 'across the whole platform, worst during the morning peak', correct: true, feedback: 'Matches the reports from multiple teams.' },
          { id: 'where-2', text: 'only the login page', correct: false, feedback: 'Not supported - the reports describe general slowness, not one page.' },
          { id: 'where-3', text: 'only for customers outside the country', correct: false, feedback: 'No evidence of a geographic pattern.' },
        ],
      },
      {
        id: 'who',
        label: 'Who',
        options: [
          { id: 'who-1', text: 'all users making requests during the morning peak', correct: true, feedback: 'Matches the pattern reported by support and on-call.' },
          { id: 'who-2', text: 'only users on a specific browser', correct: false, feedback: 'Not supported by the brief.' },
          { id: 'who-3', text: 'whoever wrote the recent migration', correct: false, feedback: 'A guess about blame, not about who is affected.' },
        ],
      },
      {
        id: 'when',
        label: 'When',
        options: [
          { id: 'when-1', text: 'every weekday morning around 9am, for the past three days', correct: true, feedback: 'Matches the reports precisely.' },
          { id: 'when-2', text: 'constantly, all day every day', correct: false, feedback: 'The reports specifically describe a morning peak pattern.' },
          { id: 'when-3', text: 'this has always happened', correct: false, feedback: 'The reports say this started three days ago, not always.' },
        ],
      },
      {
        id: 'howOften',
        label: 'How often',
        options: [
          { id: 'often-1', text: 'daily, specifically during the highest-traffic period', correct: true, feedback: 'Matches the three-day pattern described in the reports.' },
          { id: 'often-2', text: 'randomly, with no pattern', correct: false, feedback: "There is a clear daily, time-of-day pattern - it is not random." },
          { id: 'often-3', text: 'this is the first time any slowdown has occurred', correct: false, feedback: 'The reports describe three consecutive days, not a single occurrence.' },
        ],
      },
    ],
  },

  containment: {
    options: [
      {
        id: 'contain-scale-app',
        text: 'Add more application server instances to absorb the extra load',
        best: false,
        feedback: 'May reduce queueing slightly, but it does not address slow database queries, which is where the time is really going.',
      },
      {
        id: 'contain-read-replica',
        text: 'Add a temporary database read replica and route some read traffic to it while investigating',
        best: true,
        feedback: 'Eases the load without touching the migration history or query logs you need to investigate.',
      },
      {
        id: 'contain-blind-rollback',
        text: 'Roll back the most recent database migration immediately, without first checking what it changed',
        best: false,
        feedback: 'This might fix it, but doing it blind also risks losing the migration review record you need to confirm exactly what changed and why.',
        destroysEvidenceId: 'ev-migrationdiff',
      },
      {
        id: 'contain-restart-db',
        text: 'Restart the database server',
        best: false,
        feedback: 'May briefly help via cache effects, but the missing index is still missing, so the same slowdown returns at the next peak.',
      },
    ],
    finishedQuestion: 'A temporary read replica has eased the load. Is the RCA finished?',
    prematureConsequence:
      'Next month, another "cleanup" migration drops a different index that nobody checked against real production usage, and the same slowdown happens again on a different query.',
  },

  evidence: [
    {
      id: 'ev-appcpu',
      source: 'Application server CPU and memory graph',
      kind: 'monitoring',
      essential: true,
      content: 'CPU steady at 35%, memory steady at 60%, throughout the slow period each morning.',
      relevanceNote: 'No resource pressure on the application servers themselves - rules out the app tier as the bottleneck.',
    },
    {
      id: 'ev-network',
      source: 'Network latency and throughput graph',
      kind: 'monitoring',
      essential: true,
      content: 'Latency and throughput between app servers and clients stay within their normal range throughout each incident.',
      relevanceNote: 'Rules out a network-level cause.',
    },
    {
      id: 'ev-thirdparty',
      source: 'Third-party payment and shipping API response times',
      kind: 'monitoring',
      essential: true,
      content: 'Both external APIs respond in their usual 100-200ms range throughout the slowdown each morning.',
      relevanceNote: 'Rules out a downstream third-party dependency as the cause.',
    },
    {
      id: 'ev-dbslowlog',
      source: 'Database slow query log',
      kind: 'log',
      essential: true,
      content:
        'Query `SELECT * FROM orders WHERE customer_id = ? AND order_date > ?`\n' +
        'Average duration during the 9am peak: 4100ms (typical: 18ms).',
      relevanceNote: 'Shows one specific query becoming dramatically slower exactly during the reported slowdown.',
    },
    {
      id: 'ev-queryplan',
      source: 'Query execution plan (EXPLAIN output)',
      kind: 'log',
      essential: true,
      content: 'Plan shows a full table scan of `orders` (40 million rows). No index is being used for this query.',
      relevanceNote: 'Confirms the database is scanning the entire table instead of using an index.',
    },
    {
      id: 'ev-nolocks',
      source: 'Database lock monitoring',
      kind: 'monitoring',
      essential: true,
      content: 'No blocking or long-held locks recorded during any of the three slow mornings.',
      relevanceNote: 'Rules out lock contention as the cause of the slow queries.',
    },
    {
      id: 'ev-trafficgraph',
      source: 'Request volume graph',
      kind: 'monitoring',
      essential: true,
      content: 'Morning traffic rises to its usual weekday peak - a pattern unchanged for months.',
      relevanceNote: 'Traffic volume itself is not unusual, so volume alone cannot explain a 200x increase in query time.',
    },
    {
      id: 'ev-migrationdiff',
      source: 'Database migration script and its review record',
      kind: 'change',
      essential: true,
      destroyedBy: 'contain-blind-rollback',
      content:
        'Migration `2025_11_04_cleanup_indexes.sql`: drops `idx_orders_customer_date`, flagged by an automated linter as ' +
        '"unused index". Pull request passed CI and was approved. No production query-usage statistics were checked before approval.',
      relevanceNote: 'Shows exactly when and why the index was removed, and that nobody checked real usage first.',
    },
    {
      id: 'ev-testdbsize',
      source: 'Test database size report',
      kind: 'config',
      essential: true,
      content: 'The `orders` table in the CI test database holds 500 rows, compared with 40 million rows in production.',
      relevanceNote: 'A full table scan on 500 rows completes in under a millisecond, so the missing index caused no measurable slowdown in testing.',
    },
    {
      id: 'ev-cachehitrate',
      source: 'Cache hit rate (recommendation service)',
      kind: 'monitoring',
      essential: false,
      content: 'Steady at 92%, unchanged from previous weeks.',
      relevanceNote: 'An unrelated subsystem - not implicated by any other evidence.',
    },
  ],

  timeline: [
    { id: 'tl-1', text: "Migration dropping an index flagged as 'unused' is merged", timestamp: '4 days ago', isChange: true },
    { id: 'tl-2', text: 'Migration runs against production during a routine maintenance window', timestamp: '3 days ago, 02:00' },
    { id: 'tl-3', text: 'Average query time rises slightly, below alerting thresholds', timestamp: '3 days ago, 09:00' },
    { id: 'tl-4', text: 'First reports of slow page loads around 9am', timestamp: '2 days ago, 09:10' },
    { id: 'tl-5', text: 'Slowdown repeats, now with some request timeouts', timestamp: 'Yesterday, 09:05' },
    { id: 'tl-6', text: 'Slowdown recurs a third time, incident formally raised', timestamp: 'Today, 09:00' },
  ],
  firstSymptomEventId: 'tl-4',

  factors: [
    { id: 'fac-indexdropped', text: 'A performance-critical index was dropped by a migration', category: 'possibleRootCause', fishboneCategory: 'technology', feedback: 'Worth investigating further - this is the specific change behind the slow queries.' },
    { id: 'fac-testdbsize', text: 'The CI test database is a tiny fraction of the size of production', category: 'contributing', fishboneCategory: 'process', feedback: 'A contributing factor: it meant testing had no way to reveal the real-world impact.' },
    { id: 'fac-nousagecheck', text: 'Nobody checked real production usage statistics before removing the index', category: 'contributing', fishboneCategory: 'process', feedback: 'A contributing factor: this is the specific check that was missing before approval.' },
    { id: 'fac-linter', text: "An automated linter flagged the index as 'unused' based only on the small test database", category: 'contributing', fishboneCategory: 'technology', feedback: 'A contributing factor: the tool\'s judgement was trusted without checking it against production.' },
    { id: 'fac-blame-dev', text: 'The developer who wrote the migration made a mistake', category: 'notRelevant', fishboneCategory: 'people', feedback: 'Trusting an automated "unused index" flag is an understandable mistake - the real gap is why nothing cross-checked it against production.' },
    { id: 'fac-trafficnormal', text: 'Morning traffic volume is unchanged from previous months', category: 'notRelevant', fishboneCategory: 'environment', feedback: 'Not relevant on its own - traffic volume was ruled out as the explanation.' },
  ],

  faultTree: {
    rootId: 'top',
    nodes: {
      top: {
        id: 'top',
        label: 'API responses are slow and some requests time out during the morning peak',
        gate: 'OR',
        children: ['n-appserver', 'n-network', 'n-thirdparty', 'n-dbqueries'],
        gateFeedback: 'Any one of these alone would be enough to slow down responses, so this is an OR gate.',
        buildOptions: [
          { id: 'top-opt-app', label: 'The application servers are overloaded', correct: true },
          { id: 'top-opt-network', label: 'There is a network latency problem', correct: true },
          { id: 'top-opt-third', label: 'A third-party API the platform depends on is slow', correct: true },
          { id: 'top-opt-db', label: 'Database queries are taking far longer than normal', correct: true },
          { id: 'top-opt-cache', label: 'The product recommendation cache has a low hit rate', correct: false, feedback: 'The cache hit rate for that service is steady and unrelated to this incident.' },
        ],
      },
      'n-appserver': {
        id: 'n-appserver', label: 'The application servers are overloaded', gate: null, children: [],
        correctVerdict: 'ruledOut', verdictEvidenceIds: ['ev-appcpu'],
        verdictFeedback: 'CPU and memory stay well within normal range throughout the incident - ruled out.',
      },
      'n-network': {
        id: 'n-network', label: 'There is a network latency problem', gate: null, children: [],
        correctVerdict: 'ruledOut', verdictEvidenceIds: ['ev-network'],
        verdictFeedback: 'Network latency and throughput stay normal throughout - ruled out.',
      },
      'n-thirdparty': {
        id: 'n-thirdparty', label: 'A third-party API the platform depends on is slow', gate: null, children: [],
        correctVerdict: 'ruledOut', verdictEvidenceIds: ['ev-thirdparty'],
        verdictFeedback: 'Both external APIs respond in their usual range throughout - ruled out.',
      },
      'n-dbqueries': {
        id: 'n-dbqueries',
        label: 'Database queries are taking far longer than normal',
        gate: 'OR',
        children: ['n-missingindex', 'n-lockcontention', 'n-highvolume'],
        gateFeedback: 'Any one of these alone could explain slow queries, so this is an OR gate.',
        buildOptions: [
          { id: 'db-opt-index', label: 'A query is missing an index it needs, causing a full table scan', correct: true },
          { id: 'db-opt-lock', label: 'Queries are being blocked by lock contention', correct: true },
          { id: 'db-opt-volume', label: 'An unusual increase in traffic volume is overwhelming the database', correct: true },
          { id: 'db-opt-network', label: 'There is a network latency problem', correct: false, feedback: 'Network latency was already ruled out and belongs directly under the top event, not here.' },
          { id: 'db-opt-app', label: 'The application servers are overloaded', correct: false, feedback: 'App server load was already ruled out and belongs directly under the top event, not here.' },
        ],
      },
      'n-lockcontention': {
        id: 'n-lockcontention', label: 'Queries are being blocked by lock contention', gate: null, children: [],
        correctVerdict: 'ruledOut', verdictEvidenceIds: ['ev-nolocks'],
        verdictFeedback: 'Lock monitoring shows no blocking or long-held locks during any of the slow mornings - ruled out.',
      },
      'n-highvolume': {
        id: 'n-highvolume', label: 'An unusual increase in traffic volume is overwhelming the database', gate: null, children: [],
        correctVerdict: 'ruledOut', verdictEvidenceIds: ['ev-trafficgraph'],
        verdictFeedback: 'Traffic volume matches the usual weekday peak, unchanged for months - ruled out.',
      },
      'n-missingindex': {
        id: 'n-missingindex', label: 'A query is missing an index it needs, causing a full table scan', gate: null, children: [],
        correctVerdict: 'confirmed', verdictEvidenceIds: ['ev-dbslowlog', 'ev-queryplan'],
        verdictFeedback: 'The slow query log and the execution plan both confirm a full table scan where an index should be used - confirmed.',
      },
    },
    pool: [
      { id: 'pool-cache', label: 'The product recommendation cache has a low hit rate' },
    ],
    explanation: {
      id: 'fta-explanation',
      prompt: 'Explain in two sentences how the confirmed cause explains the incident.',
      minWords: 15,
      concepts: [
        { label: 'Names the missing index', terms: ['index', 'missing'], required: true },
        { label: 'Names the full table scan', terms: ['full table scan', 'scan', 'table scan'], required: false },
      ],
      modelAnswer:
        'A query on the orders table is missing an index it relies on, so the database has to scan all 40 million rows instead of looking the rows up directly. That scan is slow enough on its own, but becomes especially painful during the highest-traffic period of the day.',
    },
  },

  fiveWhys: {
    startStatement: 'A required index on the orders table (idx_orders_customer_date) is missing in production.',
    levels: [
      {
        options: [
          { id: 'l1-correct', text: 'A database migration run four days ago deliberately dropped this index', tag: 'correct', feedback: 'Right - the migration script and review record show exactly this change.' },
          { id: 'l1-restate', text: 'The index is not there', tag: 'restatement', feedback: 'That restates the starting statement rather than explaining it.' },
          { id: 'l1-leap', text: 'The database was corrupted during an upgrade', tag: 'leap', feedback: 'Nothing in the evidence points to corruption - the migration record shows a deliberate, reviewed change.' },
          { id: 'l1-blame', text: 'The database administrator should never have let this happen', tag: 'blame', feedback: 'This blames a person instead of explaining the mechanism.' },
        ],
        supportingEvidenceIds: ['ev-migrationdiff'],
        justification: {
          id: 'j1',
          prompt: 'In one sentence, explain how the evidence supports this answer.',
          minWords: 8,
          concepts: [{ label: 'Cites the migration script', terms: ['migration', 'drop', 'cleanup'], required: true }],
          modelAnswer: 'The migration script and review record show the index was deliberately dropped four days ago as part of an "unused index" cleanup.',
        },
        stopsTooEarly: false,
      },
      {
        options: [
          { id: 'l2-correct', text: "A linter flagged the index as 'unused' and the migration removed it based on that flag", tag: 'correct', feedback: 'Right - the migration review record shows exactly this rationale.' },
          { id: 'l2-restate', text: 'Someone wrote a migration to drop it', tag: 'restatement', feedback: 'That restates the previous level without explaining why the migration was written.' },
          { id: 'l2-leap', text: 'It was dropped to intentionally sabotage performance', tag: 'leap', feedback: 'Nothing suggests malicious intent - the record shows a routine, reviewed cleanup.' },
          { id: 'l2-unrelated', text: 'The database software was upgraded to a new major version around the same time', tag: 'unrelated', feedback: 'No evidence links a database software upgrade to this change.' },
        ],
        supportingEvidenceIds: ['ev-migrationdiff'],
        justification: {
          id: 'j2',
          prompt: 'In one sentence, explain how the evidence supports this answer.',
          minWords: 8,
          concepts: [{ label: 'Cites the linter / unused-index flag', terms: ['linter', 'unused', 'flagged'], required: true }],
          modelAnswer: 'The migration review record shows the index was removed specifically because an automated linter flagged it as unused.',
        },
        stopsTooEarly: true,
        stopFeedback: 'Restoring the index fixes today\'s slowdown, but the same mistake could easily happen to a different index tomorrow. Why did nothing catch this before it reached production?',
      },
      {
        options: [
          { id: 'l3-correct', text: 'CI tests run against a test database holding only 500 rows, so a full table scan completed instantly there and the missing index caused no measurable slowdown in testing', tag: 'correct', feedback: 'Right - the test database size report and the slow query log together confirm this.' },
          { id: 'l3-restate', text: 'The tests did not catch it', tag: 'restatement', feedback: 'That restates the gap without explaining why the tests could not have caught it.' },
          { id: 'l3-leap', text: 'The CI pipeline is broken', tag: 'leap', feedback: 'There is no evidence the pipeline itself malfunctioned - it ran correctly against data that was simply too small to expose the problem.' },
          { id: 'l3-blame', text: 'QA should have manually checked every index before approving the migration', tag: 'blame', feedback: 'This blames a team rather than pointing at the specific data-scale gap that made the problem invisible to any reasonable manual check.' },
        ],
        supportingEvidenceIds: ['ev-testdbsize', 'ev-dbslowlog'],
        justification: {
          id: 'j3',
          prompt: 'In one sentence, explain how the evidence supports this answer.',
          minWords: 8,
          concepts: [{ label: 'Cites the test database size', terms: ['500 row', 'test database', 'small', 'tiny'], required: true }],
          modelAnswer: 'The test database size report shows only 500 rows in the orders table, far too few for a missing index to cause any measurable slowdown during testing.',
        },
        stopsTooEarly: false,
      },
      {
        options: [
          { id: 'l4-correct', text: "Nobody checked real production query patterns or data volume before trusting an 'unused index' flag generated from a tiny test database", tag: 'correct', feedback: 'Right - the migration review record confirms no production usage statistics were checked before approval.' },
          { id: 'l4-restate', text: 'Nobody checked properly', tag: 'restatement', feedback: 'That restates the gap without naming what specifically was missing from the check.' },
          { id: 'l4-leap', text: 'The linter tool itself is faulty', tag: 'leap', feedback: 'The linter did what it was designed to do on the data available to it - the gap is that nothing cross-checked its flag against production.' },
          { id: 'l4-blame', text: 'The reviewer who approved the migration should have caught this', tag: 'blame', feedback: 'True in isolation, but it does not explain why the review process had no step to check production usage at all. What allowed that gap?' },
        ],
        supportingEvidenceIds: ['ev-migrationdiff', 'ev-testdbsize'],
        justification: {
          id: 'j4',
          prompt: 'In one sentence, explain how the evidence supports this answer.',
          minWords: 8,
          concepts: [{ label: 'Cites the missing production usage check', terms: ['usage', 'production', 'check', 'statistics'], required: true }],
          modelAnswer: 'The migration review record confirms no production query-usage statistics were checked before the index was approved for removal.',
        },
        stopsTooEarly: false,
      },
    ],
  },

  rootCause: {
    candidates: [
      { id: 'rc-symptom', type: 'symptom', text: 'The API is slow and times out during the morning peak', feedback: 'This is the symptom you started from, not an explanation of it.' },
      { id: 'rc-immediate', type: 'immediate', text: 'A query on the orders table is doing a full table scan', feedback: 'This is the immediate mechanism, but it does not explain why the index was missing or why nothing caught it.' },
      { id: 'rc-blame', type: 'blame', text: 'The developer who wrote the migration made a mistake', feedback: 'Trusting an automated flag is an understandable mistake - this does not explain why nothing cross-checked it against production.' },
      { id: 'rc-root', type: 'root', text: "An automated linter flagged a performance-critical index as unused based on a test database with only 500 rows, and nobody checked real production usage before the migration removed it", feedback: 'This explains the mechanism and the missing safeguard, and points to fixes rather than blame.' },
    ],
    criteria: [
      { id: 'crit-recur', question: 'Would removing it prevent recurrence?', correctAnswerForRoot: true, needsEvidence: true, supportingEvidenceIds: ['ev-testdbsize'] },
      { id: 'crit-explain', question: 'Does it explain the symptoms and "why now"?', correctAnswerForRoot: true, needsEvidence: false },
      { id: 'crit-support', question: 'Is it supported by logs, configs or measurements?', correctAnswerForRoot: true, needsEvidence: true, supportingEvidenceIds: ['ev-dbslowlog', 'ev-queryplan'] },
      { id: 'crit-action', question: 'Does it point to an action that improves the system, not just to blame?', correctAnswerForRoot: true, needsEvidence: false },
    ],
    statement: {
      id: 'rc-statement',
      prompt: 'Write the root cause statement in your own words.',
      minWords: 15,
      concepts: [
        { label: 'Names the missing production usage check', terms: ['usage', 'production', 'check', 'statistics'], required: true },
        { label: 'Names the tiny test database as the reason it was missed', terms: ['test database', '500 row', 'small', 'tiny'], required: false },
      ],
      modelAnswer:
        'An automated linter flagged a performance-critical index as unused based on a test database with only 500 rows, and nobody checked real production usage statistics before the migration removed it, so the index disappeared without anyone realising the impact.',
    },
  },

  actions: [
    { id: 'act-restore-index', text: 'Restore the dropped index immediately', category: 'corrective', feedback: 'Corrective - fixes today\'s slowdown but does not prevent the next index being dropped the same way.' },
    { id: 'act-prod-scale-test', text: 'Give CI a staging database seeded from a production-scale snapshot for any migration that touches indexes', category: 'preventative', feedback: 'Preventative - gives testing a realistic chance of catching this exact class of regression.' },
    { id: 'act-usage-check', text: "Require a production query-usage check before approving any 'unused index' removal", category: 'preventative', feedback: 'Preventative - closes the specific gap that let an automated flag go unverified.' },
    { id: 'act-query-alert', text: 'Add alerting on individual query latency so a regression like this pages someone within minutes, not days', category: 'preventative', feedback: 'Preventative - catches the next regression far faster, whatever causes it.' },
    { id: 'act-discipline-dev', text: 'Formally discipline the developer who wrote the migration', category: 'notAppropriate', feedback: 'Not appropriate - trusting an automated flag is an understandable mistake; blaming the individual does not fix the missing usage check.' },
    { id: 'act-ban-migrations', text: 'Ban all future database migrations that touch indexes', category: 'notAppropriate', feedback: 'Not appropriate - wildly disproportionate, and prevents legitimate maintenance work the database genuinely needs.' },
    { id: 'act-load-test-ci', text: 'Add load testing with production-scale data volume to CI for any migration touching indexes or large tables', category: 'preventative', feedback: 'Preventative - directly addresses the test-scale gap that hid this problem.' },
    { id: 'act-senior-review', text: 'Require a senior database engineer to review any migration that removes an index, backed by a real usage check', category: 'preventative', feedback: 'Preventative - adds expert judgement at exactly the point this gap occurred.' },
  ],
  chooseOnePreventative: {
    id: 'pref-explain',
    prompt: 'Choose one preventative action and explain how it stops this root cause recurring.',
    minWords: 20,
    concepts: [
      { label: 'Names a specific preventative action', terms: ['usage', 'production-scale', 'load test', 'review', 'alert'], required: true },
      { label: 'Links the action to preventing recurrence', terms: ['recur', 'prevent', 'again', 'future', 'before it'], required: false },
    ],
    modelAnswer:
      'Requiring a production query-usage check before any "unused index" removal means a future linter flag could not be acted on blindly - someone would have to confirm against real traffic first.',
  },

  verification: {
    steps: [
      { id: 'ver-1', text: 'Confirm restoring the index brings the query back to its normal ~20ms in a load test', correct: true, feedback: 'A direct test of the fix against the original failure condition.' },
      { id: 'ver-2', text: 'Confirm a production-scale staging database catches a similar dropped-index regression in a trial run', correct: true, feedback: 'Confirms the new safeguard actually works, not just that a policy exists.' },
      { id: 'ver-3', text: 'Ask users if the app subjectively feels faster now', correct: false, feedback: 'Subjective and does not verify the specific technical fix.' },
      { id: 'ver-4', text: 'Monitor latency for this specific query over the next two weeks', correct: true, feedback: 'A real-world check that the fix holds under normal use.' },
      { id: 'ver-5', text: 'Re-check third-party API response times', correct: false, feedback: 'Irrelevant - third-party APIs were never implicated.' },
      { id: 'ver-6', text: 'Check the cache hit rate for the recommendation service', correct: false, feedback: 'Unrelated subsystem, not implicated by any evidence.' },
    ],
    pickCount: 2,
    monitoring: [
      { id: 'mon-1', text: "Alert when any individual query's average latency increases by more than 5x its historical baseline", correct: true, feedback: 'Catches this exact failure mode - and similar ones - quickly, regardless of overall traffic volume.' },
      { id: 'mon-2', text: 'Check query performance manually once a term', correct: false, feedback: 'Far too infrequent - this regression went unnoticed by anything slower than daily peaks.' },
      { id: 'mon-3', text: 'Only investigate if users complain', correct: false, feedback: 'Reactive - this already took three days of complaints to escalate.' },
      { id: 'mon-4', text: 'Alert only when the whole site is completely unreachable', correct: false, feedback: 'Too coarse - a 200x slowdown on one query would never trigger a whole-site outage alert.' },
    ],
  },

  lessonsLearned: {
    id: 'lessons-slowapi',
    prompt: 'Write a two or three sentence lessons-learned note for a knowledge base article.',
    minWords: 20,
    concepts: [
      { label: 'Generalises beyond this one index', terms: ['any index', 'other migration', 'general', 'across'], required: false },
      { label: 'Names a reusable preventative principle', terms: ['production-scale', 'usage check', 'real data', 'load test'], required: true },
    ],
    modelAnswer:
      'An automated "unused" flag is only as good as the data it was measured against, so any index removal needs a real production usage check, not just a clean test run. Test and staging databases should be seeded at something closer to production scale whenever performance at scale actually matters.',
  },
};

export default scenario;
