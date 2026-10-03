# Repo Health Agent

A GitHub maintenance agent for OpenSearch Dashboards that tracks repo health, detects stale issues/PRs, auto-labels issues, and generates weekly summary insights.

## Quick Start

### Claude Code
```bash
# Get repo health snapshot
/repo_health_agent --action health

# Detect stale issues/PRs (default: 30 days)
/repo_health_agent --action stale
/repo_health_agent --action stale --days_stale 60

# Auto-label unlabeled issues
/repo_health_agent --action label --limit 20

# Generate weekly summary
/repo_health_agent --action summary
```

### Kiro
```
Use #repo_health_agent to run the repo health agent
```

## Actions

### `health` — Repo Health Snapshot
Gathers current metrics: open/closed issues, PR activity, staleness overview. Outputs a markdown report.

### `stale` — Detect Stale Issues/PRs
Finds items with no activity for N days. Adds a stale comment and label. Configurable threshold via `--days_stale`.

### `label` — Auto-Label Issues
Classifies unlabeled issues using keyword matching on title/body. Applies bug/enhancement/question/security labels and component labels (Discover, Query Editor, Visualization, etc.).

### `summary` — Weekly Insights
Generates a comprehensive weekly report: issue/PR velocity, top modules with most issues, PR review bottlenecks, stale counts, hot issues, and active contributors.

## GitHub Actions Integration

The agent runs automatically via GitHub Actions:

- **Daily** (`.github/workflows/repo-health-daily.yml`): Stale detection + auto-labeling
- **Weekly** (`.github/workflows/repo-health-weekly.yml`): Weekly summary report

## Output

All reports are written to `tmp/` (gitignored). Weekly summaries can optionally be posted as GitHub Discussions.

## Future Enhancements (Phase 2+)

- Claude-powered smart labeling (requires `ANTHROPIC_API_KEY` secret)
- Duplicate issue detection
- Context-aware stale handling (not just time-based)
- PR review bottleneck detection with reviewer load balancing
- Trend analysis (hot modules, recurring bugs)
- Client/server error correlation with GitHub issues
- Frontend oncall knowledge sharing
