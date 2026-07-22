---
name: retry_flaky_tests
description: Automatically retry failed required CI checks on GitHub PRs, with smart waiting and filtering logic
arguments:
  - name: pr_number
    description: PR number to check. If not provided, will detect from current branch
    required: false
---

# Retry Flaky Tests Skill

Automatically handles flaky CI tests by intelligently retrying only failed required checks on GitHub PRs. Saves time by avoiding manual monitoring and selective retrying.

## Usage

```bash
/retry-flaky-tests [--pr_number 123] [--wait_for_completion true] [--max_retries 3] [--poll_interval 30]
```

## Key Features

- **Smart Filtering**: Only retries required checks (ignores optional ones)
- **Wait Logic**: Can wait for in-progress runs to complete before retrying
- **Batch Processing**: Handles multiple failed checks in one command  
- **Status Awareness**: Distinguishes between failed, in-progress, cancelled states
- **Retry Limiting**: Prevents infinite retry loops with max attempts
- **Real-time Feedback**: Shows progress and results throughout process

## Process

### Step 1: Identify Target PR

**If `--pr_number` provided:**
```bash
gh pr view {pr_number} --json number,headRefName,baseRefName
```

**If not provided, detect from current branch:**
```bash
# Get current branch
current_branch=$(git branch --show-current)

# Find PR for this branch  
gh pr list --head "$current_branch" --json number,title,headRefName
```

**Validation:**
- Ensure PR exists and is open
- Confirm we have appropriate permissions
- Extract PR number, head branch, base branch for later use

### Step 2: Get Current Check Status

```bash
# Get all check runs for the PR
gh pr checks {pr_number} --json name,status,conclusion,detailsUrl

# Get workflow runs with more detail
gh run list --pr {pr_number} --json databaseId,name,status,conclusion,workflowName
```

**Parse results to categorize checks:**
- ✅ **Passed**: `status: "completed"`, `conclusion: "success"`
- ❌ **Failed**: `status: "completed"`, `conclusion: "failure"`  
- ⏸️ **In Progress**: `status: "in_progress"` or `status: "queued"`
- ⏭️ **Skipped/Cancelled**: `conclusion: "skipped"` or `conclusion: "cancelled"`

### Step 3: Identify Required vs Optional Checks

**Get branch protection rules:**
```bash
# Get protection rules for base branch (usually main/master)
gh api repos/{owner}/{repo}/branches/{base_branch}/protection \
  --jq '.required_status_checks.contexts[]'
```

**Cross-reference with current checks:**
- Match check names from Step 2 with required contexts from protection rules
- Build list of required checks that failed
- Exclude optional checks from retry logic

**Fallback if no protection rules:**
```bash
# If branch protection API fails, use heuristics:
# - Checks with "required" in description
# - Common required check patterns: "build", "test", "lint", "security"
# - Exclude obvious optional ones: "codecov", "sonar", "deploy-preview"
```

### Step 4: Wait Logic (if enabled)

**If `--wait_for_completion true`:**

```bash
while [[ $in_progress_count -gt 0 ]]; do
    echo "⏳ Waiting for $in_progress_count checks to complete..."
    sleep {poll_interval}
    
    # Re-check status
    gh pr checks {pr_number} --json name,status,conclusion
    # Update in_progress_count
done

echo "✅ All checks completed. Proceeding with retry logic..."
```

**Progress indicators:**
- Show which checks are still running
- Display estimated time remaining (if available from API)
- Allow user to interrupt waiting with Ctrl+C

### Step 5: Smart Retry Logic

**For each failed required check:**

```bash
# Get the specific workflow run ID
run_id=$(gh run list --pr {pr_number} --workflow "{workflow_name}" \
  --json databaseId --jq '.[0].databaseId')

# Retry only the failed jobs (not successful ones)  
gh run rerun $run_id --failed

echo "🔄 Retried {workflow_name} (run #$run_id)"
```

**Retry strategy:**
- Only retry checks that both:
  1. Are required for merge
  2. Have `conclusion: "failure"` (not cancelled/skipped)
- Track retry attempts to respect `--max_retries`
- Wait between retries to avoid rate limiting

### Step 6: Post-Retry Monitoring

**After triggering retries:**

```bash
echo "🚀 Triggered retries for $retry_count required checks:"
for check in "${retried_checks[@]}"; do
    echo "  - $check"
done

echo ""
echo "📊 Current status summary:"
echo "  ✅ Passed: $passed_count"  
echo "  🔄 Retrying: $retry_count"
echo "  ⏸️ In Progress: $in_progress_count"
echo "  ❌ Still Failed: $still_failed_count"
```

This skill transforms flaky CI from a time-sink into an automated background task! 🚀