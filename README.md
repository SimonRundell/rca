# RCA Doctor

An interactive teaching and assessment tool for Root Cause Analysis, built for T-Level Digital students at Exeter College. See `DESIGN.md` for the full design.

## Teaching with RCA Doctor

This section is for teachers who are new to Root Cause Analysis, or who want a quick refresher before putting students in front of it. You do not need to be an expert. The app gives students feedback and model answers as they go, so your job is mostly to ask good questions and push them past the first easy answer.

### What RCA is, in plain terms

Root Cause Analysis (RCA) is a structured way of finding out why something went wrong, so that it stops happening. Restarting a crashed server fixes today's problem. RCA asks why it crashed and what would stop it crashing again.

The one idea to keep returning to: **fixing the symptom is not the same as finding the cause.** If the same incident could happen again next month, the root cause has not been found yet.

### Key terms

| Term | Plain meaning |
|---|---|
| Symptom | What people notice. "Nobody can log in." |
| Containment | A quick action that restores service but does not explain anything. Restarting a server is containment, not RCA. |
| Root cause | The underlying condition which, if removed, stops the problem coming back. Usually a missing safeguard or a process gap. |
| Contributing factor | Something that made the problem worse or more likely, but would not have caused it alone. |
| Corrective action | Fixes this specific problem. |
| Preventative action | Changes the system so this kind of problem is much less likely anywhere. |
| Evidence | Logs, configs, graphs, change records. If you cannot point to it, it is an opinion. |

### The two core techniques

**5 Whys.** Start at the symptom and keep asking "why?" until you reach something you can fix at the level of the system or process. Each answer must be backed by evidence. It suits a single, fairly straight chain of cause and effect.

Worked example (also used in the in-app primer): users cannot log in, because the domain controller is not responding, because its disk is full, because the event log grew without limit, because log rotation was never configured, because nobody was ever given responsibility for routine server maintenance. The last answer is the root cause. Notice it is a process gap, not a person.

**Fault Tree Analysis (FTA).** Start with the failure at the top and break it into possible causes underneath, joined by gates.

- **OR gate:** any one of these causes is enough on its own.
- **AND gate:** all of these must be true together. Neither is enough alone.

Students then use evidence to rule branches out. Most students find AND gates the hardest part, which is why the "coursework that could not be restored" scenario is built around one. A good check question is: "If only this one thing had happened, would the failure still have occurred?" If the answer is no, it is part of an AND.

Fishbone, Pareto and Timeline and Change Analysis also appear, but only as supporting activities.

### Where students go wrong, and what to say

These are the mistakes the app is designed to catch. The same five answer types appear as distractors in every 5 Whys chain.

| Mistake | Example | A good prompt from you |
|---|---|---|
| Restating the symptom | "Users cannot sign in" as the answer to "why can nobody log in?" | "Has that told us anything new?" |
| Leaping ahead | "The server was hacked" with no evidence | "Which log shows that? What would we expect to see if it were true?" |
| Blaming a person | "The admin forgot to check the disk" | "Why was one person forgetting able to take the whole system down?" |
| An unrelated fact | "The server is five years old" | "Is that why it failed today, or just something that is true?" |
| Stopping too early | Declaring the root cause after two or three whys | "If we fixed that, could it happen again?" |
| Treating containment as the finish | "Service is back, so we are done" | "What stops it happening next week?" |

### The four tests for a root cause

Every scenario tests the student's candidate root cause against these. They work as a handy checklist in class discussion.

1. Would removing it prevent recurrence?
2. Does it explain the symptoms and why it happened **now**?
3. Is it supported by logs, configs or measurements?
4. Does it point to an action that improves the system, rather than just blaming someone?

### Suggested lesson shape

A scenario takes around 20 to 30 minutes, so one fits in a lesson with time for discussion.

1. **Starter (10 minutes).** Students work through `/learn`, the technique primer. It is short, unscored and has a 5 Whys example, an FTA example and a strong or weak root cause sorting task.
2. **Warm-up (10 minutes).** Students do `/triage`, the "RCA or not?" round. Half the cases should not get an RCA, which surprises people and starts a good discussion about when the effort is worthwhile.
3. **Main task (30 to 40 minutes).** Students complete a scenario in **Practice** mode, where hints and unlimited retries are available.
4. **Plenary (10 minutes).** Pick one answer where the app's feedback and the student's own view differed and discuss it. Ask "what would have convinced you earlier?"
5. **Assessment (a later lesson).** Students repeat a different scenario in **Assessed** mode, then print the report to PDF and submit it in Teams.

### The scenarios

Ordered roughly by difficulty. Start at the top.

| Scenario | Technique | What it teaches |
|---|---|---|
| Wi-Fi drops in Room B12 | 5 Whys | A gentle first run. Evidence-led chain, and a missing alert as a root cause. |
| Nobody can log in | 5 Whys | Extends the primer example. Good for the "when do I stop asking why?" decision. |
| Website down after Friday's release | Fault Tree | First tree. Missing process checks rather than a single bad action. |
| The coursework that could not be restored | Fault Tree (AND gates) | Three things had to be true together. The "blame the student" option is tempting. |
| Checkout totals are wrong | 5 Whys | Blame is tempting. Shows how a process can allow a mistake through. |
| The 9am slowdown | Fault Tree then 5 Whys | Capstone. Uses a tree to narrow down, then 5 Whys to go deep. |

### Practice mode and Assessed mode

| | Practice | Assessed |
|---|---|---|
| Hints | Available | None |
| Feedback | After each decision | At the end of each stage |
| Retries | Unlimited | One attempt per decision |

Mode is chosen per scenario on the home page. An assessed attempt cannot be switched to practice partway through, and restarting it increases the attempt number printed on the report.

### Marking and what to trust

- Choices, sorting, ordering and tree-building are marked automatically and are reliable.
- Written answers get an **indicative mark** from a keyword check. It is a quick prompt for the student, not a judgement. It can be fooled by buzzwords and it can miss a good answer worded unusually.
- After a written answer, students see a model answer and rate themselves as Matches, Partly matches or Missed the point. This is recorded but does not change the score.
- **You have the final say.** The report contains the student's actual words, so read the written answers and overrule the indicative mark where needed.
- Results are shown as a percentage and a band (Developing, Secure, Strong). These bands are descriptive and are not mapped to T-Level grades.
- The technique stage carries the most marks (35 percent). Evidence selection is next (15 percent).
- Scenario data ships with the app, so a determined student could look up the answers. Treat the score as formative. The written justifications in the report are the better evidence of understanding.

### Things worth knowing before the lesson

- Some containment choices destroy evidence, such as wiping logs before copying them. The scenario can still be finished, but the student has less to work with. This is deliberate, so it is worth discussing afterwards.
- Evidence requests are limited to reflect time pressure. Some items are red herrings. Students who open everything lose marks, so encourage them to choose with a reason.
- All organisations, people and systems in the scenarios are fictional.
- Progress is saved in the student's browser on that machine only. If students share a computer, use the "Reset my progress" control on the home page between users.
- To save a report, students use the browser's Print option and choose "Save as PDF".

### Discussion questions for any scenario

- What was the first explanation you believed? What changed your mind?
- Which piece of evidence mattered most? Which looked useful but was not?
- Where did you want to blame a person? What was really going on underneath?
- How would you explain the root cause to a manager in two sentences?
- Which would you do first, the corrective action or the preventative one, and why?

## Running it

```bash
npm install
npm run dev      # local development server
npm run build    # production build into dist/
npm run preview  # preview the production build locally
```

## Deployment

Upload the contents of `dist/` to shared hosting. The app is client-side only: no backend, no database, no API calls. `public/.htaccess` is copied into `dist/` automatically and handles client-side routing fallback for a hard refresh on any `/scenario/...` URL.

If the app is deployed to a subfolder rather than the domain root, set `base` in `vite.config.js` before building.

## Data and progress

All scenario content, including correct answers, ships in the JavaScript bundle - there is no backend to hide it behind. This is a known, accepted limitation for a formative classroom tool (see `DESIGN.md` section 3.5).

Student progress is stored in the browser's `localStorage` under the key `rcaTrainer.v1`. Nothing is sent anywhere. A "Reset my progress" control on the home page clears it after confirmation.

## Licence

Released under CC BY-NC-SA 4.0 International. See `LICENSE.md`.
