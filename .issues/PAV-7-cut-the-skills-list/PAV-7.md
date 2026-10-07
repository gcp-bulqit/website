Work on Linear issue PAV-7: Cut the skills list to what holds up in a 10-minute conversation

<issue identifier="PAV-7" url="https://linear.app/pavlovsdogma/issue/PAV-7/cut-the-skills-list-to-what-holds-up-in-a-10-minute-conversation">
<title>Cut the skills list to what holds up in a 10-minute conversation</title>
<status>Todo</status>
<team>Pavlovsdogma</team>
<labels>website</labels>
<assignee>Gleb Pavlov</assignee>
<related-to>
<issue identifier="PAV-12" url="https://linear.app/pavlovsdogma/issue/PAV-12/apply-the-new-bulqit-bullets-to-the-site-and-resume">Apply the new Bulqit bullets to the site and résumé</issue>
</related-to>
<description>
The skills list is too long. Keep what can be talked about for ten minutes with a straight face, and drop the rest.

"TypeSafe Jev" probably means nothing to anyone outside Bulqit. Either explain it in a few words or cut it (or keep it if it's a deliberate conversation starter).

**Done when**

- [x] Each skills group trimmed to items that hold up under questioning
- [x] "TypeSafe Jev" explained in a few words, or removed
- [x] Same list applied on the site's About page (src/data/site.ts)
</description>
<comments>
<comment author="Gleb Pavlov">
**Skills relevance analysis (2026 job market)**

Assumes every listed skill is legitimate; that check is handled in another ticket. Most 2026 figures come from job boards, aggregators and vendors rather than primary data, so read them as direction, not exact numbers.

**Cuts**

| Change | Market read | Net effect |
|---|---|---|
| Cut JavaScript | Still the most used language (about 66% in Stack Overflow 2025). TypeScript implies it to a person, but applicant-tracking systems match the literal word. | Small risk. "TypeScript (JavaScript)" would keep the keyword. |
| Cut GitHub Actions | Postings ask for "CI/CD" more than any one vendor. | Low loss, as long as "CI/CD" appears somewhere; it was added back. |
| Cut "billing and reconciliation" | "Billing" is a common search term in SaaS and fintech postings. | Moderate loss. Recovered by "billing (subscription and usage-based)". |
| Cut webhooks | Assumed with any Stripe or Twilio experience; rarely a filter term. | No real loss. |

**Additions**

| Change | Market read | Net effect |
|---|---|---|
| Ruby on Rails | Steady demand at SaaS startups and mid-size companies. The average at SaaS startups is about $137k on Wellfound, roughly 7% above the startup average. Stripe's main language is Ruby. UK postings are tiny, so the value is mostly US and remote roles. | High signal for SaaS and fintech. |
| Kubernetes, Terraform | High-paying platform keywords: the median for postings that require Terraform is about $204k. But Terraform appears in only about 0.9% of all postings. | Widens reach into platform and enterprise roles. Expect interviewers to probe them. |
| Maxio (Chargify) | About 2,000 B2B SaaS customers; used by growth-stage finance teams that have outgrown billing inside Stripe. Almost never a filter keyword. | Niche but distinctive. With Stripe and QuickBooks, it reads as hands-on SaaS finance experience. |

**By group**

- **Data:** PostgreSQL has been the most desired and most admired database since 2023. Strong as is.
- **AI:** The fastest-growing area.
  - Agentic AI postings are up about 260–280% year over year.
  - Employer demand has moved from prompt engineering to multi-agent pipelines.
  - That supports adding "multi-agent pipelines", MCP and evals.
  - TypeSafe Jev isn't a recognized keyword, so its parenthetical has to do the explaining.
- **Reliability & Security:** A supporting group; it backs up the security bullet.

**Overall:** The profile shifts from JavaScript full-stack generalist to a B2B SaaS and fintech product engineer: TypeScript and Rails, with payments depth and infrastructure range. It fits Rails SaaS companies, Stripe-heavy startups, billing and revenue-operations teams, and agentic AI roles.

**Sources:**
- [Stack Overflow Developer Survey 2025](https://survey.stackoverflow.co/2025/technology/)
- [Nucamp: full-stack skills 2026](https://www.nucamp.co/blog/most-in-demand-full-stack-skills-in-2026-react-node-typescript-and-beyond)
- [RubyLearning: Ruby jobs](https://rubylearning.com/guides/ruby-jobs.html)
- [Wellfound: Rails at SaaS startups](https://wellfound.com/hiring-data/i/saas/s/ruby-on-rails-1)
- [ITJobsWatch: Rails developer](https://www.itjobswatch.co.uk/jobs/uk/ruby%20on%20rails%20developer.do)
- [JobsPipe: Terraform](https://jobspipe.dev/technologies/terraform)
- [Recruiting from Scratch: Terraform salary](https://www.recruitingfromscratch.com/roles/terraform-salary)
- [TechInterview: Stripe 2026](https://www.techinterview.org/companies/stripe/)
- [Usage Pricing: Maxio](https://usagepricing.com/blueprint/stack/maxio)
- [Outlook Business: agentic AI demand +260%](https://www.outlookbusiness.com/news/demand-for-agentic-ai-talent-rises-260-as-enterprises-embrace-ai-report)
- [ZeroG Talent: AI agent engineering](https://zerogtalent.com/blog/the-ai-agent-startup-boom-is-creating-an-entirely-new-engineering-job-category-and-salaries-are-surging)
</comment>
<comment author="Gleb Pavlov">
**Progress: skills list reworked (résumé applied; About page in review)**

**Market research.** See the skills relevance analysis comment above.

**Résumé engine (done, private build only).** The Skills section is consolidated into six groups, ordered by market relevance:
- **Languages & Frameworks:** TypeScript, Python, React, Next.js, Node.js, SQL, Ruby on Rails, Go
- **Data:** PostgreSQL (Neon), schema migrations, data migration and ETL, Drizzle ORM, Redis, NoSQL
- **Payments & Integrations:** Stripe (Payments, Connect), billing (subscription and usage-based), REST APIs, Maxio (Chargify), QuickBooks, Twilio, Sanity CMS
- **Infrastructure & Delivery:** AWS (Lambda, S3), Docker, Kubernetes, Terraform, CI/CD, Vercel, Temporal, Fly.io
- **Reliability & Security:** authentication (Clerk), role-based access control, automated testing (integration and end-to-end), monitoring and alerting, Sentry, rate limiting
- **AI:** Claude Code (agents and skills), multi-agent pipelines, Model Context Protocol (MCP), LLM integration (OpenRouter), LLM evaluation (evals), TypeSafe Jev (typed LLM judgments)

Details:
- Cut: JavaScript, GitHub Actions, "billing and reconciliation", webhooks.
- Added: Ruby on Rails, Kubernetes, Terraform, Maxio.
- Also added after review: Go, Redis, NoSQL, subscription and usage-based billing, CI/CD, automated testing, multi-agent pipelines, MCP and evals.
- The full and short résumés are rebuilt; both are now three pages, where the full one used to be four.
- The public PDFs on the site are not updated yet.

**About page Toolbox (in review, not committed).**
- **Added:** Go, Redis, NoSQL, Automated testing, Multi-agent pipelines, MCP, LLM evaluation.
- **Reordered:** groups and items now follow market relevance: Languages → AI → Data → Payments → Cloud → Security → CI/CD → Observability → Integrations.
- **Adversarial trim:** 80 items down to 53.
  - Cut habits presented as skills: pre-commit hooks, Dependabot, mise, Linear.
  - Merged duplicates: Neon into PostgreSQL, Claude Code skills into Claude Code, and the monitoring items into one.
  - Replaced made-up terms: account-takeover/SSRF and PII-safe logging became "Application security (OWASP)"; error-coverage auditing and merge trains were cut.
  - Cut off-target items: Excel (VBA), Tableau, Ollama, First Data, the named CRMs (now "CRM integrations"), ERP, Flask.
  - Cut soft skills listed as tools: incident management, root cause analysis, release management.
  - Kept GAAP and month-end close as a differentiator, as "Accounting (GAAP, month-end close)".

**Open**
- Whether to cut JavaScript, GitHub Actions, reconciliation and webhooks from the About page as well; the résumé already drops them.
- Whether to merge CI/CD and Observability, now three items each.
- Whether each listed skill is legitimate: handled in a separate ticket.
</comment>
<comment author="Gleb Pavlov">
**Résumé engine: usage and regeneration**

The résumé is generated from `gcp/scripts/build_resume.py` (python-docx). That script lives outside the website repo and is deliberately gitignored there. All content (contact lines, skills, experience, projects) lives in the script's data constants; this ticket changed only `SKILLS`.

**Options**
- `--detail full|short`: `full` prints each merged bullet's original bullets beneath it; `short` prints only the summaries.
- `--public`: omits the phone number, for copies posted publicly.
- `--out <path.docx>`: output path (default `Output/Gleb_Pavlov_Resume.docx`).

**Regeneration for this ticket**
1. Updated `SKILLS` to the six-group list from the progress comment.
2. Rebuilt the private copies, which include the phone number, into `gcp/Output/`:
   - `python3 scripts/build_resume.py --detail full --out Output/Gleb_Pavlov_Resume_Full.docx`
   - `python3 scripts/build_resume.py --detail short --out Output/Gleb_Pavlov_Resume_Short.docx`
3. Rebuilt the public copies (`--public`, no phone):
   - `--detail short --public` → `Gleb_Pavlov_Resume.docx`
   - `--detail full --public` → `Gleb_Pavlov_Resume_Full.docx`
4. Converted each `.docx` to PDF with LibreOffice: `soffice --headless --convert-to pdf --outdir <dir> <file>.docx`.
5. Copied the public PDFs into the website's `public/` as `Gleb_Pavlov_Resume.pdf` (short) and `Gleb_Pavlov_Resume_Full.pdf` (full).

**Verified**
- Both public PDFs have no phone number and show the new Skills section.
- Short: 3 pages. Full: 3 pages, down from 4 because the skills section is shorter.
- Both public PDFs are already served with `noindex, nofollow` (the `vercel.json` header covers `/Gleb_Pavlov_Resume(.*).pdf`).

**Status:** The PDFs and the About-page Toolbox are uncommitted on `pav-7-update-skills`, awaiting review.
</comment>
</comments>
</issue>
