/**
 * Scenario 4: The coursework that could not be restored.
 * Support / FTA with AND gates / difficulty 2.
 * Root cause (outline): loss needed three things together: accidental
 * deletion AND backup job failing for weeks AND failure alerts going to
 * a former employee's mailbox. Exists specifically to teach AND gates,
 * since most classroom FTA examples are all OR.
 * See site-down.js for the BuildOption / verdict field conventions used
 * on TreeNode.
 */

const scenario = {
  id: 'backup-loss',
  title: 'The coursework that could not be restored',
  domain: 'support',
  difficulty: 2,
  technique: 'fta',
  estimatedMinutes: 25,

  briefing: {
    ticketRef: 'HD-6204',
    loggedAt: 'Monday 15:10',
    reports: [
      '"I accidentally deleted my coursework folder, can you restore it from backup please?" - Student, 15:10',
      '"The most recent successful backup for that drive is six weeks old." - IT technician, 16:20',
      '"This is a formal assessment deadline in three days." - Course tutor, 16:30',
    ],
    question: 'Does this warrant a full Root Cause Analysis?',
    correctWarrantsRca: true,
    reasons: [
      { id: 'recurring', label: 'It is a recurring problem, not a one-off', correct: false },
      { id: 'highImpact', label: 'Assessed coursework may now be permanently lost', correct: true },
      { id: 'security', label: 'It involves a confirmed security breach', correct: false },
      { id: 'failedChange', label: 'It followed a known failed change', correct: false },
      { id: 'formalRecord', label: 'A formal record is needed because backups failed silently for weeks', correct: true },
    ],
  },

  problem: {
    slots: [
      {
        id: 'what',
        label: 'What',
        options: [
          { id: 'what-1', text: 'the backups are broken', correct: false, feedback: 'Too vague - this does not describe what actually happened to the student.' },
          { id: 'what-2', text: "a student's coursework folder was deleted and cannot be restored from backup", correct: true, feedback: 'Precise and matches exactly what was reported.' },
          { id: 'what-3', text: 'IT lost the file', correct: false, feedback: 'An assumption about blame, not a description of the fault.' },
        ],
      },
      {
        id: 'where',
        label: 'Where',
        options: [
          { id: 'where-1', text: "the student's shared network drive", correct: true, feedback: 'Matches the ticket - the folder was on the shared drive, not a local device.' },
          { id: 'where-2', text: "the student's personal laptop", correct: false, feedback: 'Nothing in the brief points to a local device.' },
          { id: 'where-3', text: 'the college website', correct: false, feedback: 'Unrelated to this ticket.' },
        ],
      },
      {
        id: 'who',
        label: 'Who',
        options: [
          { id: 'who-1', text: 'one student, for this assessment', correct: true, feedback: 'Matches the scope of the ticket so far.' },
          { id: 'who-2', text: 'every student on the course', correct: false, feedback: 'Not yet supported - only one student has reported this.' },
          { id: 'who-3', text: 'whoever configured the backup alerts', correct: false, feedback: 'A guess about blame, not about who is affected.' },
        ],
      },
      {
        id: 'when',
        label: 'When',
        options: [
          { id: 'when-1', text: 'the file was deleted this afternoon, but the backup problem goes back weeks', correct: true, feedback: 'Matches both the deletion time and the technician\'s note about the backup age.' },
          { id: 'when-2', text: 'at some point in the past', correct: false, feedback: 'Too vague - the ticket gives precise times for the deletion.' },
          { id: 'when-3', text: 'only today', correct: false, feedback: 'The backup has been failing for far longer than today.' },
        ],
      },
      {
        id: 'howOften',
        label: 'How often',
        options: [
          { id: 'often-1', text: 'this student has lost files like this before', correct: false, feedback: 'Not supported by the brief.' },
          { id: 'often-2', text: 'this is the first reported instance, but the backup has silently failed every night for weeks', correct: true, feedback: 'Matches the technician\'s note about the backup age - the underlying fault is ongoing even though this is the first report of it mattering.' },
          { id: 'often-3', text: 'this happens to every student every week', correct: false, feedback: 'Not supported by the brief.' },
        ],
      },
    ],
  },

  containment: {
    options: [
      {
        id: 'contain-restore-attempt',
        text: 'Attempt every possible recovery option (file history, recycle bin, any partial backup) before telling the student it is unrecoverable',
        best: true,
        feedback: 'Exhausts recovery options without touching anything that would hide evidence of why the backup failed.',
      },
      {
        id: 'contain-wipe-logs',
        text: 'Clear the failed backup job logs so the dashboard looks clean again',
        best: false,
        feedback: 'This hides the problem from the dashboard and destroys the evidence of exactly when and how the backups started failing.',
        destroysEvidenceId: 'ev-backuplog',
      },
      {
        id: 'contain-tell-student',
        text: 'Tell the student immediately that the file is unrecoverable, without attempting any recovery',
        best: false,
        feedback: 'This may be true, but giving up before trying available recovery options is premature.',
      },
      {
        id: 'contain-extension',
        text: "Ask the course tutor for an extension while recovery is attempted",
        best: false,
        feedback: 'A reasonable courtesy to the student, but it does not restore the service or the file itself.',
      },
    ],
    finishedQuestion: 'A recovery attempt (successful or not) has been made. Is the RCA finished?',
    prematureConsequence:
      "Two months later, another student loses work the same way, because the backup alert list was never fixed and nobody has been watching backup failures since.",
  },

  evidence: [
    {
      id: 'ev-deletionlog',
      source: 'File server audit log',
      kind: 'log',
      essential: true,
      content: 'Monday 14:20 - user account (student) deleted folder "Coursework_Unit7" from \\\\fileserver\\students\\.',
      relevanceNote: 'Confirms the folder was genuinely deleted by the student, not lost some other way.',
    },
    {
      id: 'ev-fileaudit',
      source: 'File history for the deleted folder',
      kind: 'log',
      essential: true,
      content: "Folder created 3 weeks ago, last modified yesterday 21:40, size 340MB. Regularly saved to throughout the unit.",
      relevanceNote: "Confirms the file genuinely existed and was being saved to - rules out \"it was never saved\".",
    },
    {
      id: 'ev-secscan',
      source: 'Security scan report',
      kind: 'report',
      essential: true,
      content: 'No ransomware signatures, no unusual encryption activity, no unauthorised access detected on the file server this term.',
      relevanceNote: 'Rules out ransomware or a security compromise as the cause of the backup being unusable.',
    },
    {
      id: 'ev-backuplog',
      source: 'Backup job run history',
      kind: 'log',
      essential: true,
      destroyedBy: 'contain-wipe-logs',
      content:
        'Nightly backup job "Students-Nightly": FAILED (6 consecutive weeks)\n' +
        'Last successful run: 6 weeks ago, 02:00\n' +
        'Failure reason: "service account credential expired"',
      relevanceNote: 'Confirms the backup job has not produced a usable copy for six weeks.',
    },
    {
      id: 'ev-alertconfig',
      source: 'Backup alert distribution list',
      kind: 'config',
      essential: true,
      content: 'Backup failure alerts sent to: j.carter@college (distribution list unchanged for 14 months).',
      relevanceNote: "Shows exactly where the failure alerts have been going for the whole six weeks.",
    },
    {
      id: 'ev-hrrecord',
      source: 'HR leaver record',
      kind: 'report',
      essential: true,
      content: 'j.carter: left the college 10 weeks ago. Mailbox not yet decommissioned. Not removed from any distribution lists.',
      relevanceNote: 'Explains why nobody saw the alerts: they were sent to a mailbox nobody has read in ten weeks.',
    },
    {
      id: 'ev-ticket',
      source: "Student's helpdesk ticket",
      kind: 'ticket',
      essential: true,
      content: '"I was tidying up old files and must have deleted the wrong folder. Can this be restored please, it\'s due Thursday."',
      relevanceNote: "The student's own account of the accidental deletion, including the deadline pressure.",
    },
    {
      id: 'ev-changelog',
      source: 'Infrastructure change log',
      kind: 'change',
      essential: true,
      content: 'No changes logged to backup infrastructure in the last 6 months.',
      relevanceNote: 'Rules out a recent infrastructure change as the trigger for the backup failures.',
    },
    {
      id: 'ev-laptoptheft',
      source: 'Device security report',
      kind: 'report',
      essential: false,
      content: 'No device theft or loss reported by any student this term.',
      relevanceNote: 'Rules out a stolen device - the file was never on a personal device anyway.',
    },
    {
      id: 'ev-internet',
      source: 'Network uptime report',
      kind: 'monitoring',
      essential: false,
      content: 'Internet connectivity: 99.9% uptime this month, no outages recorded.',
      relevanceNote: 'Rules out an internet outage as any part of the explanation.',
    },
  ],

  timeline: [
    { id: 'tl-1', text: "Backup service account credential expires, nightly backups begin failing silently", timestamp: '6 weeks ago, 02:00', isChange: true },
    { id: 'tl-2', text: 'First backup failure alert sent to a former employee\'s unread mailbox', timestamp: '6 weeks ago, 02:05' },
    { id: 'tl-3', text: 'Student accidentally deletes their coursework folder while tidying files', timestamp: 'Monday 14:20' },
    { id: 'tl-4', text: 'Student notices the folder is missing', timestamp: 'Monday 14:35' },
    { id: 'tl-5', text: 'Student raises a helpdesk ticket requesting a restore', timestamp: 'Monday 15:10' },
    { id: 'tl-6', text: 'IT attempts to restore from the nightly backup', timestamp: 'Monday 16:00' },
    { id: 'tl-7', text: 'Restore fails - most recent successful backup is six weeks old', timestamp: 'Monday 16:20' },
  ],
  firstSymptomEventId: 'tl-4',

  factors: [
    { id: 'fac-backupfail', text: 'The nightly backup job had been failing for six weeks', category: 'possibleRootCause', fishboneCategory: 'technology', feedback: 'Worth investigating further - this is the gap that left no working backup when it was needed.' },
    { id: 'fac-alertlist', text: "Backup failure alerts went to a former employee's mailbox", category: 'contributing', fishboneCategory: 'process', feedback: 'A contributing factor: it meant the six weeks of failures were invisible to anyone who could act on them.' },
    { id: 'fac-leaverprocess', text: "The leaver process never removed the former employee from alert distribution lists", category: 'contributing', fishboneCategory: 'process', feedback: 'A contributing factor: this is why the alert list was wrong in the first place.' },
    { id: 'fac-deletion', text: 'The student accidentally deleted the folder', category: 'contributing', fishboneCategory: 'people', feedback: "A contributing factor and a normal human slip - the real question is why there was no working backup to fall back on." },
    { id: 'fac-blame-student', text: 'The student should have been more careful with their files', category: 'notRelevant', fishboneCategory: 'people', feedback: 'This blames the student for a normal mistake, rather than asking why the safety net of backups was not there to catch it.' },
    { id: 'fac-laptop', text: "No student devices were reported stolen this term", category: 'notRelevant', fishboneCategory: 'environment', feedback: 'Not relevant - the file was never on a personal device.' },
  ],

  faultTree: {
    rootId: 'top',
    nodes: {
      top: {
        id: 'top',
        label: "A student's coursework folder cannot be restored after being deleted",
        gate: 'OR',
        children: ['n-neversaved', 'n-ransomware', 'n-permloss'],
        gateFeedback: 'Any one of these three different explanations alone would be enough to explain an unrecoverable file, so this is an OR gate between them.',
        buildOptions: [
          { id: 'top-opt-permloss', label: 'The file was accidentally deleted and no working backup exists', correct: true },
          { id: 'top-opt-neversaved', label: 'The file was never actually saved in the first place', correct: true },
          { id: 'top-opt-ransomware', label: 'Ransomware encrypted the backups', correct: true },
          { id: 'top-opt-laptop', label: "The student's laptop was stolen", correct: false, feedback: 'The file lived on the shared network drive, not a personal laptop.' },
          { id: 'top-opt-internet', label: 'The college internet connection failed', correct: false, feedback: 'A restore from a local backup server does not depend on internet connectivity, and the network report shows no outage anyway.' },
        ],
      },
      'n-neversaved': {
        id: 'n-neversaved', label: 'The file was never actually saved in the first place', gate: null, children: [],
        correctVerdict: 'ruledOut', verdictEvidenceIds: ['ev-fileaudit'],
        verdictFeedback: 'The file history shows the folder was created three weeks ago and regularly saved to - ruled out.',
      },
      'n-ransomware': {
        id: 'n-ransomware', label: 'Ransomware encrypted the backups', gate: null, children: [],
        correctVerdict: 'ruledOut', verdictEvidenceIds: ['ev-secscan'],
        verdictFeedback: 'The security scan found no ransomware or unusual encryption activity - ruled out.',
      },
      'n-permloss': {
        id: 'n-permloss',
        label: 'The file was accidentally deleted and no working backup exists',
        gate: 'AND',
        children: ['n-deleted', 'n-backupfailed', 'n-alertmissed'],
        gateFeedback:
          'Permanent loss needed all three of these together: the file had to be deleted, the backup had to have no usable ' +
          'recent copy, and nobody could have been warned in time to fix it. Any one alone would not have caused permanent ' +
          'loss, so this is an AND gate.',
        buildOptions: [
          { id: 'permloss-opt-deleted', label: 'The file was accidentally deleted', correct: true },
          { id: 'permloss-opt-backup', label: 'The nightly backup job had been failing for weeks', correct: true },
          { id: 'permloss-opt-alert', label: "Backup failure alerts were going to a former employee's mailbox", correct: true },
          { id: 'permloss-opt-neversaved', label: 'The file was never saved in the first place', correct: false, feedback: 'The file history shows it was saved regularly - this belongs under a different branch entirely, and is already ruled out.' },
          { id: 'permloss-opt-ransomware', label: 'Ransomware encrypted the backups', correct: false, feedback: 'The security scan already ruled this out - it belongs under a different branch.' },
        ],
      },
      'n-deleted': {
        id: 'n-deleted', label: 'The file was accidentally deleted', gate: null, children: [],
        correctVerdict: 'confirmed', verdictEvidenceIds: ['ev-deletionlog', 'ev-ticket'],
        verdictFeedback: "The file server audit log and the student's own ticket both confirm the accidental deletion - confirmed.",
      },
      'n-backupfailed': {
        id: 'n-backupfailed', label: 'The nightly backup job had been failing for weeks', gate: null, children: [],
        correctVerdict: 'confirmed', verdictEvidenceIds: ['ev-backuplog'],
        verdictFeedback: 'The backup job run history shows six consecutive weeks of failures - confirmed.',
      },
      'n-alertmissed': {
        id: 'n-alertmissed', label: "Backup failure alerts were going to a former employee's mailbox", gate: null, children: [],
        correctVerdict: 'confirmed', verdictEvidenceIds: ['ev-alertconfig', 'ev-hrrecord'],
        verdictFeedback: "The alert distribution list and the HR leaver record together confirm the alerts went to a mailbox nobody has read in ten weeks - confirmed.",
      },
    },
    pool: [
      { id: 'pool-laptop', label: "The student's laptop was stolen" },
      { id: 'pool-internet', label: 'The college internet connection failed' },
    ],
    explanation: {
      id: 'fta-explanation',
      prompt: 'Explain in two sentences how the confirmed causes combine to produce the incident.',
      minWords: 20,
      concepts: [
        { label: 'Names the accidental deletion', terms: ['deleted', 'deletion'], required: false },
        { label: 'Names the backup failure', terms: ['backup', 'failing', 'failed'], required: true },
        { label: 'Names the misdirected alerts', terms: ['alert', 'mailbox', 'former employee', 'leaver'], required: false },
      ],
      modelAnswer:
        'The student accidentally deleted their folder, which would normally be recoverable from the nightly backup. But that backup had been failing for six weeks, and the failure alerts were going to a former employee\'s unmonitored mailbox, so nobody could have known to fix it before the deletion happened.',
    },
  },

  rootCause: {
    candidates: [
      { id: 'rc-symptom', type: 'symptom', text: "A student's coursework cannot be restored", feedback: 'This is the symptom you started from, not an explanation of it.' },
      { id: 'rc-immediate', type: 'immediate', text: 'The nightly backup job had not produced a working backup in six weeks', feedback: 'This is the immediate mechanism, but it does not explain why nobody noticed or fixed it.' },
      { id: 'rc-blame', type: 'blame', text: 'The student should have been more careful not to delete the folder', feedback: 'This blames the student for a normal mistake rather than asking why there was no safety net.' },
      { id: 'rc-root', type: 'root', text: "Backup failure alerts were sent to a leaver's unmonitored mailbox, so a six-week backup failure went unnoticed until a routine accidental deletion had no working backup to fall back on", feedback: 'This explains the mechanism and the missing safeguard, and points to fixes rather than blame.' },
    ],
    criteria: [
      { id: 'crit-recur', question: 'Would removing it prevent recurrence?', correctAnswerForRoot: true, needsEvidence: true, supportingEvidenceIds: ['ev-alertconfig'] },
      { id: 'crit-explain', question: 'Does it explain the symptoms and "why now"?', correctAnswerForRoot: true, needsEvidence: false },
      { id: 'crit-support', question: 'Is it supported by logs, configs or measurements?', correctAnswerForRoot: true, needsEvidence: true, supportingEvidenceIds: ['ev-backuplog', 'ev-hrrecord'] },
      { id: 'crit-action', question: 'Does it point to an action that improves the system, not just to blame?', correctAnswerForRoot: true, needsEvidence: false },
    ],
    statement: {
      id: 'rc-statement',
      prompt: 'Write the root cause statement in your own words.',
      minWords: 15,
      concepts: [
        { label: 'Names the misdirected alerts', terms: ['alert', 'mailbox', 'leaver', 'former employee'], required: true },
        { label: 'Names the ongoing backup failure', terms: ['backup', 'failing', 'weeks'], required: false },
      ],
      modelAnswer:
        'Backup failure alerts were being sent to a former employee\'s mailbox that nobody was monitoring, so a six-week run of failed backups went unnoticed until an accidental deletion left nothing to restore from.',
    },
  },

  actions: [
    { id: 'act-fix-list', text: 'Update the backup alert distribution list to a monitored team mailbox', category: 'preventative', feedback: 'Preventative - removes the condition that let six weeks of failures go unseen.' },
    { id: 'act-verify-backup', text: 'Add an automated check that confirms each backup actually completed, with its own separate alert path', category: 'preventative', feedback: 'Preventative - catches failures even if one alert path is ever wrong again.' },
    { id: 'act-leaver-process', text: 'Add a step to the staff-leaver process that removes leavers from every distribution and alert list', category: 'preventative', feedback: 'Preventative - stops this specific failure mode recurring for a different alert.' },
    { id: 'act-attempt-recovery', text: 'Attempt every available recovery option for this student\'s file', category: 'corrective', feedback: 'Corrective - addresses this specific loss, but does not prevent the next one.' },
    { id: 'act-manual-daily-check', text: 'Ask an IT technician to manually check the backup logs every single morning indefinitely', category: 'corrective', feedback: 'This treats the symptom with ongoing manual effort rather than fixing the alerting and verification gaps - a fragile stopgap, not a real fix.' },
    { id: 'act-discipline-student', text: 'Formally discipline the student for deleting the folder', category: 'notAppropriate', feedback: 'Not appropriate - blames the student for a normal mistake instead of fixing the missing safety net.' },
    { id: 'act-ban-deletion', text: 'Remove every student\'s ability to delete any file, ever', category: 'notAppropriate', feedback: 'Not appropriate - wildly disproportionate, and does not address the real gap in backup alerting.' },
    { id: 'act-extension-policy', text: "Apologise to the student and extend the deadline while backups are fixed", category: 'corrective', feedback: 'Corrective and reasonable right now, but it does not by itself prevent the next student losing work the same way.' },
  ],
  chooseOnePreventative: {
    id: 'pref-explain',
    prompt: 'Choose one preventative action and explain how it stops this root cause recurring.',
    minWords: 20,
    concepts: [
      { label: 'Names a specific preventative action', terms: ['alert', 'monitor', 'leaver', 'verify', 'automated check'], required: true },
      { label: 'Links the action to preventing recurrence', terms: ['recur', 'prevent', 'again', 'future', 'before it'], required: false },
    ],
    modelAnswer:
      'Updating the alert list to a monitored team mailbox means a backup failure will be seen and acted on within a day, instead of silently accumulating for weeks like this one did.',
  },

  verification: {
    steps: [
      { id: 'ver-1', text: 'Send a test backup-failure alert and confirm it reaches a monitored, active inbox', correct: true, feedback: 'A direct test of the fix against the original failure condition.' },
      { id: 'ver-2', text: 'Confirm the automated backup-verification check fires correctly in a test', correct: true, feedback: 'Confirms the new safeguard works, not just the alert address.' },
      { id: 'ver-3', text: 'Ask the student if they are happy with how it was handled', correct: false, feedback: 'Useful for customer care, but it does not verify the technical fix.' },
      { id: 'ver-4', text: 'Monitor backup success rate over the next month', correct: true, feedback: 'A real-world check that the fix holds under normal use.' },
      { id: 'ver-5', text: "Re-image the student's laptop", correct: false, feedback: 'Irrelevant - the file was never on a personal device.' },
      { id: 'ver-6', text: 'Check antivirus is up to date on all student laptops', correct: false, feedback: 'Unrelated to the backup and alerting gap that caused this.' },
    ],
    pickCount: 2,
    monitoring: [
      { id: 'mon-1', text: 'Alert a monitored team mailbox immediately if any nightly backup job does not complete successfully', correct: true, feedback: 'Fast, monitored warning that would have caught this within a day.' },
      { id: 'mon-2', text: 'Check backup logs manually once a term', correct: false, feedback: 'Far too infrequent - this fault ran unnoticed for six weeks already.' },
      { id: 'mon-3', text: 'Alert only after backups have failed for a full year', correct: false, feedback: 'Far too slow to be useful.' },
      { id: 'mon-4', text: 'Rely on students to notice if their backup is missing', correct: false, feedback: 'Reactive, not monitoring - students have no way to know until they need a restore.' },
    ],
  },

  lessonsLearned: {
    id: 'lessons-backuploss',
    prompt: 'Write a two or three sentence lessons-learned note for a knowledge base article.',
    minWords: 20,
    concepts: [
      { label: 'Generalises beyond this one alert list', terms: ['any alert', 'every alert', 'general', 'across'], required: false },
      { label: 'Names a reusable preventative principle', terms: ['monitor', 'verify', 'leaver', 'alert'], required: true },
    ],
    modelAnswer:
      'Alerts are only useful if they reach a mailbox someone is actually monitoring, so the leaver process must always clear out distribution lists. Backup success should also be verified automatically, not assumed, so a silent failure cannot run for weeks unnoticed.',
  },
};

export default scenario;
