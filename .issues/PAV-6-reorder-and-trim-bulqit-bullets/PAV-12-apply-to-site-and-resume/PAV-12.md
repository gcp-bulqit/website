Work on Linear issue PAV-12: Apply the new Bulqit bullets to the site and résumé

<issue identifier="PAV-12" url="https://linear.app/pavlovsdogma/issue/PAV-12/apply-the-new-bulqit-bullets-to-the-site-and-resume">
<title>Apply the new Bulqit bullets to the site and résumé</title>
<status>Done</status>
<team>Pavlovsdogma</team>
<labels>website</labels>
<assignee>Gleb Pavlov</assignee>
<parent-issue>
<issue identifier="PAV-6" url="https://linear.app/pavlovsdogma/issue/PAV-6/reorder-and-trim-bulqit-bullets-lead-with-what-a-ceo-cares-about">Reorder and trim Bulqit bullets: lead with what a CEO cares about</issue>
</parent-issue>
<blocked-by>
<issue identifier="PAV-10" url="https://linear.app/pavlovsdogma/issue/PAV-10/condense-release-engineering-and-monitoring-into-two-bullets">Condense release engineering and monitoring into two bullets</issue>
<issue identifier="PAV-11" url="https://linear.app/pavlovsdogma/issue/PAV-11/merge-the-security-findings-into-one-line">Merge the security findings into one line</issue>
</blocked-by>
<description>
Once the reordered, condensed wording is settled (PAV-9, then PAV-10 and PAV-11), apply it to both the résumé and the site so the two match.

**Résumé:** the `EXPERIENCE` bullets in `scripts/build_resume.py` in the Job/gcp repo. Rebuilding produces the .docx and, through LibreOffice, the PDF.

**Where:** `src/data/site.ts`, the `experience` entry for Bulqit (`highlights` array). The Work page shows the first five highlights (`SHOWN = 5` in `src/pages/work.astro`, raised from 4) and folds the rest behind a "more" disclosure, so the five lead bullets are exactly what's visible by default. Merged highlights keep their original bullets in a "Details" accordion (`src/components/Highlight.astro`).

**Done when**

- [x] `highlights` in the agreed order: product, AI pipeline, payments, security, SMS outage fix, then the two release and monitoring bullets
- [x] Work page checked: the five visible bullets are the right ones (SHOWN raised to 5), and the disclosure holds the rest
- [x] Résumé rebuilt from `build_resume.py` with the new bullets (.docx and PDF), in full and short versions
- [x] Public résumé PDFs regenerated without the phone number, using the same order (`--public`)
- [x] Chosen version (full or short) placed on the site as `public/Gleb_Pavlov_Resume.pdf`
</description>
<comments>
<comment author="Gleb Pavlov" created-at="2026-10-07T20:46:35Z">
Site half done locally (uncommitted, not yet live). Résumé half not started.

**Site (**`gcp-bulqit/website`**)**

* `src/data/site.ts`: Bulqit `highlights` rewritten in the PAV-9 order. A highlight can now be plain text or `{ text, details }`, a short summary with the original bullets attached (new `Highlight` type).
* `src/components/Highlight.astro` (new): renders a merged highlight as its summary plus a "Details" accordion holding the original bullets word for word. Styled with a faint left rule and muted text.
* `src/pages/work.astro`: `SHOWN` raised from 4 to 5, so all five lead bullets are visible before "more".
* Checked in Chrome on a real GPU: five leads visible, the two engineering bullets and the closing stat behind "more", 4 accordions holding the 8 original bullets, other roles unchanged, no console errors.

**Still to do**

- [x] Review the four merged summaries (payments, security, and the two engineering bullets)
- [x] Résumé: apply the same order and summaries to `EXPERIENCE` in `scripts/build_resume.py` (the PDF carries summaries only, no accordions), rebuild the .docx and PDF
- [x] Regenerate the public PDF without the phone number
- [x] Commit and push the site change
</comment>
<comment author="Gleb Pavlov" created-at="2026-10-07T20:56:38Z">
Résumé rebuilt with the new Bulqit bullets, in two versions.

**Script (**`Job/gcp/scripts/build_resume.py`**, uncommitted)**

* Bulqit bullets in the agreed order: product, AI pipeline, payments, security, SMS outage fix, then the two release and operations bullets, then the closing stat. Same data shape as the site: a merged bullet is `{"text", "details"}` with the original bullets word for word.
* `--detail full|short`: **full** prints each merged bullet's originals as smaller, indented sub-bullets (the site's accordion content, written out); **short** prints summaries only.
* `--public`: drops the phone number, so public copies no longer need a one-off edit.

**Output**

| Version | Pages | Private, with phone (`gcp/Output/`) | Public, no phone (`website/working/resume/`, git-ignored) |
| -- | -- | -- | -- |
| Full | 4 | `Gleb_Pavlov_Resume_Full` .docx/.pdf | `Gleb_Pavlov_Resume_Full` .docx/.pdf |
| Short | 3 | `Gleb_Pavlov_Resume_Short` .docx/.pdf | `Gleb_Pavlov_Resume_Short` .docx/.pdf |

Checked: the full PDF contains every original bullet, the short one none of them, both have all four summaries, and the public copies have no phone number. Fonts match the existing résumé (Carlito, LibreOffice 26.8). The existing `Gleb_Pavlov_Resume` files are untouched.

**Still open**

- [x] Choose which version the site links to (full or short), then replace `public/Gleb_Pavlov_Resume.pdf`
- [x] Commit the script change (gcp repo) and the site change (website repo)
- Headline, summary and skills are unchanged; those are PAV-5 and PAV-7.
</comment>
</comments>
</issue>
