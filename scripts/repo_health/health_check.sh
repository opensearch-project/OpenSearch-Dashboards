#!/usr/bin/env bash
# Repo Health Daily Check — stale detection and auto-labeling
# Runs via GitHub Actions or manually
set -euo pipefail

REPO="opensearch-project/OpenSearch-Dashboards"
DAYS_STALE="${DAYS_STALE:-30}"
STALE_LABEL="stale"
DRY_RUN="${DRY_RUN:-false}"

mkdir -p tmp

echo "=== Repo Health Check ==="
echo "Repository: $REPO"
echo "Stale threshold: $DAYS_STALE days"
echo "Dry run: $DRY_RUN"
echo ""

# ─── Stale Detection ───

if [[ "$(uname)" == "Darwin" ]]; then
  stale_date=$(date -u -v-${DAYS_STALE}d +%Y-%m-%dT%H:%M:%SZ)
else
  stale_date=$(date -u -d "${DAYS_STALE} days ago" +%Y-%m-%dT%H:%M:%SZ)
fi

echo "Finding issues not updated since $stale_date..."

# Get open issues sorted by least recently updated
stale_issues=$(gh api "repos/$REPO/issues?state=open&sort=updated&direction=asc&per_page=50" \
  --jq "[.[] | select(.pull_request == null) | select(.updated_at < \"$stale_date\") | {number, title, updated_at, labels: [.labels[].name], assignee: .assignee.login}]")

stale_count=$(echo "$stale_issues" | jq 'length')
echo "Found $stale_count stale issues"

# Get stale PRs
stale_prs=$(gh api "repos/$REPO/pulls?state=open&sort=updated&direction=asc&per_page=50" \
  --jq "[.[] | select(.updated_at < \"$stale_date\") | {number, title, updated_at, labels: [.labels[].name], user: .user.login}]")

stale_pr_count=$(echo "$stale_prs" | jq 'length')
echo "Found $stale_pr_count stale PRs"

# Write stale report
{
  echo "# Stale Items Report"
  echo ""
  echo "Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "Threshold: $DAYS_STALE days"
  echo ""
  echo "## Stale Issues ($stale_count)"
  echo ""
  echo "$stale_issues" | jq -r --arg repo "$REPO" '.[] | "- [#\(.number)](https://github.com/\($repo)/issues/\(.number)) \(.title) (last updated: \(.updated_at | split("T")[0]))"'
  echo ""
  echo "## Stale PRs ($stale_pr_count)"
  echo ""
  echo "$stale_prs" | jq -r --arg repo "$REPO" '.[] | "- [#\(.number)](https://github.com/\($repo)/pull/\(.number)) \(.title) (last updated: \(.updated_at | split("T")[0]))"'
} > tmp/stale-issues-report.md

echo "Stale report written to tmp/stale-issues-report.md"

# Label stale issues (if not dry run)
if [[ "$DRY_RUN" != "true" ]]; then
  echo ""
  echo "Labeling stale issues..."
  echo "$stale_issues" | jq -r '.[].number' | while read -r issue_num; do
    # Check if already has stale label
    has_stale=$(gh api "repos/$REPO/issues/$issue_num/labels" --jq "[.[].name] | any(. == \"$STALE_LABEL\")")
    if [[ "$has_stale" != "true" ]]; then
      echo "  Adding '$STALE_LABEL' label to #$issue_num"
      gh api "repos/$REPO/issues/$issue_num/labels" -f "labels[]=$STALE_LABEL" --silent 2>/dev/null || true
    fi
  done
fi

# ─── Auto-Labeling Helper ───

classify_and_label() {
  local item_type="$1"  # "issue" or "PR"
  local num="$2"
  local title="$3"
  local body="$4"

  local text
  text="$(echo "$title $body" | tr '[:upper:]' '[:lower:]')"

  local labels=()

  # Type classification
  if echo "$text" | grep -qiE 'error|crash|bug|broken|fail|regression|not working|exception|stacktrace'; then
    labels+=("bug")
  elif echo "$text" | grep -qiE 'feature|request|enhancement|add support|would be nice|proposal'; then
    labels+=("enhancement")
  elif echo "$text" | grep -qiE 'question|how to|how do|help|confused|documentation|docs'; then
    labels+=("question")
  fi

  if echo "$text" | grep -qiE 'security|cve|vulnerability|xss|injection'; then
    labels+=("security")
  fi

  # Component detection
  if echo "$text" | grep -qiE 'discover|data.explorer'; then
    labels+=("Discover")
  fi
  if echo "$text" | grep -qiE 'monaco|query.editor|code.editor'; then
    labels+=("Query Editor")
  fi
  if echo "$text" | grep -qiE 'visualization|vis.builder|chart|vega'; then
    labels+=("Visualization")
  fi
  if echo "$text" | grep -qiE '\bdashboard\b'; then
    labels+=("Dashboards")
  fi
  if echo "$text" | grep -qiE 'plugin|extension'; then
    labels+=("Plugins")
  fi
  if echo "$text" | grep -qiE 'performance|slow|memory|cpu|latency'; then
    labels+=("Performance")
  fi

  if [[ ${#labels[@]} -gt 0 ]]; then
    local label_str
    label_str=$(IFS=,; echo "${labels[*]}")
    echo "  [$item_type] #$num → $label_str"

    if [[ "$DRY_RUN" != "true" ]]; then
      for label in "${labels[@]}"; do
        gh api "repos/$REPO/issues/$num/labels" -f "labels[]=$label" --silent 2>/dev/null || true
      done
    fi
  else
    echo "  [$item_type] #$num → no match (keeping unlabeled)"
  fi
}

# ─── Auto-Labeling Issues ───

echo ""
echo "=== Auto-Labeling Unlabeled Issues ==="

unlabeled_issues=$(gh api "repos/$REPO/issues?state=open&per_page=50&sort=created&direction=desc" \
  --jq '[.[] | select(.pull_request == null) | select((.labels | length) == 0 or (.labels | all(.name == "untriaged"))) | {number, title, body: (.body // "" | .[0:500])}]')

unlabeled_issue_count=$(echo "$unlabeled_issues" | jq 'length')
echo "Found $unlabeled_issue_count unlabeled issues"

echo "$unlabeled_issues" | jq -c '.[]' | while read -r item; do
  num=$(echo "$item" | jq -r '.number')
  title=$(echo "$item" | jq -r '.title')
  body=$(echo "$item" | jq -r '.body')
  classify_and_label "Issue" "$num" "$title" "$body"
done

# ─── Auto-Labeling PRs ───

echo ""
echo "=== Auto-Labeling Unlabeled PRs ==="

unlabeled_prs=$(gh api "repos/$REPO/pulls?state=open&per_page=50&sort=created&direction=desc" \
  --jq '[.[] | select((.labels | length) == 0) | {number, title, body: (.body // "" | .[0:500])}]')

unlabeled_pr_count=$(echo "$unlabeled_prs" | jq 'length')
echo "Found $unlabeled_pr_count unlabeled PRs"

echo "$unlabeled_prs" | jq -c '.[]' | while read -r item; do
  num=$(echo "$item" | jq -r '.number')
  title=$(echo "$item" | jq -r '.title')
  body=$(echo "$item" | jq -r '.body')
  classify_and_label "PR" "$num" "$title" "$body"
done

echo ""
echo "=== Done ==="
