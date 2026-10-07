Work on Linear issue PAV-10: Condense release engineering and monitoring into two bullets

<issue identifier="PAV-10" url="https://linear.app/pavlovsdogma/issue/PAV-10/condense-release-engineering-and-monitoring-into-two-bullets">
<title>Condense release engineering and monitoring into two bullets</title>
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
The release and monitoring work is real, but it currently takes up most of the Bulqit section. Fold it into two bullets.

**Source bullets to fold in:**

* Blue/green deployment slots, CI-gated promotions; 89% of production deploys, including one release of 116 tickets and 7 migrations
* Restoring the integration test suite in CI (25 of 385 files running; failing files cut from 81 to 5; secret scanning, dependency and migration-order gates)
* Health checks across 14 third-party dependencies, automatic Fly.io machine replacement, release-stamped Sentry, tiered alerts, hourly synthetic probe
* The Twilio SMS outage fix (+1,067% messaging capacity for $85 a month, ~70% lower cost per connection)
* Claude Code operations skills, and the devenv/Nix development environment
* "Resolved 408 engineering issues, 26% of the team's total" (keep as a closing stat, or drop)

**Suggested split:** one bullet for shipping safely (releases plus CI gates), one for keeping it running (monitoring plus the Twilio fix). Keep the strongest number in each.

**Done when**

- [x] The release and monitoring work fits in two bullets, each with its strongest number
</description>
<comments>
<comment author="Gleb Pavlov">
Condensed on the site's Work page (local, uncommitted, not yet live). The release and monitoring work is now two bullets behind "more", each with the original bullets in full in a "Details" accordion.

**Shipping safely** (folds in releases and the CI test suite):
> Took over production from the founding agency and built the release process: blue/green deployments with CI-gated promotions (89% of production deploys, including a 116-ticket release) and a restored integration test suite that cut failing test files from 81 to 5.

**Keeping it running** (folds in monitoring, the Claude Code operations skills and the devenv/Nix environment):
> Built the operational safety net: health checks across 14 dependencies with automatic machine replacement, release-stamped Sentry and tiered alerts, approval-gated Claude Code skills for high-risk operations, and a one-command devenv/Nix environment.

**Change from the plan:** the Twilio SMS outage fix is not folded in here. It moved up into the top five instead (see PAV-9), so the second bullet covers monitoring and tooling rather than monitoring plus Twilio.

Wording drafted for review; the résumé still has the original six bullets (PAV-12).
</comment>
</comments>
</issue>
