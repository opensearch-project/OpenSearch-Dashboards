#!/usr/bin/env bash
# Repo Health Weekly Summary — generates insights report
set -euo pipefail

REPO="opensearch-project/OpenSearch-Dashboards"

mkdir -p tmp

echo "=== Weekly Summary for $REPO ==="

if [[ "$(uname)" == "Darwin" ]]; then
  week_ago=$(date -u -v-7d +%Y-%m-%dT%H:%M:%SZ)
  month_ago=$(date -u -v-30d +%Y-%m-%dT%H:%M:%SZ)
else
  week_ago=$(date -u -d "7 days ago" +%Y-%m-%dT%H:%M:%SZ)
  month_ago=$(date -u -d "30 days ago" +%Y-%m-%dT%H:%M:%SZ)
fi

today=$(date -u +%Y-%m-%d)

# ─── Issue Velocity ───

echo "Fetching issue stats..."

issues_this_week=$(gh api "repos/$REPO/issues?state=all&since=$week_ago&per_page=100" \
  --jq '[.[] | select(.pull_request == null)] | length')

issues_opened=$(gh api "repos/$REPO/issues?state=open&since=$week_ago&per_page=100&sort=created&direction=desc" \
  --jq "[.[] | select(.pull_request == null) | select(.created_at > \"$week_ago\")] | length")

issues_closed=$(gh api "repos/$REPO/issues?state=closed&since=$week_ago&per_page=100" \
  --jq "[.[] | select(.pull_request == null) | select(.closed_at > \"$week_ago\")] | length")

total_open=$(gh api "repos/$REPO/issues?state=open&per_page=1" -i 2>/dev/null | grep -o 'page=[0-9]*' | tail -1 | grep -o '[0-9]*' || echo "unknown")

echo "  Issues opened this week: $issues_opened"
echo "  Issues closed this week: $issues_closed"

# ─── PR Velocity ───

echo "Fetching PR stats..."

prs_opened=$(gh pr list --repo "$REPO" --state all --json createdAt \
  --jq "[.[] | select(.createdAt > \"$week_ago\")] | length" 2>/dev/null || echo "0")

prs_merged=$(gh pr list --repo "$REPO" --state merged --json mergedAt \
  --jq "[.[] | select(.mergedAt > \"$week_ago\")] | length" 2>/dev/null || echo "0")

prs_open=$(gh pr list --repo "$REPO" --state open --json number --jq 'length' 2>/dev/null || echo "0")

echo "  PRs opened this week: $prs_opened"
echo "  PRs merged this week: $prs_merged"
echo "  PRs currently open: $prs_open"

# ─── PR Review Time ───

echo "Calculating PR review times..."

pr_review_data=$(gh pr list --repo "$REPO" --state merged --json number,title,createdAt,mergedAt \
  --jq "[.[] | select(.mergedAt > \"$week_ago\") | {number, title, createdAt, mergedAt}]" 2>/dev/null || echo "[]")

avg_review_hours=$(echo "$pr_review_data" | jq '
  if length == 0 then "N/A"
  else
    [.[] |
      ((.mergedAt | sub("\\.[0-9]+Z$"; "Z") | strptime("%Y-%m-%dT%H:%M:%SZ") | mktime) -
       (.createdAt | sub("\\.[0-9]+Z$"; "Z") | strptime("%Y-%m-%dT%H:%M:%SZ") | mktime)) / 3600
    ] | add / length | floor | tostring + "h"
  end
' -r 2>/dev/null || echo "N/A")

echo "  Avg time to merge: $avg_review_hours"

# ─── Review Bottlenecks ───

echo "Finding PR review bottlenecks..."

bottleneck_prs=$(gh pr list --repo "$REPO" --state open --json number,title,createdAt,reviewDecision,reviews \
  --jq "[.[] | select(.createdAt < \"$week_ago\") | select(.reviewDecision != \"APPROVED\") | {number, title, createdAt, reviewDecision}] | sort_by(.createdAt) | .[0:10]" 2>/dev/null || echo "[]")

bottleneck_count=$(echo "$bottleneck_prs" | jq 'length')
echo "  PRs open > 7 days without approval: $bottleneck_count"

# ─── Stale Counts ───

echo "Counting stale items..."

if [[ "$(uname)" == "Darwin" ]]; then
  stale_30=$(date -u -v-30d +%Y-%m-%dT%H:%M:%SZ)
  stale_60=$(date -u -v-60d +%Y-%m-%dT%H:%M:%SZ)
  stale_90=$(date -u -v-90d +%Y-%m-%dT%H:%M:%SZ)
else
  stale_30=$(date -u -d "30 days ago" +%Y-%m-%dT%H:%M:%SZ)
  stale_60=$(date -u -d "60 days ago" +%Y-%m-%dT%H:%M:%SZ)
  stale_90=$(date -u -d "90 days ago" +%Y-%m-%dT%H:%M:%SZ)
fi

stale_30_count=$(gh api "repos/$REPO/issues?state=open&sort=updated&direction=asc&per_page=100" \
  --jq "[.[] | select(.pull_request == null) | select(.updated_at < \"$stale_30\")] | length" 2>/dev/null || echo "0")

echo "  Issues stale > 30 days: $stale_30_count"

# ─── Top Components ───

echo "Analyzing top components..."

component_data=$(gh api "repos/$REPO/issues?state=open&per_page=100" \
  --jq '[.[] | select(.pull_request == null) | .labels[].name] | group_by(.) | map({label: .[0], count: length}) | sort_by(-.count) | .[0:10]' 2>/dev/null || echo "[]")

# ─── Hot Issues ───

echo "Finding hot issues this week..."

hot_issues=$(gh api "repos/$REPO/issues?state=all&since=$week_ago&sort=comments&direction=desc&per_page=10" \
  --jq '[.[] | select(.pull_request == null) | select(.comments > 0) | {number, title, comments}] | sort_by(-.comments) | .[0:5]' 2>/dev/null || echo "[]")

# ─── Generate Report ───

echo ""
echo "Generating weekly summary..."

{
  echo "# Weekly Repo Health Summary"
  echo ""
  echo "**Repository**: $REPO"
  echo "**Week ending**: $today"
  echo ""
  echo "---"
  echo ""
  echo "## Issue Velocity"
  echo ""
  echo "| Metric | Count |"
  echo "|---|---|"
  echo "| Opened this week | $issues_opened |"
  echo "| Closed this week | $issues_closed |"
  echo "| Net change | $((issues_opened - issues_closed)) |"
  echo "| Total open | $total_open |"
  echo ""
  echo "## PR Velocity"
  echo ""
  echo "| Metric | Count |"
  echo "|---|---|"
  echo "| PRs opened | $prs_opened |"
  echo "| PRs merged | $prs_merged |"
  echo "| Currently open | $prs_open |"
  echo "| Avg time to merge | $avg_review_hours |"
  echo ""
  echo "## PR Review Bottlenecks"
  echo ""
  echo "PRs open > 7 days without approval: **$bottleneck_count**"
  echo ""
  echo "$bottleneck_prs" | jq -r '.[] | "- [#\(.number)](https://github.com/'"$REPO"'/pull/\(.number)) \(.title) (opened: \(.createdAt | split("T")[0]))"'
  echo ""
  echo "## Stale Items"
  echo ""
  echo "| Threshold | Issues |"
  echo "|---|---|"
  echo "| > 30 days | $stale_30_count |"
  echo ""
  echo "## Top Labels (Open Issues)"
  echo ""
  echo "$component_data" | jq -r '.[] | "- **\(.label)**: \(.count) issues"'
  echo ""
  echo "## Hot Issues This Week"
  echo ""
  echo "$hot_issues" | jq -r '.[] | "- [#\(.number)](https://github.com/'"$REPO"'/issues/\(.number)) \(.title) (\(.comments) comments)"'
  echo ""
  echo "---"
  echo "*Generated automatically by repo-health-agent*"
} > tmp/weekly-summary.md

echo ""
echo "Weekly summary written to tmp/weekly-summary.md"

# ─── Generate Slack Block Kit Payload ───

echo "Generating Slack payload..."

# Build bottleneck PR links for Slack (mrkdwn format)
bottleneck_links=$(echo "$bottleneck_prs" | jq -r --arg repo "$REPO" \
  '.[0:5] | .[] | "• <https://github.com/\($repo)/pull/\(.number)|#\(.number)> \(.title) (_\(.createdAt | split("T")[0])_)"' 2>/dev/null)

# Build hot issue links for Slack
hot_issue_links=$(echo "$hot_issues" | jq -r --arg repo "$REPO" \
  '.[] | "• <https://github.com/\($repo)/issues/\(.number)|#\(.number)> \(.title) (\(.comments) comments)"' 2>/dev/null)

# Build top labels
top_labels=$(echo "$component_data" | jq -r '.[0:6] | .[] | "• *\(.label)*: \(.count)"' 2>/dev/null)

# Net change emoji
net=$((issues_opened - issues_closed))
if [[ $net -gt 0 ]]; then
  net_display="📈 +${net}"
else
  net_display="📉 ${net}"
fi

cat > tmp/slack-weekly-payload.json << SLACKEOF
{
  "blocks": [
    {
      "type": "header",
      "text": { "type": "plain_text", "text": "📊 Weekly Repo Health — $today", "emoji": true }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*<https://github.com/$REPO|opensearch-project/OpenSearch-Dashboards>*"
      }
    },
    { "type": "divider" },
    {
      "type": "section",
      "fields": [
        { "type": "mrkdwn", "text": "*🐛 Issues Opened*\n${issues_opened}" },
        { "type": "mrkdwn", "text": "*✅ Issues Closed*\n${issues_closed}" },
        { "type": "mrkdwn", "text": "*📋 Net Change*\n${net_display}" },
        { "type": "mrkdwn", "text": "*⏳ Stale (30d+)*\n${stale_30_count}" }
      ]
    },
    { "type": "divider" },
    {
      "type": "section",
      "fields": [
        { "type": "mrkdwn", "text": "*🔀 PRs Opened*\n${prs_opened}" },
        { "type": "mrkdwn", "text": "*🎉 PRs Merged*\n${prs_merged}" },
        { "type": "mrkdwn", "text": "*📂 PRs Open*\n${prs_open}" },
        { "type": "mrkdwn", "text": "*⏱ Avg Merge Time*\n${avg_review_hours}" }
      ]
    },
    { "type": "divider" },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*🚨 PRs Waiting for Review (${bottleneck_count} stuck 7+ days)*\n${bottleneck_links:-_None this week_}"
      }
    },
    { "type": "divider" },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*🏷 Top Labels*\n${top_labels:-_No data_}"
        },
        {
          "type": "mrkdwn",
          "text": "*🔥 Hot Issues*\n${hot_issue_links:-_None this week_}"
        }
      ]
    },
    { "type": "divider" },
    {
      "type": "context",
      "elements": [
        { "type": "mrkdwn", "text": "🤖 _Generated by repo-health-agent_ | <https://github.com/$REPO/actions|View Actions>" }
      ]
    }
  ]
}
SLACKEOF

echo "Slack payload written to tmp/slack-weekly-payload.json"
echo "=== Done ==="
