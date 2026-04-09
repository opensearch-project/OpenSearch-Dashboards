# Claude Skills Directory

This directory contains Claude Code skills for OpenSearch Dashboards development. 

**Multi-Platform Support**: Skills are available for both Claude Code and Kiro users through corresponding prompt formats.

## Available Skills

### `create_pr_description` ([create_pr_description/](create_pr_description/))
Generate concise, one-screen PR descriptions optimized for quick reviewer comprehension.

- **Skill Definition**: [create_pr_description/SKILL.md](create_pr_description/SKILL.md)
- **Documentation**: [create_pr_description/README.md](create_pr_description/README.md)
- **Claude Usage**: `/create_pr_description [--pr_number 123]`
- **Kiro Usage**: Also available as Kiro prompt at [.kiro/prompts/create_pr_description.md](../../.kiro/prompts/create_pr_description.md)
- **Purpose**: Generates brief, engineer-style PR descriptions that fit on one screen for typical changes

### `test_changes` ([test_changes/](test_changes/))
Run Jest unit tests for files changed in the current branch.

- **Skill Definition**: [test_changes/SKILL.md](test_changes/SKILL.md)
- **Documentation**: [test_changes/README.md](test_changes/README.md)
- **Claude Usage**: `/test_changes [--scope branch|staged|unstaged|all-local] [--base origin/main]`
- **Kiro Usage**: Also available as Kiro prompt at [.kiro/prompts/test_changes.md](../../.kiro/prompts/test_changes.md)
- **Purpose**: Finds changed files, maps them to test files, warns about missing tests, and runs `yarn test:jest`

### `resolve_cve` ([resolve_cve/](resolve_cve/))
Automatically identify and resolve security vulnerabilities (CVEs) in project dependencies.

- **Skill Definition**: [resolve_cve/SKILL.md](resolve_cve/SKILL.md)
- **Documentation**: [resolve_cve/README.md](resolve_cve/README.md)
- **Claude Usage**: `/resolve_cve [--cve_id CVE-2024-12345]`
- **Kiro Usage**: Also available as Kiro prompt at [.kiro/prompts/resolve_cve.md](../../.kiro/prompts/resolve_cve.md)
- **Purpose**: Scans GitHub issues for CVEs, verifies presence in codebase, attempts automated fixes

### `retry_flaky_tests` ([retry_flaky_tests/](retry_flaky_tests/))
Automatically retry failed required CI checks on GitHub PRs with smart waiting and filtering logic.

- **Skill Definition**: [retry_flaky_tests/SKILL.md](retry_flaky_tests/SKILL.md)
- **Documentation**: [retry_flaky_tests/README.md](retry_flaky_tests/README.md)
- **Claude Usage**: `/retry_flaky_tests [--pr_number 123] [--wait_for_completion true]`
- **Kiro Usage**: Also available as Kiro prompt at [.kiro/prompts/retry_flaky_tests.md](../../.kiro/prompts/retry_flaky_tests.md)
- **Purpose**: Identifies required vs optional checks, waits for completion, selectively retries failed required checks

## Directory Structure

Each skill is organized in its own subdirectory with the following structure:

```
.claude/skills/
├── skill_name/
│   ├── SKILL.md      # The actual skill definition with frontmatter
│   └── README.md     # Comprehensive user documentation
└── README.md         # This main skills index
```

## Adding New Skills

When adding new skills to this directory:

1. **Create skill directory**: `mkdir .claude/skills/skill_name/`
2. **Claude skill file**: `skill_name/SKILL.md` (the actual skill definition with frontmatter)
3. **Documentation**: `skill_name/README.md` (comprehensive user guide)
4. **Kiro prompt file**: `../../.kiro/prompts/skill_name.md` (Kiro-format prompt that delegates to Claude skill)
5. **Update this README**: Add entry to "Available Skills" section with both usage formats

## Skill Development Guidelines

- Follow the existing skill template format with frontmatter in `SKILL.md`
- Include clear usage examples and error handling
- Document all parameters and expected outputs in `README.md`
- Test thoroughly before committing
- Keep skills focused on specific, well-defined tasks
- Use underscores in directory names and skill names (e.g., `retry_flaky_tests`)

---

For general Claude Code documentation, see [CLAUDE.md](../../CLAUDE.md) in the project root.