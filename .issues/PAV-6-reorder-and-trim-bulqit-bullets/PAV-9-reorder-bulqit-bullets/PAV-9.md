Work on Linear issue PAV-9: Reorder Bulqit bullets: product, payments, security and AI first

<issue identifier="PAV-9" url="https://linear.app/pavlovsdogma/issue/PAV-9/reorder-bulqit-bullets-product-payments-security-and-ai-first">
<title>Reorder Bulqit bullets: product, payments, security and AI first</title>
<status>Done</status>
<team>Pavlovsdogma</team>
<labels>website</labels>
<assignee>Gleb Pavlov</assignee>
<parent-issue>
<issue identifier="PAV-6" url="https://linear.app/pavlovsdogma/issue/PAV-6/reorder-and-trim-bulqit-bullets-lead-with-what-a-ceo-cares-about">Reorder and trim Bulqit bullets: lead with what a CEO cares about</issue>
</parent-issue>
<blocks>
<issue identifier="PAV-10" url="https://linear.app/pavlovsdogma/issue/PAV-10/condense-release-engineering-and-monitoring-into-two-bullets">Condense release engineering and monitoring into two bullets</issue>
<issue identifier="PAV-11" url="https://linear.app/pavlovsdogma/issue/PAV-11/merge-the-security-findings-into-one-line">Merge the security findings into one line</issue>
</blocks>
<description>
Lead the Bulqit role with what a CEO cares about, in this order:

1. **Shipped product:** the one-time services product line (checkout, scheduling, charge on completion, behind a feature flag, five adversarial design reviews). Currently near the bottom.
2. **Payments:** the locked invoice line-item ledger (fixing the flat 3.0% Stripe fee model and reconciling the vendor-earnings figures), and durable Stripe idempotency with the daily money-invariant monitor and Stripe/QuickBooks reconciliation export.
3. **Security:** the single merged line from the security sub-issue.
4. **AI pipeline:** 106 pull requests in the first month; 67% / 92% / 99% passing review within one / two / three attempts.

Everything else (release engineering, monitoring, tooling) follows as the two condensed bullets from its own sub-issue.

**Done when**

- [x] Work page opens with the agreed top five: product, AI pipeline, payments, security, SMS outage fix
- [x] Résumé Bulqit section opens with the same five, in this order
</description>
<comments>
<comment author="Gleb Pavlov">
Reorder applied to the site's Work page (local, uncommitted, not yet live).

**New Bulqit order**
1. One-time services product line
2. AI agent pipeline
3. Payments, now one merged bullet (see PAV-10/PAV-11 approach): the ledger rebuild and retry-safe charging
4. Security, one line (PAV-11)
5. SMS outage fix, moved up from the bottom group: production outage resolved, +1,067% messaging capacity for $85 a month, about 70% lower cost per connection. It's the bottom-group bullet a CEO reads as business impact rather than process.
6. Releases and CI (merged, PAV-10)
7. Monitoring, ops skills and dev environment (merged, PAV-10)
8. Closing stat (408 issues, 342 PRs)

**Decisions made along the way**
- AI pipeline moved to #2, directly after the shipped product.
- The two payments bullets are merged into one headline so the SMS fix fits in the top five.
- The Work page now shows 5 bullets before "more" (was 4), so all five leads are visible by default. Other roles have 4 bullets each and are unchanged.
- Every merged bullet keeps the original bullets in full in a "Details" accordion, so no content is lost on the site.

Résumé (`build_resume.py`) not changed yet; that's PAV-12.
</comment>
<comment author="Gleb Pavlov">
The résumé now opens with the same top five as the Work page: product, AI pipeline, payments, security, SMS outage fix. Built from `build_resume.py` in full and short versions (details on PAV-12). Both halves of this ticket are now done.
</comment>
</comments>
</issue>
