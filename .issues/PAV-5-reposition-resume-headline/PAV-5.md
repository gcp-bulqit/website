Work on Linear issue PAV-5: Reposition résumé headline for full-stack / generalist roles

<issue identifier="PAV-5" url="https://linear.app/pavlovsdogma/issue/PAV-5/reposition-resume-headline-for-full-stack-generalist-roles">
<title>Reposition résumé headline for full-stack / generalist roles</title>
<status>Todo</status>
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

- [ ] Résumé headline and summary rewritten around business outcomes
- [ ] Director title kept, with a one-line scope note (hands-on IC, not people management)
- [ ] Site matches: home page role line and About intro use the same positioning
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
</comments>
</issue>
