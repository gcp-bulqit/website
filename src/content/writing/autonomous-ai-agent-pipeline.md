---
title: Building an autonomous AI agent pipeline on Claude Code
date: 2026-10-07
summary: A supervisor and five specialist agents that take Linear tickets to reviewed pull requests. The hard parts were surviving interruption and knowing when to stop.
project: Autonomous AI Agent Pipeline
draft: true
---

For about a month, a set of Claude Code agents took tickets off a Linear board, worked them through discovery, planning, implementation and review, and opened draft pull requests against a production Next.js/TypeScript monorepo. Over 35 days it opened 131 pull requests, and a human merged 128 of them.

This post is about how it works, and mostly about the two problems that turned out to matter more than how good the model is: surviving interruption, and knowing when a piece of work is done. The full system, its 14 design decisions and the run data are in the [linear-pipeline repository](https://github.com/gcp-bulqit/linear-pipeline).

## The first night

The first live ticket ran on the evening of August 28. The discovery agent read the ticket and the code, found a product question the ticket didn't answer, and posted a short decision brief to the ticket instead of guessing. A teammate answered eight minutes later. About an hour after pickup there was a draft pull request.

The first completed run produced the failure I've cited most since. It opened its pull request and reported success, and the ticket stayed silent. The comment with the PR link was never posted, and the worktree was never cleaned up. Once the pull request existed, everything after it felt like bookkeeping, and bookkeeping is what gets skipped. The fix was to make each of those steps its own state with its own write, and to have the run check every finished ticket against the outside world before it reports anything. The skill now says it plainly: "`completed` is a claim about the outside world, not a note to yourself."

## The wrong premise

The idea started as a supervisor agent that would be "solely responsible for controlling the context usage of the other agents," so that hitting the team's usage limit wouldn't interrupt work.

That turned out not to be buildable. When I went looking, there was no programmatic readout of how much of the team quota was left, and a parent agent can't see how many tokens a subagent is using. A supervisor that "managed usage" would be guessing and presenting the guess as control. The first ADR records it: "Any future claim that the supervisor 'manages', 'monitors' or 'throttles' usage is false and should be removed."

What I actually wanted was narrower: when the limit hits, nothing that was finished should be lost. That's a durability problem, not a budgeting one. So the design stopped trying to avoid the kill and assumed it instead.

## The shape

<div class="split">
<div>

There is one supervisor and five leaf agents:

- **Discovery** reads the ticket and the codebase and writes down what is, not what should be.
- **The planner** turns that into an ordered plan with acceptance criteria. The plan is the hand-off: a worker must be able to execute it having read nothing else.
- **The worker** executes the plan in its own git worktree, one commit per step.
- **The reviewer** reviews the change adversarially, against the plan and the surrounding code.
- **The documentation agent** writes the pull request body and, when something was learned, a note in the repository's docs.

</div>
<figure class="diagram" style="--ar: 0.672">
<svg class="flow" viewBox="0 0 450 670" role="img" aria-labelledby="flow-title flow-desc" xmlns="http://www.w3.org/2000/svg"><title id="flow-title">How one ticket moves through the pipeline</title><desc id="flow-desc">A Linear ticket goes to discovery, then the planner, the worker and the test gate. A failed gate sends the work back to the worker. A passed gate goes to adversarial review: a blocking finding goes back to the planner, a wrong understanding goes back to discovery, and a clean review goes to documentation and then a draft pull request. When discovery hits a real ambiguity it posts a decision brief to the ticket, and a human reply sends it back to discovery.</desc><defs><marker id="flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z"/></marker></defs><g class="edges"><path d="M150 46V88"/><path d="M150 126V168"/><path d="M150 206V248"/><path d="M150 286V314"/><path d="M150 384V418"/><path d="M150 500V538"/><path d="M150 576V618"/><path d="M90 350H50V268H73"/><path d="M70 460H22V188H73"/><path d="M230 460H430V66H200V88"/><path class="dotted" d="M225 98H258"/><path class="dotted" d="M260 120H227"/></g><g class="nodes"><rect x="75" y="10" width="150" height="36" rx="4"/><rect x="75" y="90" width="150" height="36" rx="4"/><rect x="75" y="170" width="150" height="36" rx="4"/><rect x="75" y="250" width="150" height="36" rx="4"/><polygon points="150,316 210,350 150,384 90,350"/><polygon points="150,420 230,460 150,500 70,460"/><rect x="75" y="540" width="150" height="36" rx="4"/><rect class="out" x="75" y="620" width="150" height="36" rx="4"/><rect class="side" x="260" y="84" width="140" height="48" rx="4"/></g><g class="labels"><text x="150" y="32">Linear ticket</text><text x="150" y="112">Discovery</text><text x="150" y="192">Planner</text><text x="150" y="272">Worker</text><text x="150" y="354">Test gate</text><text x="150" y="456">Adversarial</text><text x="150" y="472">review</text><text x="150" y="562">Documentation</text><text x="150" y="642">Draft PR</text><text x="330" y="104">Decision brief</text><text x="330" y="121">a human replies</text></g><g class="edge-labels"><text x="56" y="318" text-anchor="start">fail</text><text x="162" y="402" text-anchor="start">pass</text><text x="162" y="520" text-anchor="start">clean</text><text transform="rotate(-90 14 330)" x="14" y="330">blocking finding</text><text transform="rotate(-90 442 270)" x="442" y="270">wrong understanding</text></g></svg>
</figure>
</div>

The supervisor owns the queue and the stage machine, and it is the only agent that touches git, GitHub or Linear. It works under two rules.

The first is to **pass everything by reference.** It hands agents file paths and reads back one line, such as `STATUS=COMPLETE PATH=.issues/ENG-123/review.md BLOCKING=0`. It never opens a plan or a review to check it, because, as the skill puts it, "an artifact you open is an artifact you are still carrying ten stages later." That's what keeps its context flat whether it's on the first ticket or the fiftieth.

The second is to **assume you will be killed.**

## Designing for the kill

<div class="split">
<div>

Everything the supervisor knows lives in a state file on disk, and it works in ticks: read the state, make exactly one transition for one ticket, write the state back atomically (to a temporary file, then a rename). Nothing carries between ticks except the file.

Each stage is written as a pair. `REVIEW_STARTED` goes to disk before the reviewer is dispatched, and `REVIEW_COMPLETE` after its status line comes back. If a run dies in between, the next run finds `STARTED` with no agent alive, knows the artifact is half-written, discards it and runs the stage again. Skipping that first write would destroy the difference between "this stage finished" and, in the skill's words, "this stage died holding a pen."

The worker's checkpoints are its commits, and they go through the repository's real commit hooks. Work a hook rejects is stashed under a message naming the ticket and step, and the next attempt looks at the stash before starting over. Steps that touch the outside world (pushing, opening the PR, commenting on the ticket, moving it to review) each check whether they already happened before doing them again, so a kill between two of them can't produce a second pull request or a duplicate comment.

A run that is killed never gets to clean up, so it always leaves its lock behind. The stale-lock path is therefore the normal path after a kill, not an error, and it's measured from a heartbeat that every tick refreshes rather than from when the run started.

</div>
<figure class="diagram" style="--ar: 0.630">
<svg class="flow kill" viewBox="0 0 460 730" role="img" aria-labelledby="kill-title kill-desc" xmlns="http://www.w3.org/2000/svg"><title id="kill-title">Recovering after a run is killed</title><desc id="kill-desc">A run is killed mid-run and nothing cleans up, so its state and lock stay on disk. The next run, or the fallback clock, starts and checks whether the lock's heartbeat is stale. If not, another run owns the repository and this one exits. If it is stale, it takes the lock and reads each ticket's recorded stage. A stage that started with no agent alive is discarded and re-run. A running worker resumes from its last commit and stash. A completed stage is trusted and advanced. If a pull request or comment already exists, it checks before repeating any outside write.</desc><defs><marker id="kill-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z"/></marker></defs><g class="edges"><path d="M190 50V78"/><path d="M190 132V160"/><path d="M190 202V224"/><path d="M300 268H318"/><path d="M190 312V346"/><path class="spine" d="M40 376H18V692"/><path d="M18 476H58"/><path d="M18 548H58"/><path d="M18 620H58"/><path d="M18 692H58"/></g><g class="nodes"><rect class="out" x="90" y="10" width="200" height="40" rx="4"/><rect x="40" y="80" width="300" height="52" rx="4"/><rect x="40" y="162" width="300" height="40" rx="4"/><polygon points="190,226 300,268 190,310 80,268"/><rect class="side" x="320" y="242" width="135" height="52" rx="4"/><rect x="40" y="348" width="300" height="56" rx="4"/><rect x="60" y="450" width="390" height="52" rx="4"/><rect x="60" y="522" width="390" height="52" rx="4"/><rect x="60" y="594" width="390" height="52" rx="4"/><rect x="60" y="666" width="390" height="52" rx="4"/></g><g class="labels"><text x="190" y="30">Killed mid-run</text><text x="190" y="97">Nothing cleans up:</text><text x="190" y="116">state and lock stay on disk</text><text x="190" y="182">Next run, or the clock, starts</text><text x="190" y="259">Lock heartbeat</text><text x="190" y="278">stale?</text><text x="387" y="259">Another run</text><text x="387" y="278">owns it: exit</text><text x="190" y="367">Take the lock, read</text><text x="190" y="386">each ticket's stage</text><text x="255" y="467">Started, no agent alive:</text><text x="255" y="486">discard it, re-run the stage</text><text x="255" y="539">Worker was running: resume</text><text x="255" y="558">from last commit and stash</text><text x="255" y="611">Stage complete:</text><text x="255" y="630">trust it and advance</text><text x="255" y="683">PR or comment already there:</text><text x="255" y="702">check before writing again</text></g><g class="edge-labels"><text x="309" y="256">no</text><text x="200" y="330" text-anchor="start">yes</text></g></svg>
</figure>
</div>

## Knowing when it's done

"An adversarial reviewer can always find *something*." If the reviewer has to be satisfied before a ticket is done, the loop never ends.

So the reviewer can block only on three things: a correctness bug, a security hole, or a requirement in the plan that wasn't met. And a blocking finding has to come with a repro, concrete inputs and the wrong result they produce. Everything else is advisory. Advisory findings go into the pull request description for a human to skim; they never trigger another lap. The reviewer's instructions put it directly: "A review of only advisory findings is a review that did its job."

The other half of "done" can't be argued with. The planner writes failing integration tests that define the goal, and the worker's job is to make them pass. Then the supervisor, not the worker, runs the repository's real verify commands (lint, typecheck, tests) in order, cheapest first. The agent being graded is not the agent doing the grading.

A failed gate or a blocking review starts a new attempt, counted on a single counter, up to a cap. Across all 131 pull requests, 63% passed on the first attempt, 92% within two and 99% within three. None hit the cap.

## Humans in the loop, on purpose

The pipeline talks to people only through the ticket, and only about decisions and outcomes. When an agent reaches a genuine fork (two defensible readings, a missing acceptance criterion, a product call), it stops and writes a decision brief: the situation, the options, a recommendation, the question, and where to resume. The supervisor posts it to the ticket word for word and moves on to other work. Replying on the ticket is enough to unpark it. Over the month, 80 tickets got a brief, and 39 of those shipped after someone answered.

Discovery's instructions explain why stopping is cheaper than guessing: "A parked issue costs a human two minutes. A wrong guess costs up to three full cycles and produces a confidently wrong PR."

The pipeline posts as its own Linear user, which matters more than it sounds. Unparking works by checking whether the newest comment came from someone other than the bot. At one point, after the Linear connection was re-authenticated, the bot started writing as me, and a parked ticket could then have unparked itself using its own question as the answer. The supervisor now checks its identity at startup.

## The clock

Agent completions are what wake the supervisor: it dispatches, its turn ends, and the notification brings it back. That's fast, but it's also the only thing that wakes it. Interrupt one agent and no notification ever comes. In one measured stretch of 199 supervisor turns, the chain broke six times, and each time it needed me to restart it by hand.

The fix was a slow fallback timer. It doesn't schedule work; it notices when the scheduler has stopped. "The timer is not a scheduler. It is the thing that notices the scheduler has stopped." Making it safe took three more changes: a run ID on the lock so a wake doesn't mistake its own run for a rival, the heartbeat-based staleness check, and a guard so a wake never dispatches into a ticket whose agent is still running.

## Five at a time

<div class="split">
<div>

For its first month the pipeline worked one ticket at a time. The reason given in the original ADR was that it kept the supervisor's context flat, but passing everything by reference already did that. What one active ticket really bought was exclusive use of the machine. What it cost was me: every step only I could do, such as unlocking a signing key or checking something only I had access to, stalled the whole queue. As the concurrency ADR puts it, "The operator was not the bottleneck on work; the pipeline made them the bottleneck on everything."

Each ticket now gets a slot with its own worktree, branch and database, cloned from a template. Discovery declares a footprint, the files the ticket expects to touch and whether it needs a migration. A ticket is admitted to planning only if its footprint doesn't overlap another active ticket's and no other migration is in flight. The test gate runs one at a time. Steps that need me only hold up the ticket that needs them.

The first five-slot run shipped 34 pull requests in about 12 hours, through three session restarts (one of them a machine reboot) and a four-hour stall. While it was producing, it ran at 4.39 pull requests an hour, against 0.89 for one ticket at a time. If that pace held for a full day it would come to about 100 tickets, though that's a projection; no 24-hour run exists, and the run's actual start-to-finish rate works out to about 68 a day.

It also found the next problem straight away. The gate ran one at a time, but five workers' builds and tests did not, and at a load average of 33 on 16 cores, tests with tight timeouts started failing for no reason of their own. Gates now wait for the machine's load to drop before they start.

</div>
<figure class="diagram" style="--ar: 1.022">
<svg class="flow slots" viewBox="0 0 460 450" role="img" aria-labelledby="slots-title slots-desc" xmlns="http://www.w3.org/2000/svg"><title id="slots-title">Several tickets at once</title><desc id="slots-desc">The ticket queue feeds three slots, each with its own worktree, branch and database. Before planning, every ticket passes admission: no files shared with another active ticket, and one database migration at a time. Verified work then goes through a single test gate, one at a time, and comes out as draft pull requests.</desc><defs><marker id="slots-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z"/></marker></defs><g class="edges"><path d="M230 46V66H78V90"/><path d="M230 66V90"/><path d="M230 66H382V90"/><path class="plain" d="M78 188V212H230"/><path class="plain" d="M382 188V212H230"/><path d="M230 188V234"/><path d="M230 292V326"/><path d="M230 368V402"/></g><g class="nodes"><rect x="155" y="10" width="150" height="36" rx="4"/><rect x="10" y="92" width="136" height="96" rx="4"/><rect x="162" y="92" width="136" height="96" rx="4"/><rect x="314" y="92" width="136" height="96" rx="4"/><rect class="side" x="80" y="236" width="300" height="56" rx="4"/><rect x="100" y="328" width="260" height="40" rx="4"/><rect class="out" x="155" y="404" width="150" height="36" rx="4"/></g><g class="labels"><text x="230" y="29">Ticket queue</text><text class="head" x="78" y="114">Slot 1</text><text x="78" y="140">worktree</text><text x="78" y="158">branch</text><text x="78" y="176">database</text><text class="head" x="230" y="114">Slot 2</text><text x="230" y="140">worktree</text><text x="230" y="158">branch</text><text x="230" y="176">database</text><text class="head" x="382" y="114">Slot 3</text><text x="382" y="140">worktree</text><text x="382" y="158">branch</text><text x="382" y="176">database</text><text x="230" y="255">Admission: no shared files,</text><text x="230" y="274">one migration at a time</text><text x="230" y="349">One test gate at a time</text><text x="230" y="423">Draft PRs</text></g></svg>
</figure>
</div>

## What else broke

The [lessons doc](https://github.com/gcp-bulqit/linear-pipeline/blob/main/docs/lessons.md) has all of them. A few generalise beyond this project.

**Evidence beats rules.** The repository wanted short commit subjects. Restating the rule in the instructions didn't hold: six commits in a row broke it. Showing the agent its own actual violations did: the next five complied.

**Prohibitions backfire.** While hardening the prompts I kept finding that "don't do X" put X into context and made it more likely. The prompts now describe what to do, and keep prohibitions only as guardrails with a reason attached.

**Tool output is untrusted input.** At one point an instruction to add an AI attribution line arrived appended to test-runner output. The repository's documented policy won, and the agents now treat everything they read (tickets, comments, files, tool output) as data, not instructions.

**Caps get read as targets.** A "3000 words maximum" on a document was read as a request for 3000 words. Limits are now stated as ceilings, with a reason.

## Next: distilling the agents with SkillOpt

Every agent in the pipeline is a prompt that I tuned by hand: a failure in a run, a lesson, an edit. [SkillOpt](https://github.com/microsoft/SkillOpt), a Microsoft research project, does that same loop as training. It treats a skill document as the trainable state of a frozen model. A target model runs a batch of tasks with the skill, a separate optimizer model reads the scored runs and proposes small add, delete and replace edits, and an edit is kept only if it improves the score on a held-out validation set. The output is a short `best_skill.md` that ships with the unchanged model, at no extra cost per call.

That only works where there's a checkable answer, and the pipeline's records have one decision with a clear one: **can this ticket be resolved by a pull request alone?** Triage gets it wrong in both directions. Send a ticket that needs a product decision and the pipeline spends a discovery pass writing a brief; hold back one it could have shipped and the queue sits idle. The records already say how 175 tickets went: 129 shipped as a pull request, 21 closed without code, and 80 needed a decision brief along the way. On top of that, 54 tickets carry a clean label built from those records. Today the shortlist comes from an external classifier.

The plan is to replace it with a distilled skill:

1. **A SkillOpt benchmark for triage.** A data loader turns each ticket (title, description, a summary of comments) into a task whose answer comes from its outcome: `PR_ONLY` if it shipped without needing a brief, `NEEDS_DECISION` if it needed one, `NOT_CODE` if it closed without code. The rollout sends it to Claude with the skill as the system prompt and scores it: `hard` is 1 for the right label, and `soft` gives partial credit for the near misses that cost less (calling a shippable ticket `NEEDS_DECISION` wastes a brief; calling a `NOT_CODE` ticket `PR_ONLY` wastes a full attempt). In SkillOpt this is a data loader, a rollout helper, an adapter and a YAML config, about a hundred lines.
2. **A seed skill** from the questions the current classifier asks, so training starts from what already works.
3. **Train and gate.** Train on one split, select on a second, and report on tickets the optimizer never saw, comparing against the current classifier's 64% precision and 50% recall on that labelled set.
4. **Deploy as an ordinary prompt.** The trained `best_skill.md` becomes the supervisor's triage step, run by the same model that runs everything else.

The agents themselves are a harder target, because "good review" has no exact-match answer. For those, SkillOpt's companion, **SkillOpt-Sleep**, is the closer fit: a nightly cycle that reads past Claude Code sessions, replays recurring tasks, and stages proposed skill edits that passed a held-out check. Nothing is applied until a person adopts it, which is the same rule the pipeline follows for code.

Two constraints shape how this gets built. The training data is ticket text from a real company, and both tools send excerpts of it to the model provider, so the training runs and the trained skill stay with that company; the public repository would carry only the benchmark adapter and a synthetic sample to run it on. And none of this is done yet. When it is, the results go here.

## The numbers

All from the pipeline's own records, over 35 days:

| Measure | Result |
|---|---|
| Tickets picked up | 175 |
| Pull requests opened | 131 |
| Merged by a human | 128 (97.7%); none closed unmerged |
| Passed review on attempt 1 / within 2 / within 3 | 63% / 92% / 99% |
| Stopped to ask a human first | 80 tickets; 39 shipped after an answer |
| Steady pace, one ticket at a time vs five | 0.89 vs 4.39 pull requests an hour |
| Median pull request | +295 / −15 lines of code, 6 files |

How each number was measured, and its caveats, are in [run-statistics.md](https://github.com/gcp-bulqit/linear-pipeline/blob/main/docs/run-statistics.md).

## Try it

The [repository](https://github.com/gcp-bulqit/linear-pipeline) has the supervisor skill, the five agents, the ADRs, the helper scripts, an installer and an example configuration. It needs Claude Code, a Linear workspace with a separate user for the bot, the GitHub CLI and Python. The [architecture doc](https://github.com/gcp-bulqit/linear-pipeline/blob/main/docs/architecture.md) has the full stage machine and the rest of the diagrams.

It stops at a draft pull request. Merging is still a person's call.
