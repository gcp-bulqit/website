Work on Linear issue PAV-6: Reorder and trim Bulqit bullets: lead with what a CEO cares about

<issue identifier="PAV-6" url="https://linear.app/pavlovsdogma/issue/PAV-6/reorder-and-trim-bulqit-bullets-lead-with-what-a-ceo-cares-about">
<title>Reorder and trim Bulqit bullets: lead with what a CEO cares about</title>
<status>Done</status>
<team>Pavlovsdogma</team>
<labels>website</labels>
<assignee>Gleb Pavlov</assignee>
<sub-issues>
<issue identifier="PAV-9" url="https://linear.app/pavlovsdogma/issue/PAV-9/reorder-bulqit-bullets-product-payments-security-and-ai-first">Reorder Bulqit bullets: product, payments, security and AI first</issue>
<issue identifier="PAV-10" url="https://linear.app/pavlovsdogma/issue/PAV-10/condense-release-engineering-and-monitoring-into-two-bullets">Condense release engineering and monitoring into two bullets</issue>
<issue identifier="PAV-11" url="https://linear.app/pavlovsdogma/issue/PAV-11/merge-the-security-findings-into-one-line">Merge the security findings into one line</issue>
<issue identifier="PAV-12" url="https://linear.app/pavlovsdogma/issue/PAV-12/apply-the-new-bulqit-bullets-to-the-site-and-resume">Apply the new Bulqit bullets to the site and résumé</issue>
</sub-issues>
<description>
There are twelve bullets under Bulqit, and the best proof of building and shipping a real product, the one-time services line, is number eight. Nobody gets to number eight.

Put the things a CEO cares about first:

1. Shipped product (the one-time services line)
2. The payments fixes (money not being wrong is the whole game)
3. The security cleanup
4. The AI pipeline numbers

The release and monitoring work is real and good, but squeeze it into two bullets. Fold the scary security items into a single line: it's a good story, tell it once.

**Done when**

- [x] Bulqit bullets reordered: product, AI pipeline, payments, security, then the SMS outage fix (on the site)
- [x] Release engineering and monitoring condensed to two bullets
- [x] Security findings merged into one line
- [x] Same order applied on the site's Work page (src/data/site.ts)
- [x] Same order and wording applied to the résumé (build_resume.py, .docx and PDF), in full and short versions
- [x] Site change committed and pushed
</description>
<comments>
<comment author="Gleb Pavlov">
Résumé side done: `build_resume.py` now carries the new Bulqit order and merged bullets, built in a full version (originals as sub-bullets, 4 pages) and a short version (summaries only, 3 pages), each with a private copy and a public no-phone copy. Details on PAV-12.

Remaining for this ticket: pick the full or short version for the site, then commit and push both repos.
</comment>
</comments>
</issue>
