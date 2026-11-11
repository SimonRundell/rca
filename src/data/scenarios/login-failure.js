/**
 * Scenario 2: Nobody can log in.
 * Support / 5 Whys / difficulty 1.
 * Root cause (outline): domain controller disk full. No log rotation,
 * and the monitoring threshold was set too high to fire usefully.
 * Deliberately echoes the handout's worked "disk full" example before
 * diverging in its evidence and stop-or-continue decisions.
 */

const scenario = {
  id: 'login-failure',
  title: 'Nobody can log in',
  domain: 'support',
  difficulty: 1,
  technique: 'fiveWhys',
  estimatedMinutes: 25,

  briefing: {
    ticketRef: 'HD-5120',
    loggedAt: 'Tuesday 08:45',
    reports: [
      '"Nobody in the library can log into any PC." - Librarian, 08:12',
      '"Same here on reception, every machine." - Reception, 08:20',
      '"This is campus-wide, we need this fixed now." - IT escalation note, 08:45',
    ],
    question: 'Does this warrant a full Root Cause Analysis?',
    correctWarrantsRca: true,
    reasons: [
      { id: 'recurring', label: 'It is a recurring problem, not a one-off', correct: false },
      { id: 'highImpact', label: 'It disrupts authentication for the whole college', correct: true },
      { id: 'security', label: 'It involves a confirmed security breach', correct: false },
      { id: 'failedChange', label: 'It followed a known failed change', correct: false },
      { id: 'formalRecord', label: 'A formal record is required for an incident of this severity', correct: true },
    ],
  },

  problem: {
    slots: [
      {
        id: 'what',
        label: 'What',
        options: [
          { id: 'what-1', text: 'the network is down', correct: false, feedback: 'Too vague, and not accurate - other network services are still working.' },
          { id: 'what-2', text: 'nobody can log into any Windows device using a domain account', correct: true, feedback: 'Precise and matches exactly what was reported.' },
          { id: 'what-3', text: 'the server has crashed', correct: false, feedback: 'An assumption about the cause, not a description of the symptom.' },
        ],
      },
      {
        id: 'where',
        label: 'Where',
        options: [
          { id: 'where-1', text: 'somewhere on campus', correct: false, feedback: 'Too vague - the reports show it is campus-wide, which is a precise claim.' },
          { id: 'where-2', text: 'every building, wherever a domain account is used', correct: true, feedback: 'Matches the reports from both the library and reception.' },
          { id: 'where-3', text: 'just the library', correct: false, feedback: 'Reception reports the same fault, so it is not confined to one room.' },
        ],
      },
      {
        id: 'who',
        label: 'Who',
        options: [
          { id: 'who-1', text: 'everyone using a domain account to sign in', correct: true, feedback: 'Matches the scope of the reports.' },
          { id: 'who-2', text: 'just library staff', correct: false, feedback: 'Too narrow - reception reports the same fault.' },
          { id: 'who-3', text: 'whoever misconfigured the server', correct: false, feedback: 'A guess about blame, not about who is affected.' },
        ],
      },
      {
        id: 'when',
        label: 'When',
        options: [
          { id: 'when-1', text: 'since this morning, from around 08:05', correct: true, feedback: 'Matches the first reports.' },
          { id: 'when-2', text: 'at some unknown point in the past', correct: false, feedback: 'The reports give a clear starting time.' },
          { id: 'when-3', text: 'every Tuesday', correct: false, feedback: 'Nothing supports a weekly pattern yet.' },
        ],
      },
      {
        id: 'howOften',
        label: 'How often',
        options: [
          { id: 'often-1', text: 'this is the first time this has happened', correct: true, feedback: 'Nothing in the brief suggests this has happened before.' },
          { id: 'often-2', text: 'this happens every day', correct: false, feedback: 'Not supported by the brief.' },
          { id: 'often-3', text: 'this is a well-known recurring issue', correct: false, feedback: 'Contradicts the evidence available so far.' },
        ],
      },
    ],
  },

  containment: {
    options: [
      {
        id: 'contain-reboot',
        text: 'Reboot the domain controller',
        best: false,
        feedback: 'May restart the service briefly, but the disk is still full, so it will fail again almost immediately.',
      },
      {
        id: 'contain-autocleanup',
        text: 'Run an automatic log-cleanup utility that deletes old event logs to free space',
        best: false,
        feedback: 'Frees space quickly, but it deletes the very evidence that would show what filled the disk.',
        destroysEvidenceId: 'ev-eventlogs',
      },
      {
        id: 'contain-manualclean',
        text: 'Manually free enough space by archiving (not deleting) the oversized event logs to another drive',
        best: true,
        feedback: 'Restores service without destroying the evidence - the logs are preserved, just moved.',
      },
      {
        id: 'contain-personal',
        text: 'Tell staff to use personal laptops until this is fixed',
        best: false,
        feedback: 'A workaround for individuals, not a restoration of the service.',
      },
    ],
    finishedQuestion: 'Service is restored. Is the RCA finished?',
    prematureConsequence:
      'Two weeks later, the disk fills again. This time it happens on a Monday morning during enrolment, affecting twice as many users.',
  },

  evidence: [
    {
      id: 'ev-aderror',
      source: 'Domain controller Event Log extract',
      kind: 'log',
      essential: true,
      content:
        '08:03  Error  NTDS (768) NTDSA: Active Directory Domain Services could not allocate the requested amount of ' +
        'memory/disk space to extend the database.\n' +
        '08:04  Error  Authentication service failed to start: insufficient disk space on system drive.',
      relevanceNote: 'Shows Active Directory itself failing because it cannot write to disk.',
    },
    {
      id: 'ev-diskusage',
      source: 'Disk usage report (domain controller)',
      kind: 'log',
      essential: true,
      content: 'C:\\ - 100% full, 0 bytes free.\nLargest folder: C:\\Windows\\System32\\winevt\\Logs - 41.2 GB',
      relevanceNote: 'Confirms the system drive is completely full, mostly from Windows event logs.',
    },
    {
      id: 'ev-eventlogs',
      source: 'Event log folder size history',
      kind: 'log',
      essential: true,
      destroyedBy: 'contain-autocleanup',
      content: 'Security.evtx has grown from 2GB to 41GB over the last 6 months. No archived or rotated copies exist.',
      relevanceNote: 'Shows the security log grew continuously for months with nothing ever rotating it out.',
    },
    {
      id: 'ev-rotation',
      source: 'Group Policy: event log retention settings',
      kind: 'config',
      essential: true,
      content: 'Retention method: "Do not overwrite events (clear log manually)"\nMaximum log size: not configured (uses an old, very large default)',
      relevanceNote: 'Confirms log rotation was never configured, so the log could only ever grow.',
    },
    {
      id: 'ev-monitorcfg',
      source: 'Monitoring tool configuration',
      kind: 'monitoring',
      essential: true,
      content:
        'Disk space alert: fires when free space drops below 1GB.\n' +
        'Check interval: once every 24 hours.',
      relevanceNote: 'The threshold leaves almost no safety margin, and a once-a-day check can miss a drive filling within hours.',
    },
    {
      id: 'ev-ticket',
      source: 'Ticket history for the domain controller',
      kind: 'ticket',
      essential: true,
      content: 'HD-4890 (2 weeks ago) "Logins feel a bit slow this morning" - closed as "server was busy, resolved itself".',
      relevanceNote: 'An early warning sign that was dismissed rather than investigated.',
    },
    {
      id: 'ev-changelog',
      source: 'Infrastructure change log',
      kind: 'change',
      essential: true,
      content: 'No changes logged for the domain controller in the last 30 days.',
      relevanceNote: 'Rules out a recent change as the trigger for this outage.',
    },
    {
      id: 'ev-network',
      source: 'Network connectivity test',
      kind: 'report',
      essential: false,
      content: 'All switches and cabling to the library and reception test normally.',
      relevanceNote: 'Rules out a network fault - the problem is on the server itself.',
    },
    {
      id: 'ev-password',
      source: 'Old ticket: forgotten password',
      kind: 'ticket',
      essential: false,
      content: 'HD-3012 (3 months ago) "I forgot my password" - resolved by a reset. Unrelated to today.',
      relevanceNote: 'An individual password issue, not part of this incident.',
    },
    {
      id: 'ev-cctv',
      source: 'Server room CCTV log',
      kind: 'report',
      essential: false,
      content: 'No access to the server room recorded outside normal maintenance hours.',
      relevanceNote: 'Rules out physical tampering, which nothing else suggested anyway.',
    },
  ],

  timeline: [
    { id: 'tl-1', text: 'Ticket logged about slightly slow logins, dismissed as temporary', timestamp: '2 weeks ago' },
    { id: 'tl-2', text: 'Scheduled overnight log-archive job fails silently (misconfigured path)', timestamp: 'Last night, 02:00', isChange: true },
    { id: 'tl-3', text: 'System drive on the domain controller reaches 100% full', timestamp: '08:00' },
    { id: 'tl-4', text: 'Active Directory authentication service fails to start', timestamp: '08:04' },
    { id: 'tl-5', text: 'Library reports nobody can log in', timestamp: '08:12' },
    { id: 'tl-6', text: 'Reception reports the same fault', timestamp: '08:20' },
    { id: 'tl-7', text: 'IT escalates the incident', timestamp: '08:45' },
  ],
  firstSymptomEventId: 'tl-5',

  factors: [
    { id: 'fac-rotation', text: 'Event log rotation was never configured', category: 'possibleRootCause', fishboneCategory: 'process', feedback: 'Worth investigating further - this is what let the log grow without limit.' },
    { id: 'fac-threshold', text: 'The disk space alert threshold left almost no warning margin', category: 'contributing', fishboneCategory: 'technology', feedback: 'A contributing factor: it meant any warning would arrive too late to act on.' },
    { id: 'fac-dismissed', text: 'An earlier slow-login ticket was dismissed without investigation', category: 'contributing', fishboneCategory: 'process', feedback: 'A contributing factor: an early warning sign was missed.' },
    { id: 'fac-archivejob', text: 'The overnight log-archive job failed silently with no alert', category: 'contributing', fishboneCategory: 'technology', feedback: 'A contributing factor: the one safeguard that existed had itself failed unnoticed.' },
    { id: 'fac-cctv', text: 'No unusual server room access was recorded', category: 'notRelevant', fishboneCategory: 'environment', feedback: 'Not relevant - nothing points to physical tampering.' },
    { id: 'fac-blame-admin', text: 'The server administrator should have checked disk space manually', category: 'notRelevant', fishboneCategory: 'people', feedback: 'This blames a person rather than the missing rotation and alerting that should have made manual checks unnecessary.' },
  ],

  fiveWhys: {
    startStatement: 'Nobody can log into any Windows device across the college.',
    levels: [
      {
        options: [
          { id: 'l1-correct', text: 'The domain controller\'s Active Directory service has failed because it cannot write to disk', tag: 'correct', feedback: 'Right - the Event Log extract shows Active Directory failing to allocate disk space.' },
          { id: 'l1-restate', text: 'People cannot sign in', tag: 'restatement', feedback: 'That restates the symptom rather than explaining it.' },
          { id: 'l1-leap', text: 'The domain controller has been hacked', tag: 'leap', feedback: 'Nothing in the evidence points to a compromise - this skips a link in the chain.' },
          { id: 'l1-blame', text: 'The server administrator broke something', tag: 'blame', feedback: 'This blames a person instead of pointing at a mechanism.' },
        ],
        supportingEvidenceIds: ['ev-aderror'],
        justification: {
          id: 'j1',
          prompt: 'In one sentence, explain how the evidence supports this answer.',
          minWords: 8,
          concepts: [{ label: 'Cites the Active Directory error log', terms: ['active directory', 'ntds', 'disk space', 'allocate'], required: true }],
          modelAnswer: 'The Event Log extract shows Active Directory failing to start because it could not allocate disk space.',
        },
        stopsTooEarly: false,
      },
      {
        options: [
          { id: 'l2-correct', text: 'The system drive on the domain controller is completely full', tag: 'correct', feedback: 'Right - the disk usage report shows 0 bytes free on C:\\.' },
          { id: 'l2-restate', text: 'There is no disk space', tag: 'restatement', feedback: 'That restates the previous level without adding anything.' },
          { id: 'l2-leap', text: 'Malware has filled the disk with junk files', tag: 'leap', feedback: 'The disk usage report points to Windows event logs, not unidentified or malicious files.' },
          { id: 'l2-unrelated', text: 'The server hardware is old and slow', tag: 'unrelated', feedback: 'Age might explain slowness, but it does not explain a disk filling completely.' },
        ],
        supportingEvidenceIds: ['ev-diskusage'],
        justification: {
          id: 'j2',
          prompt: 'In one sentence, explain how the evidence supports this answer.',
          minWords: 8,
          concepts: [{ label: 'Cites the disk usage report', terms: ['disk usage', '100%', 'full', '0 bytes', 'free'], required: true }],
          modelAnswer: 'The disk usage report shows the C:\\ drive at 100% full with 0 bytes free, and the largest folder is the Windows event log directory.',
        },
        stopsTooEarly: true,
        stopFeedback: 'Freeing space today fixes nothing about why the disk filled up, or whether it will happen again.',
      },
      {
        options: [
          { id: 'l3-correct', text: 'The security event log grew to over 40GB because log rotation was never configured', tag: 'correct', feedback: 'Right - the event log history and the retention policy both confirm this.' },
          { id: 'l3-restate', text: 'There were too many log files', tag: 'restate', feedback: 'That restates "the disk filled" without explaining why nothing limited the logs.' },
          { id: 'l3-leap', text: 'Someone was storing personal files on the server', tag: 'leap', feedback: 'The evidence points specifically at Windows event logs, not personal files.' },
          { id: 'l3-blame', text: 'The previous administrator never cleaned up the server', tag: 'blame', feedback: 'This blames a person rather than the missing rotation configuration.' },
        ],
        supportingEvidenceIds: ['ev-eventlogs', 'ev-rotation'],
        justification: {
          id: 'j3',
          prompt: 'In one sentence, explain how the evidence supports this answer.',
          minWords: 8,
          concepts: [{ label: 'Cites the missing log rotation', terms: ['rotation', 'rotate', 'retention', 'overwrite'], required: true }],
          modelAnswer: 'The retention policy shows logs were set to "do not overwrite", and the log size history shows continuous growth with nothing ever archiving or clearing it.',
        },
        stopsTooEarly: false,
      },
      {
        options: [
          { id: 'l4-correct', text: 'The monitoring alert leaves almost no warning margin and only checks once a day, so there was no useful early warning', tag: 'correct', feedback: 'Right - the monitoring config and the dismissed earlier ticket both point here.' },
          { id: 'l4-restate', text: 'Nobody was watching the disk', tag: 'restatement', feedback: 'That restates the gap rather than explaining what in the system caused it.' },
          { id: 'l4-leap', text: 'The monitoring system is broken', tag: 'leap', feedback: 'The monitoring system works as configured - it is simply configured too close to the edge to be useful.' },
          { id: 'l4-blame', text: 'IT should have checked the server manually every day', tag: 'blame', feedback: 'Manual checks should not be the only safeguard - the alert configuration is the real gap.' },
        ],
        supportingEvidenceIds: ['ev-monitorcfg', 'ev-ticket'],
        justification: {
          id: 'j4',
          prompt: 'In one sentence, explain how the evidence supports this answer.',
          minWords: 8,
          concepts: [{ label: 'Cites the alert threshold or check interval', terms: ['threshold', 'alert', '1gb', '24 hour', 'interval'], required: true }],
          modelAnswer: 'The monitoring configuration only fires when under 1GB is free and checks once every 24 hours, which could easily miss a fast-filling disk entirely.',
        },
        stopsTooEarly: false,
      },
    ],
  },

  rootCause: {
    candidates: [
      { id: 'rc-symptom', type: 'symptom', text: 'Nobody can log into any Windows device', feedback: 'This is the symptom you started from, not an explanation of it.' },
      { id: 'rc-immediate', type: 'immediate', text: 'The domain controller\'s disk is completely full', feedback: 'This is the immediate mechanism, but it does not explain why the disk filled or why it was not caught sooner.' },
      { id: 'rc-blame', type: 'blame', text: 'The server administrator should have kept a closer eye on disk space', feedback: 'This blames a person rather than identifying what in the system allowed the fault.' },
      { id: 'rc-root', type: 'root', text: 'Event log rotation was never configured and the disk-space alert left almost no warning margin, so the log grew until it silently exhausted the disk', feedback: 'This explains the mechanism and the missing safeguard, and points to fixes rather than blame.' },
    ],
    criteria: [
      { id: 'crit-recur', question: 'Would removing it prevent recurrence?', correctAnswerForRoot: true, needsEvidence: true, supportingEvidenceIds: ['ev-rotation'] },
      { id: 'crit-explain', question: 'Does it explain the symptoms and "why now"?', correctAnswerForRoot: true, needsEvidence: false },
      { id: 'crit-support', question: 'Is it supported by logs, configs or measurements?', correctAnswerForRoot: true, needsEvidence: true, supportingEvidenceIds: ['ev-eventlogs', 'ev-monitorcfg'] },
      { id: 'crit-action', question: 'Does it point to an action that improves the system, not just to blame?', correctAnswerForRoot: true, needsEvidence: false },
    ],
    statement: {
      id: 'rc-statement',
      prompt: 'Write the root cause statement in your own words.',
      minWords: 15,
      concepts: [
        { label: 'Names the missing log rotation', terms: ['rotation', 'rotate', 'retention'], required: true },
        { label: 'Names the ineffective monitoring threshold', terms: ['threshold', 'alert', 'monitor', 'warning'], required: false },
      ],
      modelAnswer:
        'Event log rotation was never configured, so the security log grew for months unchecked, and the disk-space alert only fired when almost no space was left, so there was no real warning before the domain controller ran out of room.',
    },
  },

  actions: [
    { id: 'act-rotation', text: 'Configure log rotation so old events are archived automatically', category: 'preventative', feedback: 'Preventative - removes the condition that let the log grow without limit.' },
    { id: 'act-threshold', text: 'Set the disk alert to fire at 20% free space and check every 15 minutes', category: 'preventative', feedback: 'Preventative - gives a real warning margin instead of almost none.' },
    { id: 'act-archive-now', text: 'Archive the oversized logs to free space immediately', category: 'corrective', feedback: 'Corrective - restores service today but does not prevent recurrence alone.' },
    { id: 'act-reboot', text: 'Reboot the domain controller', category: 'corrective', feedback: 'Corrective - a short-term step, not a fix for the underlying cause.' },
    { id: 'act-discipline', text: 'Formally discipline the server administrator', category: 'notAppropriate', feedback: 'Not appropriate - blames an individual instead of fixing the missing rotation and alerting.' },
    { id: 'act-disable-logging', text: 'Turn off security event logging entirely to avoid this ever filling up again', category: 'notAppropriate', feedback: 'Not appropriate - disproportionate, and removes a control the college needs for other reasons.' },
    { id: 'act-review-dismissed', text: 'Review how the earlier "slow logins" ticket was triaged, so early warning signs are investigated rather than dismissed', category: 'preventative', feedback: 'Preventative - addresses the process gap that let an early warning sign go uninvestigated.' },
    { id: 'act-bigger-disk', text: 'Increase the system drive size to give more headroom', category: 'preventative', feedback: 'Preventative - helps, though it works best alongside rotation rather than instead of it.' },
  ],
  chooseOnePreventative: {
    id: 'pref-explain',
    prompt: 'Choose one preventative action and explain how it stops this root cause recurring.',
    minWords: 20,
    concepts: [
      { label: 'Names a specific preventative action', terms: ['rotation', 'threshold', 'alert', 'archive', 'review'], required: true },
      { label: 'Links the action to preventing recurrence', terms: ['recur', 'prevent', 'again', 'future', 'before it'], required: false },
    ],
    modelAnswer:
      'Configuring log rotation means old events are archived automatically instead of accumulating forever, so the disk cannot silently fill with log data again.',
  },

  verification: {
    steps: [
      { id: 'ver-1', text: 'Confirm log rotation is active and old logs are being archived', correct: true, feedback: 'A direct test of the fix against the original failure condition.' },
      { id: 'ver-2', text: 'Trigger a test alert at the new threshold and confirm it fires with time to react', correct: true, feedback: 'Confirms the safeguard itself works, not just the symptom.' },
      { id: 'ver-3', text: 'Ask users if logins feel faster', correct: false, feedback: 'Subjective and does not verify the technical fix.' },
      { id: 'ver-4', text: 'Monitor disk usage trend over the next month', correct: true, feedback: 'A real-world check that the fix held under normal use.' },
      { id: 'ver-5', text: 'Re-test network cabling to the library', correct: false, feedback: 'Irrelevant - the network was never implicated.' },
      { id: 'ver-6', text: 'Reboot the domain controller again "to be safe"', correct: false, feedback: 'Does not verify anything about the cause or the fix.' },
    ],
    pickCount: 2,
    monitoring: [
      { id: 'mon-1', text: 'Alert when free disk space drops below 20%, checked every 15 minutes', correct: true, feedback: 'Gives a real warning margin with frequent enough checks to act on it.' },
      { id: 'mon-2', text: 'Check disk space manually once a term', correct: false, feedback: 'Far too infrequent to catch a fast-growing log file.' },
      { id: 'mon-3', text: 'Alert only when the disk reaches 100% full', correct: false, feedback: 'By then the outage has already happened.' },
      { id: 'mon-4', text: 'Ask staff to report slow logins', correct: false, feedback: 'Reactive, not monitoring - the fault has already occurred by the time anyone reports it.' },
    ],
  },

  lessonsLearned: {
    id: 'lessons-login',
    prompt: 'Write a two or three sentence lessons-learned note for a knowledge base article.',
    minWords: 20,
    concepts: [
      { label: 'Generalises beyond this one server', terms: ['any server', 'other system', 'general', 'across'], required: false },
      { label: 'Names a reusable preventative principle', terms: ['rotation', 'threshold', 'alert', 'monitor'], required: true },
    ],
    modelAnswer:
      'Any server that writes logs needs rotation configured from day one, not added after a problem. Disk-space alerts should leave a real margin and check often enough to act on, not just confirm the drive is already full.',
  },
};

export default scenario;
