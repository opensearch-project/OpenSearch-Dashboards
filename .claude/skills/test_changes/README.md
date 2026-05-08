# test_changes Skill

Run Jest unit tests for files you've changed locally.

## Usage

```bash
# Run tests for all changes on your branch (vs base branch)
/test_changes

# Only staged changes
/test_changes --scope staged

# Only unstaged changes
/test_changes --scope unstaged

# All uncommitted changes (staged + unstaged)
/test_changes --scope all-local

# Diff against a specific base
/test_changes --base origin/feature-branch
```

Also available as a Kiro prompt: `@test_changes`.

## Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `--scope` | No | `branch` | `branch`, `staged`, `unstaged`, or `all-local` |
| `--base` | No | auto-detect | Base ref for branch scope (auto-detects `origin/main` or `origin/mainline`) |

## What it does

1. Finds changed `.ts`/`.tsx`/`.js` files based on scope
2. Maps source files to their `*.test.*` counterparts
3. Includes any directly changed test files
4. Warns (non-blocking) about source files with no matching test
5. Runs `yarn test:jest` with the discovered test files
