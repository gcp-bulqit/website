---
title: Letting an LLM pick the work, and checking it did
date: 2026-10-12
summary: A triage step that asks a model narrow, typed questions about each ticket, keeps every decision in code, and was scored against what the pipeline actually shipped.
project: AI Ticket Triage and Routing System
draft: true
---

My [agent pipeline](/writing/autonomous-ai-agent-pipeline) will happily spend an hour on a ticket that no pull request can close. Some tickets in a real backlog are already fixed. Some are a dashboard setting, a question, or a production data problem dressed up as a bug. Others need a product decision before anyone should touch the code.

So before the pipeline picks up work, something has to answer one question for each ticket: **can a pull request alone resolve this?** This post is about the triage step I built to answer it, and about the part that usually gets skipped: checking its answers against what actually happened. The code, the evaluation and the full write-up are in the [ticket-triage repository](https://github.com/gcp-bulqit/ticket-triage).

## Start with a rule

The first fix wasn't a model at all. The pipeline got a rule: only queue tickets whose resolution is a commit in this repository, and say nothing at all on the others. No comment, no status change. In the skill's words: "That silence is the point of the rule, so a run that comments on one has broken it even if it queued nothing."

That handled the obvious cases. The harder question came with a backlog of 104 open tickets: which of them could the pipeline actually finish?

## Narrow questions, decisions in code

<div class="split">
<div>

I didn't ask a model "can this be done with a PR?" and take its answer. I used [TypeSafe's Jev](https://typesafe.ai), a model that answers typed questions with probabilities rather than prose, and split the judgment into ten narrow questions asked in one request per ticket: a multiple choice for what resolving the ticket requires (a PR only, a PR plus a manual step, ops work only, a decision first, a question, or already resolved), eight yes/no questions (must the repo change? must someone do something outside it? is a product question open? does something need checking in production first?) and a size score.

The model gets the ticket, its comments, and a short description of what a pull request to this repository can and can't change. Everything that decides the outcome lives in code. A bucket function reads the stored answers and applies thresholds, and its docstring says what they are: "Thresholds are starting points, not truths."

</div>
<figure class="diagram" style="--ar: 0.821">
<svg class="flow tri1" viewBox="0 0 460 560" role="img" aria-labelledby="tri1-title tri1-desc" xmlns="http://www.w3.org/2000/svg"><title id="tri1-title">How one ticket is triaged</title><desc id="tri1-desc">A Linear ticket is cleaned up, then code computes evidence from git: files and symbols it names, and pull requests or commits that name it. Ten typed questions go to the model in one request, and the answers come back as stored probabilities. A bucket policy written in code turns them into one of six buckets: pure PR, probably PR, PR plus a manual step, needs a decision, not a PR, or already done.</desc><defs><marker id="tri1-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z"/></marker></defs><g class="edges"><path d="M230 50V78"/><path d="M230 132V160"/><path d="M230 214V242"/><path d="M230 296V324"/><path d="M230 378V406"/><path d="M230 448V476"/></g><g class="nodes"><rect class="out" x="140" y="10" width="180" height="40" rx="4"/><rect x="70" y="80" width="320" height="52" rx="4"/><rect x="70" y="162" width="320" height="52" rx="4"/><rect x="70" y="244" width="320" height="52" rx="4"/><rect x="70" y="326" width="320" height="52" rx="4"/><rect x="70" y="408" width="320" height="40" rx="4"/><rect class="side" x="15" y="478" width="430" height="64" rx="4"/></g><g class="labels"><text x="230" y="30">Linear ticket</text><text x="230" y="97">Clean it: drop sync noise,</text><text x="230" y="116">truncate, note what's cut</text><text x="230" y="179">Code evidence from git:</text><text x="230" y="198">files, symbols, PRs naming it</text><text x="230" y="261">Ten typed questions to</text><text x="230" y="280">the model, in one request</text><text x="230" y="343">Answers as probabilities,</text><text x="230" y="362">stored, never prose</text><text x="230" y="428">Bucket policy in code</text><text x="230" y="499">pure PR · probably PR · PR + manual step</text><text x="230" y="521">needs a decision · not a PR · already done</text></g></svg>
</figure>
</div>

That split paid for itself within two minutes of the first run. The first version checked the flags before it listened to the multiple-choice answer, so 28 tickets landed in "PR plus a manual step" and only 8 in "not a PR". I rewrote the policy so the path answer leads and the flags only break ties, and re-applied it to the stored answers. Fifteen tickets moved out of "PR plus a manual step", and it took no new model calls at all. Every later policy change was tested the same way, against answers already on disk.

<div class="split">
<div>

The policy itself is just an ordered list of rules, and the first one that matches wins. A ticket is "already done" if the comments say so, or if a merged PR names it. It's "pure PR" only if the path answer is clearly a pull request, every flag agrees, it's small, and the thing it asks for doesn't already exist. Then come "probably PR", worth a quick look first; "not a PR" for ops work and questions; "needs a decision"; and "PR plus a manual step".

People call this kind of thing an AI decision. It's an if-chain, and the model's job is to fill in the conditions.

</div>
<figure class="diagram" style="--ar: 0.852">
<svg class="flow tri2" viewBox="0 0 460 540" role="img" aria-labelledby="tri2-title tri2-desc" xmlns="http://www.w3.org/2000/svg"><title id="tri2-title">The bucket policy: first match wins</title><desc id="tri2-desc">The rules are checked in order and the first one that matches decides. If comments say it is done, or a merged PR names it, it is already done. If the path is clearly a pull request, the flags agree, it is small and the thing is not already built, it is pure PR. If it leans PR with nothing strongly against, it is probably PR. Ops-only work or a question is not a PR. An open product question needs a decision. A repo change plus an outside step is PR plus a manual step. Anything else is not a PR.</desc><defs><marker id="tri2-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z"/></marker></defs><g class="edges"><path d="M275 36H298"/><path d="M275 114H298"/><path d="M275 192H298"/><path d="M275 270H298"/><path d="M275 348H298"/><path d="M275 426H298"/><path d="M275 504H298"/><path d="M142 62V86"/><path d="M142 140V164"/><path d="M142 218V242"/><path d="M142 296V320"/><path d="M142 374V398"/><path d="M142 452V476"/></g><g class="nodes"><rect x="10" y="10" width="265" height="52" rx="4"/><rect x="10" y="88" width="265" height="52" rx="4"/><rect x="10" y="166" width="265" height="52" rx="4"/><rect x="10" y="244" width="265" height="52" rx="4"/><rect x="10" y="322" width="265" height="52" rx="4"/><rect x="10" y="400" width="265" height="52" rx="4"/><rect x="10" y="478" width="265" height="52" rx="4"/><rect class="side" x="300" y="16" width="150" height="40" rx="4"/><rect class="out" x="300" y="94" width="150" height="40" rx="4"/><rect class="side" x="300" y="172" width="150" height="40" rx="4"/><rect class="side" x="300" y="250" width="150" height="40" rx="4"/><rect class="side" x="300" y="328" width="150" height="40" rx="4"/><rect class="side" x="300" y="406" width="150" height="40" rx="4"/><rect class="side" x="300" y="484" width="150" height="40" rx="4"/></g><g class="labels"><text x="142" y="27">Comments say it's done,</text><text x="142" y="46">or a merged PR names it</text><text x="142" y="105">Clear PR path, flags agree,</text><text x="142" y="124">small, not already built</text><text x="142" y="183">Leans PR, nothing</text><text x="142" y="202">strongly against</text><text x="142" y="261">Ops-only work,</text><text x="142" y="280">or just a question</text><text x="142" y="339">An open product</text><text x="142" y="358">question</text><text x="142" y="417">Repo change plus</text><text x="142" y="436">an outside step</text><text x="142" y="504">Anything else</text><text x="375" y="36">already done</text><text x="375" y="114">pure PR</text><text x="375" y="192">probably PR</text><text x="375" y="270">not a PR</text><text x="375" y="348">needs a decision</text><text x="375" y="426">PR + manual step</text><text x="375" y="504">not a PR</text></g><g class="edge-labels"><text x="150" y="75" text-anchor="start">no</text><text x="150" y="153" text-anchor="start">no</text><text x="150" y="231" text-anchor="start">no</text><text x="150" y="309" text-anchor="start">no</text><text x="150" y="387" text-anchor="start">no</text><text x="150" y="465" text-anchor="start">no</text></g></svg>
</figure>
</div>

## Reviewing my own classifier

Once it worked, I asked for an adversarial review of it, the same way the pipeline reviews its own code. It found seven problems. The two that mattered most: there were no labels, so every threshold was a guess; and the model never saw the codebase, so a fix merged under a different ticket still read as open work. It also caught that the pipeline's own comments on tickets were leaking into the input, so the classifier was partly grading the pipeline's output.

The fix for "never sees the code" wasn't more prose. It was facts that code can compute. For each ticket the script now finds the file paths and identifiers the ticket mentions and checks whether they exist on the base branch, and looks for pull requests and commits that name the ticket. Three new questions read that evidence, and the policy gained gates on size and on evidence. The comment above that rule puts it well: "Code evidence outranks the ticket text: a merged PR naming the ticket is a fact, not a reading."

The best example was a ticket asking for an alert that already existed, built under another ticket. No PR named this one, so "does the evidence show it's done?" said no. The new question, "does the thing it asks for already exist?", said 0.73, and moved it out of the top bucket.

## Checking it against what happened

<div class="split">
<div>

A classifier with no evaluation is an opinion. I built labels from the pipeline's own history: 28 tickets that shipped a pull request, and 26 that closed without code. Then I scored the classifier on them.

The important part is what it was allowed to see. Each ticket was rebuilt as it was when work began: comments added after pickup were dropped, and links from the ticket to its eventual pull request were withheld. The code comment explains why: those links "would leak the label."

Counting "pure PR" and "probably PR" together as a yes, the classifier got about **64% precision and 50% recall** on those 54 tickets. Fourteen of its 22 yeses were right, and it found 14 of the 28 tickets that really shipped. With so few tickets the uncertainty is wide: the 95% interval on precision runs from roughly 43% to 80%.

</div>
<figure class="diagram" style="--ar: 1.122">
<svg class="flow tri3" viewBox="0 0 460 410" role="img" aria-labelledby="tri3-title tri3-desc" xmlns="http://www.w3.org/2000/svg"><title id="tri3-title">Checking the classifier against what happened</title><desc id="tri3-desc">The pipeline's history says what each ticket became. That gives labels: 28 tickets shipped a pull request and 26 closed without code. Each ticket is rebuilt as it was at pickup, with later comments and links to pull requests held back, then classified and compared with its label, giving about 64 percent precision and 50 percent recall. Changing the policy in code re-scores the stored answers without new model calls.</desc><defs><marker id="tri3-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z"/></marker></defs><g class="edges"><path d="M180 62V90"/><path d="M180 144V172"/><path d="M180 244V272"/><path d="M180 312V340"/><path class="dotted" d="M320 366H395V318"/><path class="dotted" d="M340 284H322"/></g><g class="nodes"><rect class="out" x="40" y="10" width="280" height="52" rx="4"/><rect x="40" y="92" width="280" height="52" rx="4"/><rect x="40" y="174" width="280" height="70" rx="4"/><rect x="40" y="274" width="280" height="38" rx="4"/><rect class="out" x="40" y="342" width="280" height="52" rx="4"/><rect class="side" x="340" y="252" width="110" height="64" rx="4"/></g><g class="labels"><text x="180" y="27">Pipeline history:</text><text x="180" y="46">what each ticket became</text><text x="180" y="109">Labels: 28 shipped a PR,</text><text x="180" y="128">26 closed without code</text><text x="180" y="190">Rebuild each ticket as it</text><text x="180" y="209">was at pickup: later notes</text><text x="180" y="228">and PR links held back</text><text x="180" y="293">Classify</text><text x="180" y="359">Compare: precision 64%,</text><text x="180" y="378">recall 50%</text><text x="395" y="266">Change</text><text x="395" y="284">the policy</text><text x="395" y="302">in code</text></g></svg>
</figure>
</div>

Two things make those numbers better than they look. Ten of its fourteen misses went to "needs a decision", and that bucket caught 7 of the 11 shipped tickets where the pipeline itself later stopped to ask a person first. When it was wrong, it mostly erred toward asking. And four of its five strict false positives were tickets that were decided or done elsewhere *after* pickup. With today's comments and evidence they come back "already done", but the as-of-pickup evaluation, correctly, can't see that.

The evidence from git barely moved the evaluation: precision went from 61% to 64%, recall stayed the same. That's expected, because the evaluation hides exactly the links the evidence depends on. Where it helps (duplicates and already-merged work) shows up in live runs, not in this test. The gain is real but anecdotal, and I'd rather say so than claim it.

My conclusion at the time was to treat it "as a shortlist to review, not a list to hand straight to the pipeline."

## Using it, and what that does and doesn't prove

The final run put 24 tickets in "pure PR" and 19 in "probably PR". I reviewed those 43 and fed them to the pipeline. Thirty-three shipped as pull requests, 4 were parked with a decision brief, and 6 were closed without a PR, three of them because the work turned out to be done already.

Of the 33 that shipped, 27 passed review on the first attempt: 82%, against 67% for every pipeline pull request before them. It's tempting to credit the classifier, and I can't. All but one of the pull requests in that run came from the shortlist, and no shortlisted ticket shipped outside it. So I can't separate the classifier from the run: five tickets at a time, a month of pipeline fixes behind it, and whatever made those tickets easy. Without the shortlist in the baseline, the rest of the pipeline's history passed first time 60% of the time, and the intervals overlap.

The honest claim is smaller: the shortlist was a decent queue, and it didn't send the pipeline into many dead ends.

## The labeler, and the labels

The same approach answered a second question: what type is this ticket (bug, feature, enhancement and so on), and how workable, ambiguous, large, risky and easy to locate is it? The labeler reads the ticket with its human label withheld ("The human label must not reach the model"), scores each dimension separately, and a rule in code routes each ticket to the next human step.

To check the type labels, I compared them against what actually shipped, judged by the same model reading each merged pull request's description, not the ticket. The ticket can't be the referee: "The ticket text is what the humans mislabelled from, so it cannot arbitrate its own label."

The result was more about the labels than the model. On 130 shipped tickets, the human type label agreed with what the pull request did only about half the time (54%), while the model reading just the ticket agreed 71% of the time. About a quarter of shipped tickets (32 of 130, or 35% of those that had a type label at all) carried a type that disagreed with the model's reading of the merged change. That's a model's judgment, not a human ruling, and a third of those calls were low-confidence.

The cause wasn't careless labelling. Two of the labels had no stated boundary between them, and one had become the place small polish work went. Folding it into its neighbour lifted agreement from 54% to 65%, more than any change to the prompt. Two of the labeler's worst early scores turned out to be measuring a loose label and a quirk of the process, not the model.

## What I'd tell someone building this

- **Ask narrow questions and decide in code.** Store the answers and you can change your mind for free.
- **Give the model facts your code can compute.** Does this file exist? Does a merged PR name this ticket? Don't ask it to guess what a lookup can answer.
- **Build labels from what actually happened, and hide the answer when you score.**
- **Check the ground truth before blaming the model.** Two of my worst numbers measured a sloppy label and a process artifact.
- **Prefer a classifier that fails toward asking.** A shortlist that sends its misses to "needs a decision" is more useful than one that's right a bit more often but fails silently.
- **Report the confound next to the good number.**

The triage step was most useful as a way to ask better questions of my own process. The [repository](https://github.com/gcp-bulqit/ticket-triage) has the code, the [evaluation](https://github.com/gcp-bulqit/ticket-triage/blob/main/docs/evaluation.md) with every number's method, and the [design history](https://github.com/gcp-bulqit/ticket-triage/blob/main/docs/design-history.md). It sends ticket text to the model provider, so check your own data policy before pointing it at a real backlog.
