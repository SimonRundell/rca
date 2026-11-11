# DESIGN.md: RCA Doctor

An interactive teaching and assessment tool for Root Cause Analysis, built for T-Level Digital students at Exeter College.

| | |
|---|---|
| **Working title** | RCA Doctor |
| **Audience** | T-Level Level 3 students, aged 16 to 19 |
| **Stack** | Vite + React + JavaScript, client-side only |
| **Backend** | None. No PHP, no MySQL, no API calls |
| **Source material** | `Root_Cause_Analysis_Overview.docx` (the teaching handout) |
| **Licence** | CC BY-NC-SA 4.0 International |

---

## 1. Purpose

Students read the handout and can usually recite what a root cause is. What they struggle with is doing it: stopping at "human error", accepting the first plausible story, or writing a why-chain that no log entry supports. This app puts them inside realistic incidents and makes them do the analysis, decision by decision, with their reasoning checked at every step.

It is not a slideshow. Every stage of every scenario requires a choice, a construction or a written justification, and wrong turns have consequences inside the scenario.

### 1.1 Learning outcomes

By the end of a scenario a student should be able to:

1. Decide whether an incident warrants RCA at all.
2. Write a precise problem statement (what, where, who, when, how often).
3. Separate containment from root cause work.
4. Select relevant evidence and build a timeline from it.
5. Run a **5 Whys** chain in which every link is supported by evidence.
6. Build a **Fault Tree** with correct AND/OR gates and use evidence to eliminate branches.
7. Test a proposed root cause against the four criteria in the handout.
8. Distinguish corrective from preventative actions.
9. Produce a professional RCA write-up.

5 Whys and FTA are the core techniques and carry most of the marks. Fishbone, Pareto, and Timeline and Change Analysis appear as supporting activities only.

### 1.2 Out of scope

- User accounts, logins, or any server-side storage.
- A teacher dashboard. Results reach the teacher as a printed or PDF report submitted to the Teams assignment.
- AI marking of free text.
- A scenario editor UI. Scenarios are authored as data files (section 7).

---

## 2. Design decisions already agreed

| Decision | Choice |
|---|---|
| Marking of reasoning | Hybrid. Choices and tree-building are auto-marked. Free text is checked against a keyword rubric, then the student compares their answer with a model answer |
| Results | A printable RCA report generated from the student's own answers, with scores, saved as PDF and submitted in Teams |
| Scenario domain | A mix of IT support and software development incidents |
| Fault tree input | Guided build. Per node the student picks causes from a pool and chooses the gate, then eliminates branches with evidence |

---

## 3. Technical approach

### 3.1 Stack and conventions

- Scaffolded with `npm create vite@latest` (React, JavaScript). The standard template structure is kept.
- After scaffolding, run `npx -y react-doctor@latest install`.
- JavaScript only. No TypeScript.
- **One stylesheet**: `src/index.css`. No inline styles, no CSS modules, no CSS-in-JS. The only permitted exception is computed SVG geometry (x, y, width attributes), which are attributes and not styles.
- All functions, components and data shapes documented with JSDoc.
- Dependencies kept to `react`, `react-dom` and `react-router-dom`. The fault tree is drawn as hand-built SVG. No D3, no drag-and-drop library, no UI kit.
- Body font Trebuchet MS. Log extracts, config snippets and code in Courier New.

### 3.2 Configuration

There is no backend and there are no secrets, so the app does not need a `.config.json`. App-level settings (title, pass threshold, feature flags) live in `src/config.js` and are bundled at build time. The `.htaccess` still blocks `.config.json` so the deployment pattern stays consistent with other projects and nothing leaks if one is added later.

### 3.3 Deployment

Static build (`npm run build`) uploaded to shared hosting. Root `.htaccess`:

```apache
RewriteEngine On

# Never expose configuration files to the browser.
<Files ".config.json">
    Require all denied
</Files>

# Let real files/directories resolve normally.
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Everything else falls back to index.html so React Router can handle
# client-side routes (e.g. a hard refresh).
RewriteRule ^ index.html [L]
```

The file sits in `public/` so Vite copies it into `dist/`. Set `base` in `vite.config.js` if the app is deployed to a subfolder.

### 3.4 Persistence

`localStorage` only, wrapped in try/catch so the app still runs in memory if storage is blocked on college machines.

- Key: `rcaTrainer.v1`
- Holds: student name, group, per-scenario progress, answers, scores, attempt counts.
- A "Reset my progress" control on the home page clears it after confirmation (in-page dialog, not `window.confirm`).

### 3.5 A known limitation

All scenario data, including correct answers, ships in the JavaScript bundle. A determined student can read it in DevTools. For a formative classroom tool this is acceptable, and the written justifications and the report give the teacher something that cannot be copied from the bundle without it being obvious. It is recorded here so nobody mistakes the score for a secure summative mark.

---

## 4. Application structure

### 4.1 Routes

| Route | Screen |
|---|---|
| `/` | Home: name entry, mode selection, scenario list with progress |
| `/learn` | Technique primer: short interactive refreshers for 5 Whys and FTA |
| `/triage` | "RCA or not?" warm-up round |
| `/scenario/:id` | Scenario player (stage stepper) |
| `/scenario/:id/report` | Generated RCA report with scores, print view |

### 4.2 File layout

```
rca-trainer/
├── public/
│   └── .htaccess
├── src/
│   ├── main.jsx
│   ├── App.jsx                 routes
│   ├── index.css               the single stylesheet
│   ├── config.js               app settings
│   ├── data/
│   │   ├── scenarios/
│   │   │   ├── index.js        exports the ordered scenario list
│   │   │   ├── wifi-b12.js
│   │   │   ├── login-failure.js
│   │   │   ├── site-down.js
│   │   │   ├── backup-loss.js
│   │   │   ├── checkout-totals.js
│   │   │   └── slow-api.js
│   │   ├── triageCases.js
│   │   └── primer.js
│   ├── context/
│   │   └── ProgressContext.jsx reducer + localStorage sync
│   ├── hooks/
│   │   └── useScenario.js
│   ├── lib/
│   │   ├── scoring.js          stage and scenario scoring
│   │   ├── rubric.js           keyword rubric matcher
│   │   ├── treeLayout.js       SVG fault tree layout
│   │   └── storage.js          safe localStorage wrapper
│   ├── components/
│   │   ├── layout/             Header, StageStepper, ScorePanel
│   │   ├── shared/             ChoiceList, EvidenceCard, FreeTextRubric,
│   │   │                       ModelAnswerReveal, FeedbackBanner, Dialog
│   │   ├── stages/             one component per workflow stage
│   │   ├── fivewhys/           WhyChain, WhyStep, StopOrContinue
│   │   ├── fta/                FaultTree, TreeNode, GatePicker,
│   │   │                       CausePool, BranchVerdict
│   │   └── report/             RcaReport, ReportSection
│   └── pages/                  Home, Learn, Triage, ScenarioPlayer, Report
├── DESIGN.md
├── README.md
└── LICENSE.md
```

### 4.3 State

One `ProgressContext` using `useReducer`. Actions are plain and serialisable (`ANSWER_STAGE`, `ADVANCE_STAGE`, `RESET_SCENARIO`, and so on), so the whole state can be written to storage after each dispatch. Stage components receive their slice of scenario data and their saved answer as props and report results upward. They hold only transient UI state locally.

---

## 5. Modes

| | Practice | Assessed |
|---|---|---|
| Hints | Available, each costs nothing | None |
| Feedback | Immediately after each decision | At the end of each stage |
| Retries | Unlimited per decision | One attempt per decision |
| Model answers | Shown after each free-text response | Shown after the stage is locked |
| Report header | Marked "Practice" | Marked "Assessed", with attempt number |

The mode is chosen per scenario on the home page. An assessed attempt cannot be switched to practice partway through. Restarting an assessed scenario increments the attempt number, which is printed on the report so the teacher can see it.

---

## 6. The scenario workflow

Each scenario follows the nine-step workflow from the handout. The stepper along the top shows all nine so students learn the shape of the process, and later stages stay locked until the current one is complete.

### Stage 0: Briefing

A ticket-style incident brief: a few user reports, a ticket number, a timestamp. Deliberately vague, as real tickets are. One question follows: **does this warrant RCA?** The student picks yes or no and selects the reasons from the handout's criteria (recurring, high impact, formal record needed, security or data involved, failed change). All main scenarios do warrant it. The cases that do not are handled in the Triage round (section 9).

### Stage 1: Define the problem

The student assembles a problem statement from five slots: **what, where, who, when, how often**. Each slot offers three or four fragments drawn from the brief. Some are precise, some vague ("the Wi-Fi is rubbish"), some are assumptions presented as fact ("the router is broken"). The assembled sentence is displayed live.

Marking: one mark per slot. Feedback explains why a vague or assumption-laden fragment is weaker.

### Stage 2: Restore service

Three or four containment options. The student picks one. They are then asked a follow-up: **"Service is restored. Is the RCA finished?"** Choosing yes triggers a short consequence panel ("Three days later, the same fault returns...") and costs the mark. This is the handout's "stops the bleeding but isn't RCA" point made by experience instead of by telling.

Some containment options destroy evidence (for example, reimaging a server before copying its logs). If chosen, a related evidence item becomes unavailable in Stage 3. The scenario remains completable, but the student has less to work with and the feedback says why.

### Stage 3: Collect evidence and build the timeline

**Evidence selection.** A grid of 8 to 10 evidence sources (Event Viewer extract, DHCP log, monitoring graph description, change log, config diff, ticket history, deployment pipeline output, a user email). The student has a limited number of "requests", typically 5 or 6, representing time pressure. Each opened card reveals its content in Courier New. Some are red herrings. Some are essential.

Marking: marks for each essential item opened, a small deduction for each irrelevant one, floor of zero. Any essential item not requested is released at the end of the stage so the scenario can continue, with a note that it was missed.

**Timeline.** The student places 6 to 8 event cards in chronological order using timestamps found in the evidence. Cards are moved with up and down buttons or click-to-select then click-to-place. No drag-and-drop dependency, and it works by keyboard.

Marking: longest correctly ordered subsequence as a fraction of the total.

### Stage 4: Contributing factors

A list of candidate factors. The student tags each as **contributing factor**, **not relevant**, or **possible root cause, needs investigation**. A short fishbone-style sort (People, Process, Technology, Environment, Policy, Supplier) is offered here as a supporting activity on scenarios that suit it. It is lightly weighted.

### Stage 5: Apply the RCA technique

Each scenario names its primary technique. The capstone uses both. Full mechanics are in section 8, because this is where most of the marks and most of the build effort sit.

### Stage 6: Confirm the root cause

Three parts:

1. **Choose** the root cause statement from four candidates. Distractors are always of recognisable types: a symptom restated, an immediate cause, a blame statement ("the technician made a mistake"), and the true root cause.
2. **Test it** against the handout's four criteria. For each one the student answers yes or no and, for two of them, picks the evidence item that supports the answer:
   - Would removing it prevent recurrence?
   - Does it explain the symptoms and "why now"?
   - Is it supported by logs, configs or measurements?
   - Does it point to an action that improves the system and not just to blame?
3. **Write** the root cause statement in their own words (free text, rubric-checked, see section 10).

If the student selected a weak candidate in part 1, the criteria test in part 2 is run against their choice and it visibly fails. That failure is the teaching moment.

### Stage 7: Corrective and preventative actions

A pool of 8 to 10 actions. The student sorts each into **Corrective**, **Preventative**, or **Not appropriate**. The "not appropriate" set includes blame-driven responses (disciplinary action against an individual) and disproportionate ones.

Then one free-text prompt: "Choose one preventative action and explain how it stops this root cause recurring."

### Stage 8: Verify and monitor

Choose two verification steps from six, and one monitoring measure with a threshold. For example: "alert when DHCP pool utilisation exceeds 80%" against "check it manually now and then".

### Stage 9: Document

No new questions. The app assembles the student's answers into the nine-section professional write-up from the handout and takes them to the report (section 11). One final free-text field: a two or three sentence lessons-learned note for a knowledge base article.

---

## 7. Scenario data model

Scenarios are plain JavaScript modules exporting one object. Adding a scenario means adding a file and listing it in `data/scenarios/index.js`. No component changes.

```js
/**
 * @typedef {Object} Scenario
 * @property {string} id                 URL-safe identifier
 * @property {string} title
 * @property {'support'|'development'} domain
 * @property {1|2|3} difficulty
 * @property {'fiveWhys'|'fta'|'both'} technique
 * @property {number} estimatedMinutes
 * @property {Briefing} briefing
 * @property {ProblemDefinition} problem
 * @property {Containment} containment
 * @property {Evidence[]} evidence
 * @property {TimelineEvent[]} timeline
 * @property {Factor[]} factors
 * @property {FiveWhys} [fiveWhys]
 * @property {FaultTree} [faultTree]
 * @property {RootCause} rootCause
 * @property {Action[]} actions
 * @property {Verification} verification
 * @property {FreeTextPrompt} lessonsLearned
 */

/**
 * @typedef {Object} Evidence
 * @property {string} id
 * @property {string} source        e.g. "DHCP server log"
 * @property {'log'|'monitoring'|'config'|'ticket'|'change'|'report'} kind
 * @property {string} content       Shown monospaced. May be multi-line.
 * @property {boolean} essential
 * @property {string} [destroyedBy] Containment option id that removes it
 * @property {string} relevanceNote Feedback explaining why it mattered or not
 */

/**
 * @typedef {Object} FreeTextPrompt
 * @property {string} id
 * @property {string} prompt
 * @property {number} minWords
 * @property {ConceptGroup[]} concepts
 * @property {string} modelAnswer
 */

/**
 * @typedef {Object} ConceptGroup
 * @property {string} label     Shown in feedback, e.g. "Names the missing control"
 * @property {string[]} terms   Any one term matching counts as a hit
 * @property {boolean} [required]
 */
```

The 5 Whys and fault tree shapes are given in section 8. Every option that can be chosen carries its own `feedback` string, so feedback is always specific to what the student picked.

---

## 8. Core technique mechanics

### 8.1 5 Whys

The chain is built one level at a time. The student never sees the whole chain in advance.

**At each level:**

1. The current statement is shown ("Authentication fails").
2. The app asks "Why?" and offers three or four candidate answers.
3. The student picks one **and** selects the evidence item that supports it from the evidence they collected in Stage 3.
4. The student types a one-sentence justification linking the evidence to the answer (rubric-checked).
5. The student decides: **keep asking, or stop here?**

**Distractor types.** Every level's options are tagged so feedback can name the error:

| Tag | Meaning | Example |
|---|---|---|
| `correct` | Supported next link | "The domain controller is not responding" |
| `restatement` | The symptom in different words | "Users cannot sign in" |
| `leap` | Plausible but skips a link or has no evidence | "The server was hacked" |
| `blame` | Stops at a person | "The admin forgot to check" |
| `unrelated` | True but not causal | "The server is five years old" |

**Evidence pairing.** A correct answer paired with the wrong evidence scores half. This is the mechanism that addresses the handout's warning that 5 Whys "can become opinion-based if you skip evidence". If the supporting evidence was missed or destroyed earlier, the student can mark the link as a **hypothesis**. That scores partial credit and prints as a hypothesis in the report, which mirrors the handout's rule that uncertain conclusions must be labelled.

**Stop or continue.** Stopping early is the most common student error, so it is tested explicitly. If the student stops at a level tagged `stopsTooEarly` (for example "Disk full"), the app applies the recurrence test: "If you only fix this, will it happen again?" and shows why it would. In Practice mode they continue. In Assessed mode they lose the mark for that decision and then continue. Chains are not forced to exactly five levels. Scenarios use between four and six, and the primer makes the point that five is a guide.

**Data shape:**

```js
/**
 * @typedef {Object} FiveWhys
 * @property {string} startStatement
 * @property {WhyLevel[]} levels
 */

/**
 * @typedef {Object} WhyLevel
 * @property {WhyOption[]} options
 * @property {string[]} supportingEvidenceIds  Any of these earns full credit
 * @property {FreeTextPrompt} justification
 * @property {boolean} stopsTooEarly           True if stopping here is premature
 * @property {string} [stopFeedback]
 */

/**
 * @typedef {Object} WhyOption
 * @property {string} id
 * @property {string} text
 * @property {'correct'|'restatement'|'leap'|'blame'|'unrelated'} tag
 * @property {string} feedback
 */
```

**Display.** The completed levels stack vertically as a chain of cards, each showing the answer, the evidence badge and the student's justification. The chain appears in the final report exactly as built.

### 8.2 Fault Tree Analysis

A guided build in three passes. The tree is rendered as SVG and grows as the student works.

**Pass 1: Build.** Starting from the top event (the incident), for each expandable node:

1. The student selects which items from a **cause pool** are direct causes of this node. The pool contains the correct children, causes that belong elsewhere in the tree, and causes that do not belong at all.
2. The student chooses the **gate**: OR (any one of these is enough) or AND (all of these must be true together).
3. The node's children appear in the tree with the gate symbol drawn between parent and children.

Marking per node: marks for each correct child, a deduction for each wrong one, and a separate mark for the gate. Gate feedback is always explained in plain terms: "Data was only lost because the file was deleted AND the backup had failed. Either alone would not have caused loss, so this is an AND gate."

After each node is marked, the tree is corrected to the reference structure so later nodes are not built on a wrong foundation. The student's original selection is retained for the report.

**Pass 2: Eliminate.** Every leaf node now needs a verdict: **Confirmed**, **Ruled out**, or **Cannot tell from the evidence**. For Confirmed and Ruled out the student must attach an evidence item. Ruled-out branches grey out. Confirmed ones highlight. This is the "systematic and testable" strength of FTA in practice, and it rewards students who gathered good evidence in Stage 3.

**Pass 3: Trace.** The student clicks the path from a confirmed leaf up to the top event, respecting gates. For an AND gate every child must be confirmed before the path through it is valid. Then one free-text prompt: "Explain in two sentences how the confirmed causes combine to produce the incident."

**Data shape:**

```js
/**
 * @typedef {Object} FaultTree
 * @property {string} rootId
 * @property {Object<string, TreeNode>} nodes   Keyed by node id
 * @property {PoolItem[]} pool                  Distractors not in the tree
 * @property {FreeTextPrompt} explanation
 */

/**
 * @typedef {Object} TreeNode
 * @property {string} id
 * @property {string} label
 * @property {'AND'|'OR'|null} gate            null for leaf nodes
 * @property {string[]} children
 * @property {string} [gateFeedback]
 * @property {'confirmed'|'ruledOut'|'unknown'} [verdict]   Leaves only
 * @property {string[]} [verdictEvidenceIds]
 * @property {string} [verdictFeedback]
 */
```

**Layout.** `lib/treeLayout.js` computes positions with a simple recursive tidy-tree pass: leaves are spaced evenly, each parent is centred over its children, depth sets the y coordinate. Trees are capped at four levels and roughly 14 nodes so they fit a classroom laptop screen without scrolling. Gates are drawn as the standard AND (flat-bottomed dome) and OR (curved shield) symbols with a text label as well, so meaning never depends on recognising the shape.

**Accessibility.** The SVG tree is the visual. Beside it, the same structure is exposed as a nested list which screen readers and keyboard users operate. Both views are driven from the same state.

### 8.3 Supporting techniques

Light-touch, low weighting, used where a scenario suits them:

- **Timeline and Change Analysis**: built into Stage 3 for every scenario. After ordering the timeline the student marks which change event sits closest before the first symptom.
- **Fishbone**: optional category sort in Stage 4.
- **Pareto**: used once, in the Triage round, where students rank ticket categories by count to decide where RCA effort should go.

---

## 9. Supporting screens

### 9.1 Technique primer (`/learn`)

Two short interactive refreshers, about five minutes each, taken from the handout's worked examples:

- **5 Whys**: the "users can't log in" chain, revealed one why at a time, with the student predicting each next step before it is shown.
- **FTA**: the "website down" tree, with the student choosing the gate for two nodes.

A summary table of all five techniques with strengths and risks sits below. The primer is unscored.

### 9.2 Triage round (`/triage`)

Eight short cases, one or two sentences each. For each: **RCA, or no RCA?** and why. Half do not warrant it (a one-off mistyped password, a known issue with a documented fix, an incident with no evidence at all). This covers the "when not to" part of the handout, which the main scenarios cannot test because they all need RCA. It ends with the Pareto ranking task.

---

## 10. Marking

### 10.1 Auto-marked items

Choices, sorts, orderings, tree construction and verdicts are marked deterministically by `lib/scoring.js`. Each stage returns `{ earned, possible, details[] }`.

### 10.2 Free-text rubric

`lib/rubric.js` handles written answers:

1. Normalise the text: lower case, strip punctuation, collapse whitespace.
2. Enforce `minWords`. Short answers are rejected with a prompt to expand, and no mark is recorded until the minimum is met.
3. For each `ConceptGroup`, check whether any of its `terms` appears. Terms may be multi-word phrases. Matching is on word boundaries with light stemming (strip trailing `s`, `ed`, `ing`).
4. Score is hits divided by groups. If any group marked `required` is missed, the score is capped at half.
5. Feedback lists each concept as found or not found, using the group `label`, never the raw keywords.

The result is always labelled **"indicative mark"** in the interface. After it is shown, the model answer is revealed alongside the student's text, and the student selects a self-rating (Matches, Partly matches, Missed the point). The self-rating is recorded and printed in the report but does not change the score. The teacher sees the student's actual words in the report and has the final say.

A keyword matcher can be fooled by a list of buzzwords, and it can miss a good answer phrased unusually. The design accepts that. Its job is to give instant formative feedback and make students write. The report gives the teacher the evidence to overrule it.

### 10.3 Weighting

| Stage | Weight |
|---|---|
| 0 Briefing and triage decision | 5% |
| 1 Define the problem | 8% |
| 2 Restore service | 5% |
| 3 Evidence and timeline | 15% |
| 4 Contributing factors | 5% |
| **5 RCA technique (5 Whys or FTA)** | **35%** |
| 6 Confirm the root cause | 12% |
| 7 Corrective and preventative actions | 8% |
| 8 Verify and monitor | 5% |
| 9 Lessons learned | 2% |

Weights live in `config.js`. Results are reported as a percentage and a band (Developing, Secure, Strong) with thresholds also in config. Bands are descriptive. They are not mapped to T-Level grades.

---

## 11. The RCA report

`/scenario/:id/report` renders a document laid out to the handout's nine-section professional format, populated from the student's own answers:

1. Incident summary (their problem statement)
2. Impact assessment
3. Timeline (their ordering, with any misplaced events flagged)
4. Detection and response (their containment choice)
5. Root cause (their written statement, plus the criteria test results)
6. Contributing factors
7. Corrective actions
8. Preventative actions
9. Verification

Followed by:

- **Analysis record**: the full 5 Whys chain with evidence and justifications, or the fault tree as built with verdicts, or both. Links recorded as hypotheses are labelled as such.
- **Marking summary**: per-stage scores, indicative marks for free text with self-ratings, total and band.
- **Header**: student name, group, scenario, mode, attempt number, date and time completed.

Printing uses `window.print()` with an `@media print` block in `index.css`: navigation and buttons hidden, tree scaled to page width, sensible page breaks between sections. Students use the browser's "Save as PDF" and upload the file to the Teams assignment. No PDF library.

---

## 12. Scenario catalogue

Six scenarios for the first release, ordered by difficulty. Full content (options, evidence text, feedback strings, rubrics, model answers) is to be authored during the build and reviewed by the teacher before release.

| # | Title | Domain | Technique | Level | Root cause in outline |
|---|---|---|---|---|---|
| 1 | Wi-Fi drops in Room B12 | Support | 5 Whys | 1 | DHCP pool exhausted after a guest event. Lease time far too long, and no alert on pool utilisation |
| 2 | Nobody can log in | Support | 5 Whys | 1 | Domain controller disk full. No log rotation, and the monitoring threshold was set too high to fire (the handout example, extended) |
| 3 | Website down after Friday's release | Development | FTA | 2 | App crashes on start because a required environment variable is missing in production. The deployment checklist had no config validation step and staging did not match production |
| 4 | The coursework that could not be restored | Support | FTA (AND gates) | 2 | Loss needed three things together: accidental deletion AND backup job failing for weeks AND failure alerts going to a former employee's mailbox |
| 5 | Checkout totals are wrong | Development | 5 Whys | 2 | Rounding regression in a VAT calculation. No unit test covered it, and code review was skipped to meet a sprint deadline, which the team's process allowed |
| 6 | The 9am slowdown | Development | FTA then 5 Whys | 3 | FTA isolates slow database queries. 5 Whys then finds an index dropped by a migration, untested because the test database held a fraction of production data |

Notes for authoring:

- Scenario 2 deliberately starts from the handout's worked example so the first steps feel familiar, then diverges in the evidence and the stop-or-continue decisions.
- Scenario 4 exists to teach AND gates properly. Most classroom FTA examples are all OR.
- Scenarios 4 and 5 both involve a person making a mistake. In each, the "blame" option must be tempting and the feedback must redirect to what allowed the error, as the handout's "avoid weak root causes" section requires.
- Scenario 6 is the capstone and shows the two techniques working together: FTA to narrow, 5 Whys to go deep.
- All organisations, people and systems are fictional. No real college systems or names.
- Each scenario should take 20 to 30 minutes, so one fits a lesson with time for discussion.

---

## 13. Interface and accessibility

- Layout: header with scenario title and mode badge, stage stepper beneath, main work area, and a collapsible **Evidence drawer** available from Stage 3 onwards so students can refer back to what they collected at any point.
- Responsive down to a 1280 x 720 classroom laptop. Tablet usable. Phones are not a target.
- Every interaction works by keyboard. No drag-and-drop.
- Correct and incorrect states use an icon and a word as well as colour.
- Visible focus styles, WCAG AA contrast, `prefers-reduced-motion` respected.
- Feedback language is plain and direct, written for 16 to 19 year olds, and never sarcastic about wrong answers.
- No timers. Evidence request limits create the pressure without penalising slower readers.

---

## 14. Build order

| Phase | Deliverable |
|---|---|
| 1 | Scaffold, react-doctor, routing, `index.css` base, `ProgressContext`, storage wrapper, `.htaccess` |
| 2 | Shared components (`ChoiceList`, `EvidenceCard`, `FreeTextRubric`, `ModelAnswerReveal`, `FeedbackBanner`) and `rubric.js` |
| 3 | Stages 0 to 4 and 6 to 9, built against Scenario 1 |
| 4 | 5 Whys engine, completing Scenario 1 end to end |
| 5 | Report view and print stylesheet |
| 6 | FTA engine and `treeLayout.js`, built against Scenario 3 |
| 7 | Remaining scenarios, Triage round, Primer |
| 8 | Practice and Assessed mode differences, polish, README, LICENSE |

Phase 4 gives a complete, usable vertical slice. It is worth trialling with a class at that point before the FTA engine is built.

---

## 15. Testing

Smoke tests only, run by the developer or agent at the end of each phase:

- App builds and loads with no console errors.
- Scenario 1 can be completed start to finish in both modes.
- Refreshing mid-scenario restores progress.
- A hard refresh on `/scenario/wifi-b12` loads correctly behind the `.htaccess`.
- The report prints to a sensible PDF.
- Scenario 3's tree renders and can be operated by keyboard alone.

All further testing, including classroom trials and checks of scenario accuracy, is carried out by the teacher. Unit tests for `rubric.js` and `scoring.js` would be cheap and worthwhile as they are pure functions, and can be added on request. No end-to-end test suite is planned.

---

## 16. Licence

Released under **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)**.

In short, anyone may copy, share and adapt this work provided that they:

- **Attribution**: give appropriate credit, link to the licence and say if changes were made.
- **NonCommercial**: do not use it for commercial purposes.
- **ShareAlike**: release anything built from it under the same licence.

Full terms: <https://creativecommons.org/licenses/by-nc-sa/4.0/>

`LICENSE.md` and the README should carry this summary and link.
