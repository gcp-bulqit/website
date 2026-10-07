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
</comments>
</issue>
