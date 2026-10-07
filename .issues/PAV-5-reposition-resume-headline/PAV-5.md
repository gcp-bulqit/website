Work on Linear issue PAV-5: Reposition résumé headline for full-stack / generalist roles

<issue identifier="PAV-5" url="https://linear.app/pavlovsdogma/issue/PAV-5/reposition-resume-headline-for-full-stack-generalist-roles">
<title>Reposition résumé headline for full-stack / generalist roles</title>
<status>Done</status>
<team>Pavlovsdogma</team>
<labels>website</labels>
<assignee>Gleb Pavlov</assignee>
<related-to>
<issue identifier="PAV-12" url="https://linear.app/pavlovsdogma/issue/PAV-12/apply-the-new-bulqit-bullets-to-the-site-and-resume">Apply the new Bulqit bullets to the site and résumé</issue>
</related-to>
<description>
Right now the top of the résumé reads like a pitch to run release engineering. For full-stack or generalist roles, that's not what a CEO, owner or hiring manager is hunting for, and they'll skim past it.

Lead with what was actually done for the business: shipped product, made sure money moves correctly, locked down the security problems, and built an AI setup that does real work.

**Proposed headline:** "Full-Stack Engineer | TypeScript, Next.js, PostgreSQL | Payments, Auth & AI Agents"

Keep the Director title, but add a line on scope so nobody thinks this is an application to manage a team.

**Done when**

- [x] Résumé headline and summary rewritten around business outcomes
- [x] Director title kept, with a one-line scope note (hands-on IC, not people management)
- [x] Site matches: home page role line and About intro use the same positioning
</description>
<comments>
<comment author="Gleb Pavlov">
**Progress: résumé and site repositioned for full-stack roles**

**Résumé** (`build_resume.py`, short and full, each 3 pages; public copies have no phone)
- **Headline:** Full-Stack Engineer | TypeScript, Next.js, PostgreSQL | Payments, Security & AI Agents
- **Summary,** rewritten around outcomes, in present tense:
  > Full-stack engineer with 10+ years across finance, process engineering, and software. Owns production for a multi-city marketplace end to end: shipping product, keeping payments correct, closing security gaps, and running the infrastructure. Builds AI agent systems that do real engineering work, not demos. An accounting background means the numbers reconcile. Works comfortably between engineering, finance, and operations, and translates between them. Good at taking over messy systems, finding where they leak money or trust, and fixing them so they stay fixed.
- **Director title kept,** with a scope note in the Bulqit entry: "Hands-on individual contributor; no direct reports."
- **Contact line:** adds pavlovsdogma.com. The email, LinkedIn and site are now links, with unchanged text; the site link opens `?split=5&tune`.

**Site**
- **Role line:** "Software Developer" → "Full-Stack Engineer". This updates the home role line, the home title, the About meta description, and the link-preview alt text.
- **Link-preview card:** re-rendered with the new role as `og-card-3.jpg`. The new filename makes LinkedIn fetch it fresh.
- **About intro:** rewritten in first person to match the summary. The Director language is gone, and Bulqit is named. The pipeline paragraph describes its test-first loop, its ticket comments and codebase notes, and the human merge call; it keeps the 99% pass rate and drops the 106.

**Pipeline wording aligned everywhere.** The Bulqit pipeline bullet and the pipeline project, on the Work page and the résumé, now match the About page:
- test-first, with failing integration tests defining each goal;
- any number of tickets in parallel;
- 67% / 92% / 99% pass review within one / two / three attempts;
- the 106 is dropped.

**Done when**
- Headline and summary rewritten around business outcomes ✓
- Director title kept, with a one-line scope note ✓
- Site matches: home role line and About intro ✓

**Open**
- LinkedIn headline to match (outside the repo).
- After merge: check that LinkedIn picks up `og-card-3.jpg`, and check the `noindex` header on both résumé PDFs.
</comment>
<comment author="Gleb Pavlov">
**Follow-up: About intro tightened, pipeline detail moved to Projects**

These changes come after the progress comment above and replace the About intro described there.

**About intro (final)**
> I'm a full-stack engineer with 10+ years across finance, process engineering, and software. I started out closing the books, moved on to redesigning the processes behind them, and now write the software that runs them. I can read a P&L and a stack trace, and most of my best work happens where the two meet.
>
> At Bulqit, a proptech marketplace in Chicago, Los Angeles, and Austin, I own production end to end: building the core product, keeping finances correct, closing security gaps, and running the releases and monitoring behind it all.
>
> I also build AI agent systems that do real engineering work, like a test-first pipeline on Claude Code that takes Linear tickets to reviewed pull requests (more on the Projects page).
>
> I trained in accounting (B.S. Accounting and Finance), so I care that the numbers reconcile and that every system leaves an audit trail. It also means I'm comfortable working between engineering, finance, and operations. I like taking over messy systems, finding where they leak money or trust, and fixing them so they stay fixed.

**What changed from the earlier draft**
- **Opener:** "Shipping a product is usually the easy part…" read as too aggressive, so it's replaced with the career arc (books → processes → software) and the P&L / stack-trace line.
- **Bulqit paragraph:**
  - "That's where I spend most of my time." is removed.
  - "Building the core product" is added as the first item.
  - "Payments and billing correct on Stripe" is now "finances correct".
- **AI paragraph:** cut to one sentence that points to the Projects section. The full description moved to the "Autonomous AI Agent Pipeline" card on the Work page, which also gains "A person still makes the merge call."

**Unchanged:** the résumé (headline, summary, scope note, contact links, pipeline wording), the home role line and the link-preview card are as described in the progress comment.

**Remaining, outside this ticket**
- LinkedIn headline to match.
- After merge: check that LinkedIn picks up `og-card-3.jpg`, and check the `noindex` header on both résumé PDFs.
</comment>
<comment author="Gleb Pavlov">
**Follow-up: pipeline figures recalculated from the five-slot run**

The pipeline's figures on the Work page and the résumé now come from its five-concurrent run (`run-1ae0a1ce4ac3`, 2026-10-02 17:03Z to 2026-10-03 05:06Z). They replace the first-month numbers (106 PRs; 67% / 92% / 99%).

**Throughput: a mean of 100 tickets per 24 hours**
- **Shipped:** 34 tickets in a 12h 03m run, each with a draft PR open, a Linear comment, and the ticket moved to review. Another 4 tickets were parked for a human decision.
- **Steady-state rate:** measured from the gaps between completions while all five slots were full:

| Stretch | Gaps between completions | Hours | Rate |
|---|---|---|---|
| 17:41 → 21:33 | 17 | 3.87 | 4.40/hr |
| 01:41 → 05:06 | 15 | 3.42 | 4.39/hr |
| Combined | 32 | 7.29 | 4.39/hr |

- **Daily figure:** 4.39 × 24 ≈ 105, quoted as a **mean of 100 per 24 hours**. This assumes full operator engagement and no downtime.
  - The measured run lost time to a machine reboot, two session restarts, and a 4-hour stall waiting on the operator.
  - Restart losses and slots pre-filled during the stall roughly cancel out.
  - A realistic band is 100–115.
- **Caveat:** this is a projection from a 12-hour run, not a counted 24 hours. It assumes a hand-picked ticket mix similar to this run's, and the same machine (16 cores, where 5 slots is the practical ceiling before load-driven test flakes).

**Review pass rate, weighted by attempt (34 shipped PRs)**

| Attempts | PRs | Weight | Passed by this attempt |
|---|---|---|---|
| 1 | 27 | 79% | 79% |
| 2 | 4 | 12% | 91% |
| 3 | 3 | 9% | 100% |

Weighted mean: (27×1 + 4×2 + 3×3) ÷ 34 = **1.29 ≈ 1.3 attempts**. The 4 parked tickets are excluded, because they stopped for a decision rather than failing review. Counting them as not passing gives 71% / 82% / 89%.

**Wording now in use**
- **Work page** (Bulqit bullet and the pipeline project card): "Running five tickets at a time, it processes a mean of 100 tickets per 24 hours, and its pull requests pass review in a weighted mean of 1.3 attempts: 79% on the first, 12% on the second, and 9% on the third."
- **Résumé bullet:** "Five tickets at a time, it handles a mean of 100 per 24 hours; PRs pass review in a weighted mean of 1.3 attempts (79% first, 12% second, 9% third)." The bullet was tightened to keep the full résumé at 3 pages, and the duplicate "99%" was dropped from the résumé project entry.
- **Unchanged on purpose:** the AI Ticket Triage project keeps "82% … versus 67% overall". That 67% is the first-month baseline the triage system is compared against.

All four résumé builds are 3 pages. The public PDFs on the site are replaced, and the changes are pushed to PR #4.
</comment>
</comments>
</issue>
