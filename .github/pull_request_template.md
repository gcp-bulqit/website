<!--
Title: prefix with the Linear ticket, e.g. [PAV-1234] Imperative, visitor-facing summary.
A linked Linear ticket is REQUIRED. If none exists, create a detailed ticket first
(see the Tickets section) and link this PR to it before opening the PR.
Frame everything in visitor value: what someone viewing the site (a recruiter, a hiring
manager, a curious engineer) gets after this lands, not which files moved.
Target `main`. Merging to `main` deploys to production on Vercel, so CI must pass first.
No AI/IDE attribution anywhere.
Delete any section that does not apply, and delete these comments, before opening the PR.
-->

## Summary

<!--
A few sentences of prose. Lead with the problem in the visitor's terms and the concrete
symptom (a page that misleads, a slow load, a broken link, a bare link preview, a résumé
that buries the best work). Then state what this delivers and the decision behind it.
Link any review notes or references that define the intended result.
-->

## Tickets

<!--
REQUIRED. Every PR links a Linear ticket. If no ticket covers this work, create one
BEFORE opening the PR: give it a clear problem statement, impact, the intended
result, and acceptance criteria, enough that a reviewer understands the change
from the ticket alone. Then link this PR to that ticket (Linear picks up the branch
or the reference below) and record it here. Do not open the PR without a ticket.

Linear is private, so also commit each ticket as a prompt file under `.issues/` (sub-issues
in subfolders of their parent) and link it next to the Linear link, so anyone reading the
PR can see the ticket. Use full GitHub URLs (relative links don't work in PR descriptions),
pointing at this PR's branch: the files only reach `main` when the PR merges. List
sub-issues indented under their parent.
-->
- [PAV-____](https://linear.app/pavlovsdogma/issue/PAV-____) · [.issues](https://github.com/gcp-bulqit/website/blob/<branch>/.issues/PAV-____-<slug>/PAV-____.md): <title>

## Project

<!-- Optional. The Linear project this work belongs to. Delete if none. -->
- [Project name](https://linear.app/pavlovsdogma/project/____)

## What changed

<!--
The result after this lands, grouped by area with `###` subsections (e.g. pages and copy,
the slime simulation, the résumé, SEO and link previews, performance, accessibility).
Describe what the site now does and why that is right, not a file-by-file diff. Reference
modules by role where it aids review (e.g. "the content data", "the simulation shaders").
-->

### <area>

## Scope note

<!--
Optional but encouraged. What is deliberately out of scope (with its own ticket where
relevant), anything shipping before a final decision, and anything that changes what a
visitor sees publicly (copy, the résumé PDF, link previews, what search engines index).
Delete if truly nothing applies.
-->

## Test coverage

<!--
Automated checks that ran. CI runs `npm run check` (astro check) and `npm run build` on
every PR. Name anything else exercised, and what is deliberately not.
-->
- [ ] `npm run check` passes
- [ ] `npm run build` passes

## QA

<!--
Manual verification in a real browser. State the scope, then a case table with evidence
(screenshots, page text, URLs, Lighthouse scores, fps from the readout). Check the
simulation on a real GPU (local headless and SwiftShader timings are not reliable), and
on a phone-width viewport where layout changed. End with a verdict. Delete this section
only when the change carries no manual QA (e.g. docs-only).
-->

**Scope:** <!-- what you set out to confirm on the site -->

| Case | Check | Result | Evidence |
| --- | --- | --- | --- |
| 1 |  |  |  |

**Verdict:**
