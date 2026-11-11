/**
 * Scenario 1: Wi-Fi drops in Room B12.
 * Support / 5 Whys / difficulty 1.
 * Root cause (outline): DHCP pool exhausted after a guest event. Lease
 * time far too long, and no alert on pool utilisation.
 * See ../../../DESIGN.md sections 6, 7 and 8.1 for the shapes used here.
 */

const scenario = {
  id: 'wifi-b12',
  title: 'Wi-Fi drops in Room B12',
  domain: 'support',
  difficulty: 1,
  technique: 'fiveWhys',
  estimatedMinutes: 25,

  briefing: {
    ticketRef: 'HD-4412',
    loggedAt: 'Monday 09:41',
    reports: [
      '"The Wi-Fi in B12 keeps cutting out, it\'s really annoying." - Student, 09:18',
      '"Three of my laptops dropped off the network mid-lesson." - Teacher, 09:36',
      '"This happened last month too, same room, same time of day." - Technician note, 09:40',
    ],
    question: 'Does this warrant a full Root Cause Analysis?',
    correctWarrantsRca: true,
    reasons: [
      { id: 'recurring', label: 'It is a recurring problem, not a one-off', correct: true },
      { id: 'highImpact', label: 'It disrupts a whole room of users during lessons', correct: true },
      { id: 'security', label: 'It involves a security or data breach', correct: false },
      { id: 'failedChange', label: 'It followed a known failed change', correct: false },
      { id: 'formalRecord', label: 'A formal record is required for this ticket', correct: false },
    ],
  },

  problem: {
    slots: [
      {
        id: 'what',
        label: 'What',
        options: [
          { id: 'what-1', text: 'the Wi-Fi is rubbish', correct: false, feedback: 'Too vague to act on - "rubbish" is not a fault anyone can investigate.' },
          { id: 'what-2', text: 'the router is broken', correct: false, feedback: 'This assumes a cause (a broken router) that has not been confirmed yet.' },
          { id: 'what-3', text: 'devices repeatedly lose their Wi-Fi connection', correct: true, feedback: 'Precise and describes the observed symptom, not a guessed cause.' },
        ],
      },
      {
        id: 'where',
        label: 'Where',
        options: [
          { id: 'where-1', text: 'somewhere in the building', correct: false, feedback: 'Too vague - the ticket names the room.' },
          { id: 'where-2', text: 'Room B12', correct: true, feedback: 'Matches the location given in the reports.' },
          { id: 'where-3', text: 'the whole campus network', correct: false, feedback: 'No evidence yet that this is campus-wide.' },
        ],
      },
      {
        id: 'who',
        label: 'Who',
        options: [
          { id: 'who-1', text: 'everyone', correct: false, feedback: 'Too broad - only devices in one room are affected so far.' },
          { id: 'who-2', text: 'students and staff using Wi-Fi in Room B12', correct: true, feedback: 'Matches exactly who reported the fault.' },
          { id: 'who-3', text: 'whoever configured the network', correct: false, feedback: 'That is a guess about who is at fault, not who is affected.' },
        ],
      },
      {
        id: 'when',
        label: 'When',
        options: [
          { id: 'when-1', text: 'all the time', correct: false, feedback: 'The reports point to a specific time window, not constant failure.' },
          { id: 'when-2', text: 'mid-morning lessons, around 09:00-10:00', correct: true, feedback: 'Matches the timestamps in the reports and the technician\'s note.' },
          { id: 'when-3', text: 'ever since the network was installed', correct: false, feedback: 'Nothing in the brief supports this timeframe.' },
        ],
      },
      {
        id: 'howOften',
        label: 'How often',
        options: [
          { id: 'often-1', text: 'constantly', correct: false, feedback: 'Not supported - this happened today and once before, not continuously.' },
          { id: 'often-2', text: 'twice now, a month apart, same room and time', correct: true, feedback: 'Matches the technician\'s note that this happened last month too.' },
          { id: 'often-3', text: 'this is the first time it has ever happened', correct: false, feedback: 'The technician\'s note says otherwise.' },
        ],
      },
    ],
  },

  containment: {
    options: [
      {
        id: 'contain-restart-controller',
        text: 'Restart the Wi-Fi controller for Room B12',
        best: false,
        feedback: 'This can briefly free some addresses but the underlying pool will fill again within the hour.',
      },
      {
        id: 'contain-clear-dhcp',
        text: "Clear the DHCP server's lease table and restart the DHCP service",
        best: false,
        feedback: 'This restores service quickly, but it also erases the lease history you will need as evidence.',
        destroysEvidenceId: 'ev-dhcplog',
      },
      {
        id: 'contain-move-vlan',
        text: 'Temporarily move affected devices onto the guest Wi-Fi VLAN, which still has free addresses',
        best: true,
        feedback: 'Restores service for affected users without touching the evidence on the faulty scope.',
      },
      {
        id: 'contain-mobile-data',
        text: 'Tell users to switch to mobile data until it is fixed',
        best: false,
        feedback: 'This works around the problem for individuals but does not restore the service itself.',
      },
    ],
    finishedQuestion: 'Service is restored. Is the RCA finished?',
    prematureConsequence:
      'Three days later, the same fault returns at the same time of day. The ticket is reopened, and the pattern is now three months in a row.',
  },

  evidence: [
    {
      id: 'ev-eventviewer',
      source: 'Event Viewer extract (B12 switch)',
      kind: 'log',
      essential: true,
      content:
        '09:08  Info     Device assoc: 41 clients on SSID college-staff/B12\n' +
        '09:11  Warning  DHCP: no DHCPACK received for client 3c:5a:b4:...\n' +
        '09:14  Warning  DHCP: no DHCPACK received for client 88:1f:a1:...\n' +
        '09:19  Warning  DHCP: no DHCPACK received for client (x7 more clients)\n' +
        '09:36  Error    DHCP: lease request failed, no addresses available',
      relevanceNote: 'Shows devices failing to get a DHCP lease, not an access point or signal fault.',
    },
    {
      id: 'ev-dhcplog',
      source: 'DHCP server log',
      kind: 'log',
      essential: true,
      destroyedBy: 'contain-clear-dhcp',
      content:
        'Scope: 10.14.12.0/24 (B12-Wifi)\n' +
        '09:00  Leased: 211/254 (83%)\n' +
        '09:20  Leased: 248/254 (98%)\n' +
        '09:32  Leased: 254/254 (100%) - pool exhausted\n' +
        '09:32  DHCPDISCOVER received, no free address, request dropped',
      relevanceNote: 'Confirms the DHCP scope ran completely out of addresses at 09:32.',
    },
    {
      id: 'ev-config',
      source: 'DHCP scope configuration diff',
      kind: 'config',
      essential: true,
      content:
        'Scope: B12-Wifi (10.14.12.0/24)\n' +
        '- Lease duration: 1 day   (changed 2025-03-02)\n' +
        '+ Lease duration: 7 days  (changed 2025-03-02, reason: "reduce renewal traffic")',
      relevanceNote: 'Shows the lease time was deliberately set to 7 days, far longer than needed.',
    },
    {
      id: 'ev-monitor',
      source: 'Network monitoring dashboard (description)',
      kind: 'monitoring',
      essential: true,
      content:
        'Panel: B12-Wifi pool utilisation. Line graph rises steadily from 60% at 08:30 to 100% at 09:32,\n' +
        'then flatlines. No alert rule exists for this panel - alert rules list shows thresholds configured\n' +
        'for three other scopes, but none for B12-Wifi.',
      relevanceNote: 'Nobody was warned the pool was filling, because no alert threshold was ever set.',
    },
    {
      id: 'ev-ticket',
      source: 'Ticket history for B12',
      kind: 'ticket',
      essential: true,
      content:
        'HD-3310 (last month, 09:40) "Wi-Fi dropped in B12" - closed, "restarted controller, resolved"\n' +
        'HD-2187 (2 months ago, 14:10) "Projector fault in B12" - unrelated\n' +
        'HD-1998 (3 months ago, 09:25) "Wi-Fi dropped in B12" - closed, "restarted controller, resolved"',
      relevanceNote: 'Shows this is the third occurrence, always mid-morning, each time "fixed" by a restart that did not address the cause.',
    },
    {
      id: 'ev-guestemail',
      source: 'Email: Open Day coordinator',
      kind: 'report',
      essential: true,
      content:
        'Subject: Guest Wi-Fi for Open Day visitors\n' +
        'From: events@college\n' +
        'Could IT enable guest Wi-Fi access for around 120 visitors this morning, 9am-11am? ' +
        'They will be using the B12 corridor and adjoining rooms.',
      relevanceNote: 'Explains the demand spike: around 120 extra devices joined the same subnet that morning.',
    },
    {
      id: 'ev-changelog',
      source: 'Infrastructure change log',
      kind: 'change',
      essential: true,
      content: 'No infrastructure changes logged for the B12 network in the last 7 days.',
      relevanceNote: 'Rules out a recent failed change as the trigger - the DHCP lease setting is older than that.',
    },
    {
      id: 'ev-apfirmware',
      source: 'Access point firmware report',
      kind: 'report',
      essential: false,
      content: 'B12-AP-01, B12-AP-02: firmware v4.1.2, last updated 11 months ago. No pending updates.',
      relevanceNote: 'The access point hardware and firmware have not changed - not the cause here.',
    },
    {
      id: 'ev-voicemail',
      source: 'Helpdesk voicemail transcript',
      kind: 'report',
      essential: false,
      content: '"Yeah so basically the Wi-Fi is just rubbish in that room, can someone sort it out, thanks."',
      relevanceNote: 'Confirms the symptom but adds no new detail - too vague to act on alone.',
    },
    {
      id: 'ev-sitesurvey',
      source: 'Wi-Fi site survey (2 years old)',
      kind: 'report',
      essential: false,
      content: 'Room B12: signal strength -48dBm (excellent) across the room. No dead spots recorded.',
      relevanceNote: 'Rules out poor signal coverage as the cause - and this survey predates today\'s fault anyway.',
    },
  ],

  timeline: [
    { id: 'tl-1', text: 'Open Day coordinator emails IT requesting guest Wi-Fi for visitors', timestamp: '08:15', isChange: true },
    { id: 'tl-2', text: 'Guest devices begin joining the B12-Wifi subnet', timestamp: '08:50' },
    { id: 'tl-3', text: 'DHCP pool utilisation passes 95%', timestamp: '09:20' },
    { id: 'tl-4', text: 'First students report dropped connections', timestamp: '09:18' },
    { id: 'tl-5', text: 'DHCP pool reaches 100%, new leases start failing', timestamp: '09:32' },
    { id: 'tl-6', text: 'Teacher reports three laptops dropping mid-lesson', timestamp: '09:36' },
    { id: 'tl-7', text: 'Technician logs that this also happened last month', timestamp: '09:40' },
  ],
  firstSymptomEventId: 'tl-4',

  factors: [
    { id: 'fac-lease', text: 'DHCP lease time set to 7 days instead of 1 day', category: 'possibleRootCause', fishboneCategory: 'technology', feedback: 'Worth investigating further - this is the setting that let the pool fill and stay full.' },
    { id: 'fac-noalert', text: 'No alert configured for DHCP pool utilisation', category: 'contributing', fishboneCategory: 'process', feedback: 'A contributing factor: it meant nobody could act before the pool emptied out.' },
    { id: 'fac-guestevent', text: 'Open Day added around 120 extra devices to the same subnet', fishboneCategory: 'environment', category: 'contributing', feedback: 'A contributing factor: it created the demand spike that exposed the undersized effective pool.' },
    { id: 'fac-apfirmware', text: 'Access point firmware has not been updated in 11 months', fishboneCategory: 'technology', category: 'notRelevant', feedback: 'Not relevant here - the firmware report shows no related issue.' },
    { id: 'fac-pastfixes', text: 'Previous tickets were closed with a restart instead of investigation', fishboneCategory: 'process', category: 'contributing', feedback: 'A contributing factor: it let the real cause persist through two earlier occurrences.' },
    { id: 'fac-roomsize', text: 'Room B12 is a large room with many desks', fishboneCategory: 'environment', category: 'notRelevant', feedback: 'Room size is not implicated by any evidence collected.' },
    { id: 'fac-blame-tech', text: 'The technician who closed the earlier tickets made a mistake', category: 'notRelevant', feedback: 'This blames a person rather than pointing at the system. The real issue is what let a restart count as a resolution.' },
  ],

  fiveWhys: {
    startStatement: 'Users in Room B12 repeatedly lose their Wi-Fi connection during mid-morning lessons.',
    levels: [
      {
        options: [
          { id: 'l1-correct', text: 'Devices in B12 are failing to get an IP address lease from the DHCP server', tag: 'correct', feedback: 'Right - the Event Viewer extract shows repeated DHCP lease failures, not a signal or hardware fault.' },
          { id: 'l1-restate', text: 'The Wi-Fi keeps dropping', tag: 'restatement', feedback: 'That restates the symptom in different words rather than explaining it.' },
          { id: 'l1-leap', text: 'The access point has been compromised', tag: 'leap', feedback: 'Nothing in the evidence points to a security compromise - this skips a link in the chain.' },
          { id: 'l1-blame', text: 'The network technician set up the room badly', tag: 'blame', feedback: 'This blames a person instead of explaining a mechanism.' },
        ],
        supportingEvidenceIds: ['ev-eventviewer'],
        justification: {
          id: 'j1',
          prompt: 'In one sentence, explain how the evidence supports this answer.',
          minWords: 8,
          concepts: [
            { label: 'Cites the DHCP lease failure evidence', terms: ['event viewer', 'dhcp', 'lease', 'nak', 'no address'], required: true },
          ],
          modelAnswer: 'The Event Viewer extract shows repeated "no DHCPACK received" and lease request failures at the same time users reported dropping.',
        },
        stopsTooEarly: false,
      },
      {
        options: [
          { id: 'l2-correct', text: 'The DHCP scope for that subnet has run out of free addresses', tag: 'correct', feedback: 'Right - the DHCP server log shows the scope reaching 254/254 leases at 09:32.' },
          { id: 'l2-restate', text: 'Devices cannot get an IP address', tag: 'restatement', feedback: 'That is the same statement as the previous level, just reworded.' },
          { id: 'l2-leap', text: 'The DHCP server has been hacked', tag: 'leap', feedback: 'No evidence suggests a compromise - the log shows a capacity problem, not an intrusion.' },
          { id: 'l2-unrelated', text: 'There are more devices in college than five years ago', tag: 'unrelated', feedback: 'Probably true, but it does not explain why the pool ran out specifically today.' },
        ],
        supportingEvidenceIds: ['ev-dhcplog'],
        justification: {
          id: 'j2',
          prompt: 'In one sentence, explain how the evidence supports this answer.',
          minWords: 8,
          concepts: [
            { label: 'Cites the DHCP server log showing pool exhaustion', terms: ['dhcp log', 'pool', 'exhaust', '254', '100%', 'scope'], required: true },
          ],
          modelAnswer: 'The DHCP server log shows the B12-Wifi scope climbing to 254 of 254 leases at 09:32, exactly when failures began.',
        },
        stopsTooEarly: true,
        stopFeedback: 'If you only free up addresses today, the pool will simply fill up again next time demand spikes. Why did it run out in the first place?',
      },
      {
        options: [
          { id: 'l3-correct', text: 'Lease times are set to 7 days, so devices that connected for the Open Day kept their address long after they left, while around 120 extra guest devices joined the same subnet', tag: 'correct', feedback: 'Right - the config diff shows a 7-day lease, and the Open Day email explains the sudden demand spike.' },
          { id: 'l3-restate', text: 'Too many devices tried to connect at once', tag: 'restatement', feedback: 'That restates "the pool ran out" without explaining why addresses were not being freed.' },
          { id: 'l3-leap', text: 'Someone deliberately limited the Wi-Fi to 50 devices', tag: 'leap', feedback: 'There is no evidence of a deliberate limit - the scope is simply undersized for a 7-day lease plus a demand spike.' },
          { id: 'l3-blame', text: 'The Open Day organiser should have warned IT earlier', tag: 'blame', feedback: 'The organiser did email IT in advance - and blaming them does not explain the technical mechanism.' },
        ],
        supportingEvidenceIds: ['ev-config', 'ev-guestemail'],
        justification: {
          id: 'j3',
          prompt: 'In one sentence, explain how the evidence supports this answer.',
          minWords: 8,
          concepts: [
            { label: 'Cites the 7-day lease setting', terms: ['lease', '7 day', 'seven day', 'lease time', 'lease duration'], required: true },
            { label: 'Cites the Open Day demand spike', terms: ['open day', 'guest', 'visitor', '120', 'spike'], required: false },
          ],
          modelAnswer: 'The config diff shows a 7-day lease time, and the Open Day email shows around 120 guest devices joined the same subnet that morning, so old leases had not expired before new demand arrived.',
        },
        stopsTooEarly: false,
      },
      {
        options: [
          { id: 'l4-correct', text: 'There is no alert configured for DHCP pool utilisation, so nobody was warned the pool was filling before it ran out', tag: 'correct', feedback: 'Right - the monitoring dashboard shows thresholds exist for other scopes but not this one.' },
          { id: 'l4-restate', text: 'Nobody noticed the pool filling up in time', tag: 'restatement', feedback: 'That restates the problem without pointing at what in the system caused it.' },
          { id: 'l4-leap', text: 'The monitoring software is broken', tag: 'leap', feedback: 'The dashboard works fine for other scopes - this scope simply never had a threshold set.' },
          { id: 'l4-blame', text: 'The monitoring team ignored the warning signs', tag: 'blame', feedback: 'There was no alert to ignore - the gap is a missing configuration, not a person failing to act.' },
        ],
        supportingEvidenceIds: ['ev-monitor'],
        justification: {
          id: 'j4',
          prompt: 'In one sentence, explain how the evidence supports this answer.',
          minWords: 8,
          concepts: [
            { label: 'Cites the missing alert threshold', terms: ['alert', 'threshold', 'monitor', 'utilisation'], required: true },
          ],
          modelAnswer: 'The monitoring dashboard shows alert thresholds configured for three other scopes, but none for B12-Wifi, so the rising utilisation went unnoticed.',
        },
        stopsTooEarly: false,
      },
    ],
  },

  rootCause: {
    candidates: [
      { id: 'rc-symptom', type: 'symptom', text: 'Wi-Fi in Room B12 drops frequently during lessons', feedback: 'This is the symptom you started from, not an explanation of it.' },
      { id: 'rc-immediate', type: 'immediate', text: 'The DHCP pool ran out of addresses', feedback: 'This is the immediate mechanism, but it does not explain why the pool ran out or why it keeps happening.' },
      { id: 'rc-blame', type: 'blame', text: 'IT support should have noticed the problem sooner', feedback: 'This blames a person rather than identifying what in the system allowed the fault.' },
      { id: 'rc-root', type: 'root', text: 'DHCP lease times are set far longer than needed, and no alert exists on pool utilisation, so a demand spike exhausts the pool unnoticed', feedback: 'This explains the mechanism and the missing safeguard, and points to fixes rather than blame.' },
    ],
    criteria: [
      { id: 'crit-recur', question: 'Would removing it prevent recurrence?', correctAnswerForRoot: true, needsEvidence: true, supportingEvidenceIds: ['ev-config'] },
      { id: 'crit-explain', question: 'Does it explain the symptoms and "why now"?', correctAnswerForRoot: true, needsEvidence: false },
      { id: 'crit-support', question: 'Is it supported by logs, configs or measurements?', correctAnswerForRoot: true, needsEvidence: true, supportingEvidenceIds: ['ev-dhcplog', 'ev-monitor'] },
      { id: 'crit-action', question: 'Does it point to an action that improves the system, not just to blame?', correctAnswerForRoot: true, needsEvidence: false },
    ],
    statement: {
      id: 'rc-statement',
      prompt: 'Write the root cause statement in your own words.',
      minWords: 15,
      concepts: [
        { label: 'Names the DHCP lease duration as the enabling condition', terms: ['lease', 'lease time', 'lease duration', '7 day', 'seven day'], required: true },
        { label: 'Names the missing alert/monitoring on pool utilisation', terms: ['alert', 'monitor', 'threshold', 'utilisation'], required: false },
        { label: 'Names the demand spike as the trigger', terms: ['guest', 'open day', 'spike', 'demand'], required: false },
      ],
      modelAnswer:
        'DHCP lease times were set far longer than necessary, so when the Open Day created a temporary spike in demand, the address pool filled up and was not freed quickly enough, and no alert existed to warn the team before it ran out.',
    },
  },

  actions: [
    { id: 'act-reduce-lease', text: 'Reduce the DHCP lease time to something appropriate for a teaching space (e.g. 4-8 hours)', category: 'preventative', feedback: 'Preventative - it removes the condition that let stale leases linger.' },
    { id: 'act-add-alert', text: 'Add a monitoring alert that fires when DHCP pool utilisation exceeds 80%', category: 'preventative', feedback: 'Preventative - it gives the team warning before the pool is exhausted.' },
    { id: 'act-restart-again', text: 'Restart the Wi-Fi controller', category: 'corrective', feedback: 'Corrective - it clears today\'s symptom but does not prevent recurrence on its own.' },
    { id: 'act-move-vlan', text: 'Move affected devices onto the guest VLAN for the rest of the day', category: 'corrective', feedback: 'Corrective - a short-term fix to restore service today.' },
    { id: 'act-expand-scope', text: 'Expand the size of the DHCP scope to allow more simultaneous leases', category: 'preventative', feedback: 'Preventative - increases headroom, though it works best alongside a shorter lease time.' },
    { id: 'act-discipline', text: 'Formally discipline the technician who closed the earlier tickets', category: 'notAppropriate', feedback: 'Not appropriate - this blames an individual instead of fixing the process that let a restart count as a resolution.' },
    { id: 'act-ban-guest', text: 'Permanently ban all guest Wi-Fi access at the college', category: 'notAppropriate', feedback: 'Not appropriate - disproportionate, and it does not address the actual cause (lease time and missing alerting).' },
    { id: 'act-review-process', text: 'Review the ticket-closure process so recurring tickets must be investigated, not just restarted', category: 'preventative', feedback: 'Preventative - addresses the process gap that let this recur twice before being investigated.' },
    { id: 'act-email-users', text: 'Send an email asking users to report Wi-Fi problems politely', category: 'notAppropriate', feedback: 'Not appropriate - it does not change anything about the system that caused the fault.' },
  ],
  chooseOnePreventative: {
    id: 'pref-explain',
    prompt: 'Choose one preventative action and explain how it stops this root cause recurring.',
    minWords: 20,
    concepts: [
      { label: 'Names a specific preventative action', terms: ['lease', 'alert', 'threshold', 'scope', 'process', 'review'], required: true },
      { label: 'Links the action to preventing recurrence', terms: ['recur', 'prevent', 'again', 'future', 'before it'], required: false },
    ],
    modelAnswer:
      'Adding an alert when DHCP pool utilisation exceeds 80% means the team will be warned before the pool is exhausted, so they can intervene before any lesson loses connectivity again.',
  },

  verification: {
    steps: [
      { id: 'ver-1', text: 'Reduce the lease time and confirm the scope no longer fills during a simulated busy morning', correct: true, feedback: 'A direct test of the fix against the original failure condition.' },
      { id: 'ver-2', text: 'Confirm the new alert threshold fires correctly in a test', correct: true, feedback: 'Confirms the safeguard itself works, not just the symptom.' },
      { id: 'ver-3', text: 'Ask the Open Day organiser if they were happy with the Wi-Fi', correct: false, feedback: 'Feedback about user experience is useful, but it does not verify the technical fix.' },
      { id: 'ver-4', text: 'Check that B12 has not had a repeat ticket after one month', correct: true, feedback: 'A real-world check that the fix held under normal use.' },
      { id: 'ver-5', text: 'Repaint the access points', correct: false, feedback: 'Unrelated to the fault - this verifies nothing about the cause or fix.' },
      { id: 'ver-6', text: 'Re-run the firmware update check on the access points', correct: false, feedback: 'Firmware was never implicated, so this verifies nothing relevant.' },
    ],
    pickCount: 2,
    monitoring: [
      { id: 'mon-1', text: 'Alert when DHCP pool utilisation exceeds 80%', correct: true, feedback: 'Gives early warning with enough headroom to react before exhaustion.' },
      { id: 'mon-2', text: 'Check the DHCP server manually once a term', correct: false, feedback: 'Too infrequent to catch a spike that develops in under an hour.' },
      { id: 'mon-3', text: 'Alert when pool utilisation exceeds 99%', correct: false, feedback: 'Too close to exhaustion to give anyone time to react.' },
      { id: 'mon-4', text: 'Ask teachers to report problems as they happen', correct: false, feedback: 'Reactive, not monitoring - the fault has already occurred by the time anyone reports it.' },
    ],
  },

  lessonsLearned: {
    id: 'lessons-wifi',
    prompt: 'Write a two or three sentence lessons-learned note for a knowledge base article.',
    minWords: 20,
    concepts: [
      { label: 'Generalises the lesson beyond this one room', terms: ['any scope', 'other room', 'general', 'across'], required: false },
      { label: 'Names a reusable preventative principle', terms: ['alert', 'lease', 'threshold', 'monitor'], required: true },
    ],
    modelAnswer:
      'Long DHCP lease times combined with an unmonitored pool can silently exhaust capacity whenever demand spikes, such as an event or open day. Any shared-access scope should have a sensible lease time and a utilisation alert, not just this one.',
  },
};

export default scenario;
