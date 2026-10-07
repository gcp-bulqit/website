Work on Linear issue PAV-11: Merge the security findings into one line

<issue identifier="PAV-11" url="https://linear.app/pavlovsdogma/issue/PAV-11/merge-the-security-findings-into-one-line">
<title>Merge the security findings into one line</title>
<status>Done</status>
<team>Pavlovsdogma</team>
<labels>website</labels>
<assignee>Gleb Pavlov</assignee>
<parent-issue>
<issue identifier="PAV-6" url="https://linear.app/pavlovsdogma/issue/PAV-6/reorder-and-trim-bulqit-bullets-lead-with-what-a-ceo-cares-about">Reorder and trim Bulqit bullets: lead with what a CEO cares about</issue>
</parent-issue>
<blocks>
<issue identifier="PAV-12" url="https://linear.app/pavlovsdogma/issue/PAV-12/apply-the-new-bulqit-bullets-to-the-site-and-resume">Apply the new Bulqit bullets to the site and résumé</issue>
</blocks>
<blocked-by>
<issue identifier="PAV-9" url="https://linear.app/pavlovsdogma/issue/PAV-9/reorder-bulqit-bullets-product-payments-security-and-ai-first">Reorder Bulqit bullets: product, payments, security and AI first</issue>
</blocked-by>
<description>
Tell the security story once, in one tight line. The detail ("five account-takeover paths, an unauthenticated credit-minting endpoint, a production OTP backdoor") reads alarming when spread out. Lead with the outcome, then the fixes.

**Current content to compress:**

* Closed five critical account-takeover paths, an unauthenticated credit-minting endpoint and a production OTP backdoor
* Admin role-based access control with audit logging and lockout protection
* Moved rate limiting to PostgreSQL after finding the in-memory limiter never enforced on serverless

**Example shape:** "Closed critical auth and account-takeover vulnerabilities, then added admin RBAC with audit logging and database-backed rate limiting."

**Done when**

- [x] One security bullet, outcome first, no list of individual findings
</description>
<comments>
<comment author="Gleb Pavlov" created-at="2026-10-07T20:46:34Z">
Merged on the site's Work page (local, uncommitted, not yet live). Security is now one line, at #4 in the visible top five:

> Closed critical account-takeover and authentication vulnerabilities, then added admin role-based access control with audit logging and database-backed rate limiting.

Outcome first, no list of individual findings. The original bullet (five account-takeover paths, the credit-minting endpoint, the OTP backdoor, the in-memory rate limiter) is kept in full in a "Details" accordion underneath, so the specifics are one click away for anyone who wants them.

Wording drafted for review; the résumé still has the original bullet (PAV-12).
</comment>
</comments>
</issue>
