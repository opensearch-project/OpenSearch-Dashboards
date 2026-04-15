---
name: test_changes
description: Run Jest unit tests for files changed in the current branch
arguments:
  - name: scope
    description: "What to diff against: 'branch' (vs base branch, default), 'staged' (staged only), 'unstaged' (unstaged only), 'all-local' (staged + unstaged)"
    required: false
  - name: base
    description: "Base ref to diff against when scope=branch (default: auto-detects remote main/mainline)"
    required: false
---

# Run Changed Tests

Find and run Jest tests relevant to locally changed files.

## Process

### Step 1: Determine changed files

Based on the `scope` argument (default: `branch`):

```bash
# scope=branch (default): all changes since diverging from base branch
# Auto-detect base: use origin/main or origin/mainline, whichever exists
base="${base:-$(git rev-parse --verify origin/main 2>/dev/null && echo origin/main || echo origin/mainline)}"
git diff --name-only --diff-filter=ACMR "$base"...HEAD
# Also include uncommitted changes on top
git diff --name-only --diff-filter=ACMR HEAD

# scope=staged
git diff --cached --name-only --diff-filter=ACMR

# scope=unstaged
git diff --name-only --diff-filter=ACMR

# scope=all-local
git diff --name-only --diff-filter=ACMR HEAD
```

Filter to only `.ts`, `.tsx`, `.js`, `.jsx` files. Exclude files under `target/`, `build/`, `node_modules/`.

### Step 2: Separate source files and test files

From the changed file list:
- **Test files**: any file matching `*.test.ts`, `*.test.tsx`, `*.test.js`, `*.test.jsx` → run directly.
- **Source files**: everything else → look for a corresponding test file.

### Step 3: Find test files for changed source files

For each changed source file (e.g., `src/plugins/foo/bar.ts`), check if any of these exist:
1. `src/plugins/foo/bar.test.ts`
2. `src/plugins/foo/bar.test.tsx`
3. `src/plugins/foo/bar.test.js`

Use the first match found.

### Step 4: Warn about missing tests

For any changed source file with no matching test file, print a warning:
```
⚠ No test file found for: src/plugins/foo/bar.ts
```

This is informational only — do not fail or block.

### Step 5: Run tests

Combine all discovered test files (from changed test files + matched test files for source changes), deduplicate, then run:

```bash
yarn test:jest path/to/test1.test.ts path/to/test2.test.tsx ...
```

If no test files are found at all, report that and exit cleanly.

### Step 6: Report results

Summarize:
- How many test files were run
- Which changed source files had no tests (the warnings from step 4)
- Pass/fail status from Jest
