---
title: Taking over production from an agency with blue/green releases
date: 2026-10-07
summary: Replacing agency-era deploys with protected slots, CI-gated promotions and migration dry-runs.
project: Blue/Green Release System
draft: true
---

## Outline

- **Where it started:** agency-era deploys and no in-house release process.
- **The design:** protected blue/green slots, CI-gated promotions, read-only production pre-flight checks, and migration dry-runs.
- **The big one:** a single release of 116 new tickets and 7 database migrations through the standby slot.
- **What changed for the team.**
