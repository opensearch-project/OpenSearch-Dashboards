# create_pr_description Skill

Generate concise, template-compliant PR descriptions by analyzing code changes.

## What it does

Analyzes your code changes (local or from an existing PR) and generates a PR description that follows `.github/pull_request_template.md`. Optimized for brevity — descriptions fit on one screen for typical PRs.

## Usage

```bash
# Analyze local changes
/create_pr_description

# Analyze an existing PR
/create_pr_description --pr_number 11659
```

Also available as a Kiro prompt: `/create_pr_description` or `@create_pr_description`.

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `--pr_number` | No | PR number to analyze. If omitted, analyzes local changes |
| `--output_file` | No | Output path (defaults to `tmp/pr-description.md`) |

## Style

The skill enforces concise, engineer-style writing:
- No emojis, no hype words, no filler
- 1-4 sentence descriptions for typical changes
- Concrete test commands, not generic advice
- Checklist items checked based on actual diff content
- Small/medium PRs fit in ~30-40 lines of markdown
