/**
 * Scenario 3: Website down after Friday's release.
 * Development / FTA / difficulty 2.
 * Root cause (outline): app crashes on start because a required
 * environment variable is missing in production. The deployment
 * checklist had no config validation step and staging did not match
 * production.
 *
 * Fault tree node shape extends the DESIGN.md TreeNode typedef with one
 * authoring-time field used only during Pass 1 (build):
 * @typedef {Object} BuildOption
 * @property {string} id
 * @property {string} label
 * @property {boolean} correct    true if this is really a direct cause of the node being built
 * @property {string} [feedback]  shown when the student picks a wrong one
 *
 * Each non-leaf TreeNode also carries `buildOptions: BuildOption[]` - the
 * cause pool offered to the student for that node. Each leaf TreeNode
 * carries `correctVerdict`, `verdictEvidenceIds` and `verdictFeedback`,
 * used to mark Pass 2 (eliminate) against the student's own verdict.
 */

const scenario = {
  id: 'site-down',
  title: "Website down after Friday's release",
  domain: 'development',
  difficulty: 2,
  technique: 'fta',
  estimatedMinutes: 30,

  briefing: {
    ticketRef: 'INC-9031',
    loggedAt: 'Friday 09:06',
    reports: [
      '"The website just shows a 500 error for me, every page." - Customer, 09:05',
      '"Same here, nothing loads, this started right after lunch." - Customer, 09:07',
      '"Support queue is filling up fast with the same complaint." - Support lead, 09:12',
    ],
    question: 'Does this warrant a full Root Cause Analysis?',
    correctWarrantsRca: true,
    reasons: [
      { id: 'recurring', label: 'It is a recurring problem, not a one-off', correct: false },
      { id: 'highImpact', label: 'It makes the website unusable for every customer', correct: true },
      { id: 'security', label: 'It involves a confirmed security breach', correct: false },
      { id: 'failedChange', label: "It followed today's release", correct: true },
      { id: 'formalRecord', label: 'A formal record is required for an outage of this severity', correct: true },
    ],
  },

  problem: {
    slots: [
      {
        id: 'what',
        label: 'What',
        options: [
          { id: 'what-1', text: 'the website is broken', correct: false, feedback: 'Too vague to act on.' },
          { id: 'what-2', text: 'the deployment pipeline is broken', correct: false, feedback: 'An assumption about the cause, not a description of the symptom users see.' },
          { id: 'what-3', text: 'every page returns a 500 error to all visitors', correct: true, feedback: 'Precise and matches exactly what was reported.' },
        ],
      },
      {
        id: 'where',
        label: 'Where',
        options: [
          { id: 'where-1', text: 'the production website', correct: true, feedback: 'Matches the reports - this is a live customer-facing outage.' },
          { id: 'where-2', text: 'just the checkout page', correct: false, feedback: 'The reports say every page, not one specific page.' },
          { id: 'where-3', text: 'the internal admin tools', correct: false, feedback: 'No reports mention internal tools.' },
        ],
      },
      {
        id: 'who',
        label: 'Who',
        options: [
          { id: 'who-1', text: 'every visitor to the website', correct: true, feedback: 'Matches the scope of the customer reports.' },
          { id: 'who-2', text: 'only customers using an old browser', correct: false, feedback: 'Not supported - the reports do not mention browser version.' },
          { id: 'who-3', text: "whoever wrote today's release", correct: false, feedback: 'A guess about blame, not about who is affected.' },
        ],
      },
      {
        id: 'when',
        label: 'When',
        options: [
          { id: 'when-1', text: "since this morning's release, from around 09:00", correct: true, feedback: "Matches the timing in the reports and today's deployment." },
          { id: 'when-2', text: 'at some point this week', correct: false, feedback: 'The reports give a precise time window.' },
          { id: 'when-3', text: 'every Friday afternoon', correct: false, feedback: 'Nothing supports a weekly pattern.' },
        ],
      },
      {
        id: 'howOften',
        label: 'How often',
        options: [
          { id: 'often-1', text: 'continuously, for every request, since it started', correct: true, feedback: 'Matches the reports - this is a total, ongoing outage, not an intermittent one.' },
          { id: 'often-2', text: 'occasionally, for a few seconds at a time', correct: false, feedback: 'The reports describe a total outage, not an intermittent one.' },
          { id: 'often-3', text: 'this has happened many times before', correct: false, feedback: 'Nothing in the brief suggests this has happened before.' },
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
        feedback: 'Restores service fast and keeps every log and config from the failed release intact for investigation.',
      },
      {
        id: 'contain-restart-loop',
        text: 'Keep restarting the crashing instances and hope one stays up',
        best: false,
        feedback: 'This does not fix anything and leaves the site unreliable while you investigate.',
      },
      {
        id: 'contain-wipe-logs',
        text: 'Clear the crash logs so the dashboard stops showing errors to the team',
        best: false,
        feedback: 'This hides the symptom from the dashboard and destroys the evidence that shows exactly why instances are crashing.',
        destroysEvidenceId: 'ev-crashlog',
      },
      {
        id: 'contain-maintenance-page',
        text: 'Put up a maintenance page so visitors see a friendly message instead of an error',
        best: false,
        feedback: 'Better for customers to look at, but the service itself is still down.',
      },
    ],
    finishedQuestion: 'Service is restored. Is the RCA finished?',
    prematureConsequence:
      "Three weeks later, another release crashes in exactly the same way, because nothing about the deployment checklist or staging environment changed.",
  },

  evidence: [
    {
      id: 'ev-crashlog',
      source: 'Application crash log',
      kind: 'log',
      essential: true,
      destroyedBy: 'contain-wipe-logs',
      content:
        '09:02  FATAL  Missing required environment variable PAYMENTS_API_KEY\n' +
        '09:02  FATAL  Application failed to start, exiting (x12 instances, same error)',
      relevanceNote: 'Every instance failed to start with the same missing-variable error, right after the release.',
    },
    {
      id: 'ev-dbhealthy',
      source: 'Database health dashboard',
      kind: 'monitoring',
      essential: true,
      content: 'Connections: steady. Query latency: normal. No errors logged 08:00-10:00.',
      relevanceNote: 'The database was healthy throughout - rules out a database-side cause.',
    },
    {
      id: 'ev-cdnlogs',
      source: 'CDN access logs',
      kind: 'log',
      essential: true,
      content: 'Cache hit rate: 94% (normal). No increase in CDN-side errors. Origin requests failing with 500s from 09:02.',
      relevanceNote: 'The CDN is working normally and simply relaying the origin server\'s errors - rules out a CDN cause.',
    },
    {
      id: 'ev-lbhealth',
      source: 'Load balancer health check log',
      kind: 'monitoring',
      essential: true,
      content: 'Checks passing normally until 09:01. Checks begin failing at 09:02, immediately after the new release started.',
      relevanceNote: 'Health checks only failed after the app crashed - a symptom of the crash, not its trigger.',
    },
    {
      id: 'ev-memgraph',
      source: 'Memory usage graph (description)',
      kind: 'monitoring',
      essential: true,
      content: 'App server memory usage sits at a steady 40% right up to the moment of the crash, then drops to zero as instances exit.',
      relevanceNote: 'No memory pressure before the crash - rules out an out-of-memory cause.',
    },
    {
      id: 'ev-deploylog',
      source: 'Deployment pipeline output',
      kind: 'change',
      essential: true,
      content: "Release 2025.11-friday: application code and config template changed. Dependency versions: unchanged from the previous, working release.",
      relevanceNote: 'Dependency versions did not change - rules out an incompatible dependency as the cause.',
    },
    {
      id: 'ev-checklist',
      source: 'Deployment checklist document',
      kind: 'config',
      essential: true,
      content:
        '1. Run automated tests\n2. Deploy to staging\n3. Smoke-test key pages\n4. Deploy to production\n' +
        '(No step validates that all required environment variables are set before deploying to production.)',
      relevanceNote: 'Confirms there is no step anywhere in the process that checks required configuration before release.',
    },
    {
      id: 'ev-stagingconfig',
      source: 'Staging vs production configuration diff',
      kind: 'config',
      essential: true,
      content:
        "Staging: PAYMENTS_API_KEY is auto-filled by the legacy staging secrets vault.\n" +
        "Production: each variable must be added manually to the production secrets vault. PAYMENTS_API_KEY was never added.",
      relevanceNote: 'Shows exactly why staging never caught this: it auto-fills a variable that production requires to be set by hand.',
    },
    {
      id: 'ev-sslcert',
      source: 'SSL certificate status',
      kind: 'report',
      essential: false,
      content: 'Certificate valid until March 2027. Auto-renewed successfully last month.',
      relevanceNote: 'Rules out an expired certificate - and this would show a browser warning, not a 500 error.',
    },
    {
      id: 'ev-dns',
      source: 'DNS record history',
      kind: 'report',
      essential: false,
      content: 'A and CNAME records unchanged for two years. Resolve correctly to the production load balancer.',
      relevanceNote: 'Rules out a DNS misconfiguration - the site resolves correctly, it just errors once reached.',
    },
  ],

  timeline: [
    { id: 'tl-1', text: 'Final tests pass in CI for the Friday release', timestamp: 'Thu 17:00' },
    { id: 'tl-2', text: "Release 2025.11-friday deployed to production", timestamp: 'Fri 09:00', isChange: true },
    { id: 'tl-3', text: 'App instances begin restarting with the new release', timestamp: 'Fri 09:01' },
    { id: 'tl-4', text: 'App instances crash on startup, missing-variable error logged', timestamp: 'Fri 09:02' },
    { id: 'tl-5', text: 'Load balancer health checks begin failing', timestamp: 'Fri 09:02' },
    { id: 'tl-6', text: 'First customer reports a 500 error on every page', timestamp: 'Fri 09:05' },
    { id: 'tl-7', text: 'On-call engineer is paged', timestamp: 'Fri 09:10' },
  ],
  firstSymptomEventId: 'tl-6',

  factors: [
    { id: 'fac-checklist', text: 'The deployment checklist has no configuration validation step', category: 'possibleRootCause', fishboneCategory: 'process', feedback: 'Worth investigating further - this is the gap that let a missing variable reach production unnoticed.' },
    { id: 'fac-staging', text: 'Staging does not mirror production configuration', category: 'contributing', fishboneCategory: 'process', feedback: 'A contributing factor: it meant testing could not have caught this even if someone thought to check.' },
    { id: 'fac-friday', text: 'The release happened on a Friday afternoon', category: 'notRelevant', fishboneCategory: 'policy', feedback: 'The day of the week did not cause the crash - the same release would have failed on any day.' },
    { id: 'fac-ssl', text: 'The SSL certificate is due for renewal in a few months', category: 'notRelevant', fishboneCategory: 'technology', feedback: 'Not relevant - the certificate is valid and was not implicated by any evidence.' },
    { id: 'fac-blame', text: "The developer who wrote the release should have checked the environment variables", category: 'notRelevant', fishboneCategory: 'people', feedback: 'This blames a person rather than the missing checklist step that should have caught it automatically.' },
    { id: 'fac-dns', text: 'DNS has not changed in two years', category: 'notRelevant', fishboneCategory: 'technology', feedback: 'Not relevant - DNS was never implicated by the evidence.' },
  ],

  faultTree: {
    rootId: 'top',
    nodes: {
      top: {
        id: 'top',
        label: "Website returns a 500 error to every visitor",
        gate: 'OR',
        children: ['n-appcrash', 'n-dbissue', 'n-cdnissue', 'n-lbissue'],
        gateFeedback: 'Any one of these alone would be enough to take the whole site down, so this is an OR gate.',
        buildOptions: [
          { id: 'top-opt-appcrash', label: 'The application process crashes on startup', correct: true },
          { id: 'top-opt-db', label: 'The database server is unreachable', correct: true },
          { id: 'top-opt-cdn', label: 'The CDN is serving broken static assets', correct: true },
          { id: 'top-opt-lb', label: 'The load balancer health checks are failing', correct: true },
          { id: 'top-opt-ssl', label: 'The SSL certificate has expired', correct: false, feedback: 'Users would see a browser certificate warning, not a server 500 error.' },
          { id: 'top-opt-dns', label: 'DNS records point to the wrong server', correct: false, feedback: 'DNS has not changed and resolves correctly - the site errors once you reach it, so this is not the cause.' },
        ],
      },
      'n-dbissue': {
        id: 'n-dbissue', label: 'The database server is unreachable', gate: null, children: [],
        correctVerdict: 'ruledOut', verdictEvidenceIds: ['ev-dbhealthy'],
        verdictFeedback: 'The database health dashboard shows normal connections and latency throughout - ruled out.',
      },
      'n-cdnissue': {
        id: 'n-cdnissue', label: 'The CDN is serving broken static assets', gate: null, children: [],
        correctVerdict: 'ruledOut', verdictEvidenceIds: ['ev-cdnlogs'],
        verdictFeedback: 'CDN logs show a normal cache hit rate and no asset errors - ruled out.',
      },
      'n-lbissue': {
        id: 'n-lbissue', label: 'The load balancer health checks are failing', gate: null, children: [],
        correctVerdict: 'ruledOut', verdictEvidenceIds: ['ev-lbhealth'],
        verdictFeedback: 'Health checks only started failing after the app crashed - a symptom, not the trigger. Ruled out.',
      },
      'n-appcrash': {
        id: 'n-appcrash',
        label: 'The application process crashes immediately on startup',
        gate: 'OR',
        children: ['n-envvar', 'n-oom', 'n-depversion'],
        gateFeedback: 'Any one of these alone could crash the app on startup, so this is an OR gate.',
        buildOptions: [
          { id: 'app-opt-envvar', label: 'A required environment variable is missing in production', correct: true },
          { id: 'app-opt-oom', label: 'The app servers ran out of memory on startup', correct: true },
          { id: 'app-opt-dep', label: 'An incompatible dependency version was deployed', correct: true },
          { id: 'app-opt-dbfalse', label: 'The database server is unreachable', correct: false, feedback: 'That would stop the app working, but it would not crash the process on startup - it belongs directly under the top event.' },
          { id: 'app-opt-maint', label: 'A scheduled maintenance window was still active', correct: false, feedback: 'There is no evidence of a maintenance window, and the logs show a genuine crash, not a deliberate block.' },
        ],
      },
      'n-oom': {
        id: 'n-oom', label: 'The app servers ran out of memory on startup', gate: null, children: [],
        correctVerdict: 'ruledOut', verdictEvidenceIds: ['ev-memgraph'],
        verdictFeedback: 'The memory graph shows steady, normal usage right up to the crash - ruled out.',
      },
      'n-depversion': {
        id: 'n-depversion', label: 'An incompatible dependency version was deployed', gate: null, children: [],
        correctVerdict: 'ruledOut', verdictEvidenceIds: ['ev-deploylog'],
        verdictFeedback: 'The deployment log shows dependency versions were unchanged from the previous, working release - ruled out.',
      },
      'n-envvar': {
        id: 'n-envvar',
        label: 'A required environment variable is missing in the production environment',
        gate: 'AND',
        children: ['n-novalidation', 'n-stagingmismatch'],
        gateFeedback:
          'The missing variable only reached production because two things were true together: nothing validated ' +
          'configuration before release, and staging did not mirror production closely enough to expose the gap. ' +
          'Either safeguard alone would likely have caught it, so this is an AND gate.',
        buildOptions: [
          { id: 'env-opt-nocheck', label: 'The deployment checklist has no step that validates required configuration', correct: true },
          { id: 'env-opt-staging', label: 'Staging does not mirror production configuration, so the gap was never exercised before release', correct: true },
          { id: 'env-opt-oom', label: 'The app servers ran out of memory on startup', correct: false, feedback: 'That is a separate possible cause of a crash - it does not explain why a variable was missing.' },
          { id: 'env-opt-dep', label: 'An incompatible dependency version was deployed', correct: false, feedback: 'Also a separate possible cause of a crash - it does not explain the missing variable.' },
        ],
      },
      'n-novalidation': {
        id: 'n-novalidation', label: 'The deployment checklist has no step that validates required configuration', gate: null, children: [],
        correctVerdict: 'confirmed', verdictEvidenceIds: ['ev-checklist'],
        verdictFeedback: 'The checklist document confirms there is no configuration validation step anywhere in the process - confirmed.',
      },
      'n-stagingmismatch': {
        id: 'n-stagingmismatch', label: 'Staging does not mirror production configuration', gate: null, children: [],
        correctVerdict: 'confirmed', verdictEvidenceIds: ['ev-stagingconfig'],
        verdictFeedback: "The configuration diff shows staging auto-fills this variable while production requires it to be added manually - confirmed.",
      },
    },
    pool: [
      { id: 'pool-ssl', label: 'The SSL certificate has expired' },
      { id: 'pool-dns', label: 'DNS records point to the wrong server' },
      { id: 'pool-maint', label: 'A scheduled maintenance window was still active' },
    ],
    explanation: {
      id: 'fta-explanation',
      prompt: 'Explain in two sentences how the confirmed causes combine to produce the incident.',
      minWords: 20,
      concepts: [
        { label: 'Names the missing validation step', terms: ['validation', 'validate', 'checklist'], required: true },
        { label: 'Names the staging/production mismatch', terms: ['staging', 'mirror', 'mismatch'], required: false },
        { label: 'Describes the AND relationship between both causes', terms: ['both', 'together', 'and the'], required: false },
      ],
      modelAnswer:
        'The deployment checklist never validated that required configuration was present, and staging auto-filled the variable so testing never exercised the gap. Together, those two gaps meant a missing variable reached production and crashed every instance on startup.',
    },
  },

  rootCause: {
    candidates: [
      { id: 'rc-symptom', type: 'symptom', text: 'The website is down and shows errors to every visitor', feedback: 'This is the symptom you started from, not an explanation of it.' },
      { id: 'rc-immediate', type: 'immediate', text: 'The application process is crashing on startup', feedback: 'This is the immediate mechanism, but it does not explain why a required variable was missing.' },
      { id: 'rc-blame', type: 'blame', text: "The developer who wrote the release should have checked the configuration", feedback: 'This blames a person rather than the missing safeguard that should have caught it automatically.' },
      { id: 'rc-root', type: 'root', text: 'The deployment checklist has no configuration validation step and staging does not mirror production, so a required environment variable reached production unset', feedback: 'This explains the mechanism and the missing safeguards, and points to fixes rather than blame.' },
    ],
    criteria: [
      { id: 'crit-recur', question: 'Would removing it prevent recurrence?', correctAnswerForRoot: true, needsEvidence: true, supportingEvidenceIds: ['ev-checklist'] },
      { id: 'crit-explain', question: 'Does it explain the symptoms and "why now"?', correctAnswerForRoot: true, needsEvidence: false },
      { id: 'crit-support', question: 'Is it supported by logs, configs or measurements?', correctAnswerForRoot: true, needsEvidence: true, supportingEvidenceIds: ['ev-checklist', 'ev-stagingconfig'] },
      { id: 'crit-action', question: 'Does it point to an action that improves the system, not just to blame?', correctAnswerForRoot: true, needsEvidence: false },
    ],
    statement: {
      id: 'rc-statement',
      prompt: 'Write the root cause statement in your own words.',
      minWords: 15,
      concepts: [
        { label: 'Names the missing configuration validation step', terms: ['validation', 'validate', 'checklist'], required: true },
        { label: 'Names the staging/production configuration mismatch', terms: ['staging', 'mirror', 'mismatch'], required: false },
      ],
      modelAnswer:
        'There was no step in the deployment checklist that validated required configuration, and staging did not mirror production closely enough to expose the gap, so a required environment variable reached production unset and crashed every instance.',
    },
  },

  actions: [
    { id: 'act-validation-step', text: 'Add a configuration validation step to the deployment checklist that fails the release if any required variable is missing', category: 'preventative', feedback: 'Preventative - directly closes the gap that let this reach production.' },
    { id: 'act-mirror-staging', text: 'Make staging require the same manually-set variables as production, instead of auto-filling them', category: 'preventative', feedback: 'Preventative - removes the mismatch that meant staging could not have caught this.' },
    { id: 'act-rollback-now', text: "Roll back to the previous release", category: 'corrective', feedback: 'Corrective - restores service today, but does not prevent the same gap causing another outage later.' },
    { id: 'act-manual-patch', text: 'Manually add the missing variable to production and restart the instances', category: 'corrective', feedback: 'Corrective - a short-term fix for this specific incident.' },
    { id: 'act-fail-fast', text: 'Make the application fail fast with a clear error message if a required variable is missing, instead of crash-looping', category: 'preventative', feedback: 'Preventative - makes the next occurrence of this class of fault far quicker to diagnose.' },
    { id: 'act-discipline-dev', text: 'Formally discipline the developer who wrote the release', category: 'notAppropriate', feedback: 'Not appropriate - blames an individual instead of fixing the missing automated safeguard.' },
    { id: 'act-ban-releases', text: 'Ban all further releases to the website indefinitely', category: 'notAppropriate', feedback: 'Not appropriate - wildly disproportionate, and does not fix the actual gap in the deployment process.' },
    { id: 'act-friday-policy', text: 'Introduce a policy requiring an extra sign-off for any Friday release', category: 'notAppropriate', feedback: 'The day of the week was not the cause here - this treats a symptom of timing rather than the configuration gap itself.' },
  ],
  chooseOnePreventative: {
    id: 'pref-explain',
    prompt: 'Choose one preventative action and explain how it stops this root cause recurring.',
    minWords: 20,
    concepts: [
      { label: 'Names a specific preventative action', terms: ['validation', 'staging', 'fail fast', 'checklist'], required: true },
      { label: 'Links the action to preventing recurrence', terms: ['recur', 'prevent', 'again', 'future', 'before it'], required: false },
    ],
    modelAnswer:
      'Adding a configuration validation step to the checklist means any release missing a required variable is blocked automatically, before it ever reaches production.',
  },

  verification: {
    steps: [
      { id: 'ver-1', text: 'Confirm the validation step blocks a test release with a deliberately missing variable', correct: true, feedback: 'A direct test of the fix against the original failure condition.' },
      { id: 'ver-2', text: 'Confirm staging now requires the same manually-set variables as production', correct: true, feedback: 'Confirms the second safeguard closes the gap it was meant to close.' },
      { id: 'ver-3', text: 'Ask customers if the website feels faster', correct: false, feedback: 'Subjective and unrelated to verifying this specific fix.' },
      { id: 'ver-4', text: 'Monitor the next three releases for any configuration-related crash', correct: true, feedback: 'A real-world check that the fix holds under normal use.' },
      { id: 'ver-5', text: 'Re-check the SSL certificate renewal date', correct: false, feedback: 'Irrelevant - the certificate was never implicated.' },
      { id: 'ver-6', text: 'Repaint the status page', correct: false, feedback: 'Does not verify anything about the cause or the fix.' },
    ],
    pickCount: 2,
    monitoring: [
      { id: 'mon-1', text: 'Alert immediately if any instance exits within 60 seconds of starting, across two consecutive deploys', correct: true, feedback: 'Catches this exact failure mode fast, before it spreads to all instances.' },
      { id: 'mon-2', text: 'Check the deployment checklist manually once a year', correct: false, feedback: 'Far too infrequent to catch a regression in the next release.' },
      { id: 'mon-3', text: 'Alert only once every instance has crashed', correct: false, feedback: 'By then the outage has already fully happened.' },
      { id: 'mon-4', text: 'Ask customers to report errors as they see them', correct: false, feedback: 'Reactive, not monitoring - the fault has already occurred by the time anyone reports it.' },
    ],
  },

  lessonsLearned: {
    id: 'lessons-sitedown',
    prompt: 'Write a two or three sentence lessons-learned note for a knowledge base article.',
    minWords: 20,
    concepts: [
      { label: 'Generalises beyond this one release', terms: ['any release', 'every release', 'general', 'across'], required: false },
      { label: 'Names a reusable preventative principle', terms: ['validation', 'validate', 'staging', 'mirror'], required: true },
    ],
    modelAnswer:
      'Any required configuration should be validated automatically before a release reaches production, not caught by chance in testing. Staging environments should mirror production closely enough that a missing variable would fail there first, not in front of customers.',
  },
};

export default scenario;
