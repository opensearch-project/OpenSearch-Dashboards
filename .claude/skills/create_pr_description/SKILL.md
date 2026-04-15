---
name: create_pr_description
description: Generate a concise PR description from code changes, following the repo's PR template
arguments:
  - name: pr_number
    description: PR number to analyze. If not provided, analyzes local uncommitted/committed changes
    required: false
  - name: output_file
    description: File path to save the generated PR description (defaults to tmp/pr-description.md)
    required: false
---

# Generate PR Description

Analyze code changes and produce a PR description that follows `.github/pull_request_template.md`. The output should be concise enough that a reviewer can understand the PR in under 30 seconds.

## Writing Style Rules

- Write like a senior engineer, not a marketing team. No emojis, no hype words ("revolutionizes", "powerful", "comprehensive"), no filler.
- Every sentence must convey information a reviewer needs. If removing a sentence loses nothing, remove it.
- Description section: 1-4 sentences max for typical changes. Use bullet points only when listing multiple distinct changes.
- Testing section: List concrete commands or steps. Skip generic advice like "verify functionality works as expected".
- Checklist: Check boxes that are actually true based on the diff. Leave unchecked items alone — don't add explanatory sub-bullets unless the template already has them.
- For small/medium PRs (< ~300 lines changed), the entire description should fit on one screen (~30-40 lines of markdown).
- For large PRs (features, designs), more detail is warranted — but still prefer structured brevity over prose.

## Good Example

This is the style to emulate (from a real CVE fix PR):

```markdown
### Description

Resolves security vulnerabilities in project dependencies:
* **CVE-2026-4800** (High): lodash vulnerable to Code Injection via `_.template` imports key names
* **Package**: lodash@4.17.23 → lodash@4.18.1
* **Resolution Strategy**: Direct Package Update - Updated all lodash dependencies and yarn resolutions to safe versions

### Issues Resolved
* closes #11658

## Screenshot

## Testing the changes

**CVE Resolution Verification:**
1. Run `yarn osd bootstrap` - Should complete successfully
2. Run `yarn audit --level high` - Should not show CVE-2026-4800 or lodash vulnerabilities
3. Check `yarn.lock` - Should show lodash@4.18.1 (safe version)

**Build Verification:**
* Ensure project builds and starts successfully
* No functional regressions expected as this is a security patch update

### Check List
- [x] All tests pass
  - [x] `yarn test:jest`
  - [x] `yarn test:jest_integration`
- [ ] New functionality includes testing.
- [ ] New functionality has been documented.
- [x] Commits are signed per the DCO using --signoff
```

## Steps

### Step 1: Read the PR template

```bash
cat .github/pull_request_template.md
```

Use this as the skeleton. Preserve its structure exactly.

### Step 2: Gather change context

For local changes:
```bash
git diff --name-only HEAD
git diff --stat HEAD
git log --oneline -5
git branch --show-current
```

For an existing PR (if a PR number is provided):
```bash
gh pr view {pr_number} --json title,body,headRefName,files
gh pr diff {pr_number} --stat
```

### Step 3: Fill in the template

- **Description**: State what changed and why in 1-4 sentences. If there are multiple distinct changes, use a short bullet list. Include the specific files/components affected only when it helps the reviewer navigate.
- **Issues Resolved**: Extract from branch name or commit messages. Use `closes #N` format.
- **Screenshot**: Leave empty unless UI changes are present, in which case note that a screenshot should be attached.
- **Testing**: List the specific test commands relevant to the changed files. Include manual steps only if automated tests don't cover the change.
- **Checklist**: Check items based on what the diff actually contains (test files present → check test box, docs changed → check docs box, etc.).

### Step 4: Output

Write the filled template to `tmp/pr-description.md` (or a specified output path) and print it to the terminal.
