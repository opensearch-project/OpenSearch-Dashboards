# retry-flaky-tests Skill Documentation

Comprehensive guide for the **`retry-flaky-tests`** skill (`retry-flaky-tests.md`).

Automated tool for intelligently retrying failed required CI checks on GitHub PRs, eliminating manual monitoring and selective retrying.

## 🔧 What it does

The retry flaky tests skill automatically:
- 🔍 **Analyzes PR check status** from GitHub CI/CD pipelines  
- 🎯 **Identifies required vs optional checks** using branch protection rules
- ⏳ **Waits for in-progress checks** to complete before retrying
- 🔄 **Selectively retries failed required checks** (ignores optional failures)
- 📊 **Provides real-time progress updates** with clear status summaries
- 🛡️ **Prevents retry loops** with configurable maximum attempts

## 🚀 Usage

### Basic Commands

```bash
# Auto-detect PR from current branch, wait and retry
/retry-flaky-tests

# Target a specific PR number
/retry-flaky-tests --pr_number 1234

# Quick status check without retrying
/retry-flaky-tests --max_retries 0

# Aggressive retry for urgent fixes
/retry-flaky-tests --max_retries 5 --poll_interval 15

# Skip waiting for in-progress checks
/retry-flaky-tests --wait_for_completion false
```

### Example Workflow

1. **Push your changes:**
   ```bash
   git push origin feature-branch
   ```

2. **Run the skill to handle CI:**
   ```bash
   /retry-flaky-tests --wait_for_completion true
   ```

3. **Get real-time feedback:**
   ```
   🔍 Analyzing PR #1234: "Fix authentication bug"
   📊 Check Status:
     ✅ Required Passed: 3/5
     ❌ Required Failed: 2/5  
     📋 Optional Failed: 1 (ignored)
   🔄 Retrying Failed Required Checks...
   ```

4. **Your PR is ready when all required checks pass!**

## 📋 Arguments Reference

| Argument | Description | Default | Example |
|----------|-------------|---------|---------|
| `pr_number` | Specific PR to check (auto-detects if not provided) | Current branch | `--pr_number 1234` |
| `wait_for_completion` | Wait for in-progress checks before retrying | `true` | `--wait_for_completion false` |
| `max_retries` | Maximum retry attempts per check | `3` | `--max_retries 5` |
| `poll_interval` | Seconds between status checks when waiting | `30` | `--poll_interval 15` |

## 📋 Prerequisites

Make sure you have:
- ✅ **GitHub CLI installed** (`gh` command available)
- ✅ **Authenticated with GitHub** (`gh auth login`)
- ✅ **Push access to repository** (required to trigger re-runs)
- ✅ **Open PR** (either specify `--pr_number` or be on a branch with an open PR)

## 🧠 Smart Logic

### Required vs Optional Check Detection

**Primary Method: Branch Protection API**
```bash
# Gets actual required status checks from GitHub
gh api repos/{owner}/{repo}/branches/{base_branch}/protection
```

**Fallback Method: Heuristics**
If branch protection isn't configured, uses smart patterns:
- ✅ **Likely Required**: `build`, `test`, `lint`, `security`, `typecheck`
- 🚫 **Likely Optional**: `codecov`, `sonar`, `deploy-preview`, `lighthouse`

### Check State Handling

| Check State | Action | Reasoning |
|-------------|--------|-----------|
| ✅ **Passed** | Skip | Already successful |
| ❌ **Failed + Required** | Retry | Blocking merge |
| ❌ **Failed + Optional** | Ignore | Not blocking merge |
| ⏸️ **In Progress** | Wait (if enabled) | Let it complete first |
| ⏭️ **Skipped/Cancelled** | Skip | Usually intentional |

### Retry Strategy

```bash
# Only retry failed jobs within the workflow run
gh run rerun $run_id --failed

# Track attempts to respect max_retries limit
attempt_count[workflow_name]++
```

## 📊 Status Output

### Summary Report Format
```
🔍 Analyzing PR #1234: "Fix authentication bug"

📊 Check Status:
  ✅ Required Passed: 3/5
  ❌ Required Failed: 2/5  
  ⏸️ In Progress: 0/5
  📋 Optional Failed: 1 (ignored)

🔄 Retrying Failed Required Checks:
  - build-and-test (attempt 1/3)
  - security-scan (attempt 1/3)

⏳ Monitoring progress... (Ctrl+C to stop)

✅ Retry Results:
  ✅ build-and-test: Now passing  
  🔄 security-scan: Still running
  
🎯 Next Steps:
  - Wait for security-scan to complete
  - PR ready for review once all required checks pass
```

### Progress Indicators

**Waiting Phase:**
```
⏳ Waiting for 2 checks to complete...
  - security-scan: ~3 minutes remaining
  - integration-tests: ~7 minutes remaining
```

**Retry Phase:**
```
🔄 Triggered retries for 2 required checks:
  - build-and-test
  - security-scan

👀 Monitoring retry progress (Ctrl+C to stop)...
```

## 🔍 How it works

### Step 1: PR Identification
- **Auto-detection**: Uses `git branch --show-current` + `gh pr list --head`
- **Manual specification**: Accepts `--pr_number` argument
- **Validation**: Confirms PR exists and is open

### Step 2: Check Status Analysis
```bash
# Get comprehensive check information
gh pr checks {pr_number} --json name,status,conclusion,detailsUrl
gh run list --pr {pr_number} --json databaseId,name,status,conclusion
```

### Step 3: Required Check Detection
```bash
# Primary: Branch protection rules
gh api repos/{owner}/{repo}/branches/{base_branch}/protection \
  --jq '.required_status_checks.contexts[]'

# Fallback: Pattern matching for common required checks
```

### Step 4: Smart Waiting (Optional)
```bash
while [[ $in_progress_count -gt 0 ]]; do
    echo "⏳ Waiting for $in_progress_count checks to complete..."
    sleep {poll_interval}
    # Re-check and update status
done
```

### Step 5: Selective Retry
```bash
# Only retry failed required checks
for check in "${failed_required_checks[@]}"; do
    gh run rerun $run_id --failed
    echo "🔄 Retried $check (attempt $attempt/$max_retries)"
done
```

## 🛡️ Safety Features

- **🔒 Permission Checks**: Validates GitHub authentication and push access
- **🔄 Retry Limits**: Prevents infinite retry loops with `max_retries`
- **⏸️ Graceful Interruption**: Allows Ctrl+C to stop waiting/monitoring
- **📊 Clear Feedback**: Always shows what actions will be taken before executing
- **🎯 Selective Targeting**: Only retries checks that are actually required for merge

## 🐛 Troubleshooting

### "Unknown skill: retry-flaky-tests"
Check that the skill file exists in your project:
```bash
# Verify skill file exists
ls .claude/skills/retry-flaky-tests.md

# Restart Claude Code to refresh skill registry
```

### "gh: command not found"
Install and authenticate GitHub CLI:
```bash
# Install (macOS)
brew install gh

# Install (other platforms)
# See: https://cli.github.com/

# Authenticate
gh auth login
```

### "Error: HTTP 403: Must have push access"
You need push access to the repository to trigger re-runs:
```bash
# Check your permissions
gh api repos/{owner}/{repo} --jq '.permissions'

# Expected: "push": true, "admin": true (or "maintain": true)
```

### "No failed required checks found"
This means your PR is in good shape! Possible reasons:
- All required checks are passing ✅
- Only optional checks are failing (which don't block merge) 
- No checks have run yet (recent push?)

### "Branch protection rules not found"
If the repository doesn't use branch protection:
- Skill falls back to heuristic detection
- You can manually specify what should be considered required
- Consider setting up branch protection for better automation

## 💡 Pro Tips

### 1. **Combine with Push Workflow**
```bash
# Create an alias for the common workflow
alias push-and-retry='git push origin $(git branch --show-current) && /retry-flaky-tests'
```

### 2. **Quick Status Checks** 
```bash
# Just check status without retrying anything
alias check-pr='/retry-flaky-tests --max_retries 0'
```

### 3. **Urgent Retry Mode**
```bash
# For time-sensitive PRs - more aggressive retrying
/retry-flaky-tests --max_retries 5 --poll_interval 15
```

### 4. **Background Monitoring**
```bash
# Start the process and let it run in background
/retry-flaky-tests --wait_for_completion true &
# Continue with other work, get notified when done
```

### 5. **Batch Multiple PRs**
```bash
# If you have multiple PRs needing attention
/retry-flaky-tests --pr_number 1234
/retry-flaky-tests --pr_number 1235  
/retry-flaky-tests --pr_number 1236
```

## 🎯 Common Workflows

### Workflow 1: "Fire and Forget"
```bash
# Push changes, let skill handle everything automatically
git push origin feature-branch
/retry-flaky-tests
# Come back later to a green PR!
```

### Workflow 2: "Quick Check Before Meeting"
```bash
# See status without waiting or retrying
/retry-flaky-tests --max_retries 0 --wait_for_completion false
```

### Workflow 3: "Urgent Hotfix"
```bash
# Maximum effort to get checks passing ASAP
/retry-flaky-tests --max_retries 5 --poll_interval 10
```

### Workflow 4: "Multi-PR Day"
```bash
# Check all your open PRs quickly
gh pr list --author @me --json number | jq -r '.[].number' | \
  xargs -I {} /retry-flaky-tests --pr_number {} --max_retries 0
```

## 🔗 Integration with Other Tools

### Git Hooks
Add to `.git/hooks/post-push`:
```bash
#!/bin/bash
# Automatically retry flaky tests after pushing
/retry-flaky-tests --wait_for_completion false
```

### Shell Functions  
Add to your `.bashrc`/`.zshrc`:
```bash
# Smart PR retry - detects if on feature branch
pcheck() {
    if [[ $(git branch --show-current) != "main" ]]; then
        /retry-flaky-tests
    else
        echo "Not on feature branch"
    fi
}
```

## 📞 Getting Help

- **Skill issues**: Check the skill file at `.claude/skills/retry-flaky-tests.md`
- **GitHub CLI problems**: Run `gh auth status` and `gh --help`
- **Permission issues**: Contact repository admin for push access
- **CI/CD questions**: Check with your team's DevOps/Platform engineers

## ⚡ Performance Notes

- **API Rate Limits**: GitHub API allows 5000 requests/hour for authenticated users
- **Polling Frequency**: Default 30s interval balances responsiveness with API usage
- **Batch Operations**: Skill efficiently batches multiple check retries
- **Caching**: Minimizes redundant API calls by caching check states

---

**Happy CI/CD automation! 🚀**