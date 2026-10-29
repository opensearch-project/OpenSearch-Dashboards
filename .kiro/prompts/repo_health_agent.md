---
description: Track repo health, detect stale issues/PRs, auto-label issues, and generate weekly insights
---

# Repo Health Agent

Run the repo health agent by delegating to the Claude skill at `.claude/skills/repo_health_agent/SKILL.md`.

## Usage

Specify which action to run:
- `health` — repo health snapshot (open/closed issues, PR activity)
- `stale` — detect and flag stale issues/PRs
- `label` — auto-label unlabeled issues
- `summary` — generate weekly insights report

## Examples

- "Run repo health check"
- "Find stale issues older than 60 days"
- "Auto-label unlabeled issues"
- "Generate weekly summary"
