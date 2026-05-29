---
name: repo_health_agent
description: Track repo health, detect stale issues/PRs, auto-label issues, and generate weekly summary insights for OpenSearch Dashboards
arguments:
  - name: action
    description: "Action to perform: 'health' (repo stats), 'stale' (detect stale items), 'label' (auto-label issues), 'summary' (weekly insights)"
    required: true
  - name: days_stale
    description: "Number of days before an issue/PR is considered stale (default: 30)"
    required: false
  - name: limit
    description: "Max number of items to process (default: 50)"
    required: false
---

# Repo Health Agent

Analyze and maintain the health of the opensearch-project/OpenSearch-Dashboards repository.

## Usage

```bash
/repo_health_agent --action health
/repo_health_agent --action stale [--days_stale 30]
/repo_health_agent --action label [--limit 20]
/repo_health_agent --action summary
```

## Actions

### health — Repo Health Snapshot

Gather current repo health metrics:

1. **Issue stats**: Open vs closed issues (last 30 days), new issues this week
2. **PR stats**: Open PRs, merged PRs (last 30 days), avg time to merge
3. **Activity**: Most active contributors, most commented issues
4. **Staleness overview**: Count of issues/PRs with no activity in 30/60/90 days

```bash
# Get open issues count
gh api repos/opensearch-project/OpenSearch-Dashboards/issues?state=open\&per_page=1 --jq 'length'

# Get recently closed issues
gh api "repos/opensearch-project/OpenSearch-Dashboards/issues?state=closed&since=$(date -u -v-30d +%Y-%m-%dT%H:%M:%SZ)&per_page=100" --jq 'length'

# Get open PRs
gh pr list --repo opensearch-project/OpenSearch-Dashboards --state open --json number --jq 'length'

# Get merged PRs in last 30 days
gh pr list --repo opensearch-project/OpenSearch-Dashboards --state merged --json mergedAt --jq '[.[] | select(.mergedAt > "2024-01-01")] | length'
```

Output a formatted markdown report to `tmp/repo-health-report.md`.

### stale — Detect Stale Issues/PRs

Find issues and PRs with no activity for `days_stale` days (default: 30).

1. **Fetch open issues** sorted by last updated
2. **Filter** to those with `updatedAt` older than threshold
3. **Categorize** by type (bug, feature, question, unlabeled)
4. **Flag** issues that have no assignee AND are stale
5. **Output** a list with links, age, labels, and last commenter

```bash
# Get stale issues (no update in 30 days)
stale_date=$(date -u -v-30d +%Y-%m-%dT%H:%M:%SZ)
gh api "repos/opensearch-project/OpenSearch-Dashboards/issues?state=open&sort=updated&direction=asc&per_page=50&since=2020-01-01" \
  --jq "[.[] | select(.updated_at < \"$stale_date\")]"
```

For each stale item, add a comment:
```
🤖 This issue has had no activity for {N} days. If this is still relevant, please provide an update. Otherwise, it will be closed in 14 days.
```

Add the `stale` label.

### label — Auto-Label Issues

Classify unlabeled issues and apply appropriate labels.

**Rule-based classification** (always available):

| Pattern in title/body | Label |
|---|---|
| error, crash, bug, broken, fail, regression, not working | `bug` |
| feature, request, enhancement, add support, would be nice | `enhancement` |
| question, how to, how do, help, confused, documentation | `question` |
| security, CVE, vulnerability | `security` |

**Process:**
1. Fetch open issues with no labels (or only `untriaged`)
2. Analyze title + first 500 chars of body
3. Apply matching labels
4. If no pattern matches, label as `untriaged`

```bash
# Get unlabeled issues
gh api "repos/opensearch-project/OpenSearch-Dashboards/issues?state=open&labels=untriaged&per_page=50" \
  --jq '.[] | {number, title, body: .body[:500]}'
```

**Component detection** — also detect which module/component is affected:

| Pattern | Label |
|---|---|
| discover, data explorer | `Discover` |
| monaco, editor, query editor | `Query Editor` |
| visualization, vis builder, chart | `Visualization` |
| dashboard | `Dashboards` |
| plugin, extension | `Plugins` |
| security, auth, login | `Security` |
| performance, slow, memory, CPU | `Performance` |

### summary — Weekly Insights

Generate a weekly summary report with:

1. **Issue velocity**: New issues opened vs closed this week
2. **PR velocity**: PRs opened, merged, avg review time
3. **Top modules with most issues**: Group open issues by component label
4. **PR review bottlenecks**: PRs open > 7 days without review
5. **Stale item count**: Issues/PRs with no activity in 30+ days
6. **Hot issues**: Most commented issues this week
7. **Contributors**: Most active contributors this week

```bash
# Issues opened this week
week_ago=$(date -u -v-7d +%Y-%m-%dT%H:%M:%SZ)
gh api "repos/opensearch-project/OpenSearch-Dashboards/issues?state=all&since=$week_ago&per_page=100" \
  --jq '[.[] | select(.pull_request == null)] | length'

# PRs merged this week with review time
gh pr list --repo opensearch-project/OpenSearch-Dashboards --state merged \
  --json number,title,createdAt,mergedAt,reviewDecision \
  --jq "[.[] | select(.mergedAt > \"$week_ago\")]"
```

Output to `tmp/weekly-summary.md` and optionally post as a GitHub Discussion.

## Output Files

All reports are written to `tmp/` (gitignored):
- `tmp/repo-health-report.md`
- `tmp/stale-issues-report.md`
- `tmp/labeling-report.md`
- `tmp/weekly-summary.md`
