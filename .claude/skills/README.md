# Claude Skills Directory

This directory contains Claude Code skills for OpenSearch Dashboards development. 

**Multi-Platform Support**: Skills are available for both Claude Code and Kiro users through corresponding prompt formats.

## Available Skills

### `resolve-cve` ([resolve_cve.md](resolve_cve.md))
Automatically identify and resolve security vulnerabilities (CVEs) in project dependencies.

- **Documentation**: [resolve-cve-README.md](resolve-cve-README.md)
- **Claude Usage**: `/resolve-cve [--cve_id CVE-2024-12345]`
- **Kiro Usage**: Also available as Kiro prompt at [.kiro/prompts/resolve_cve.md](../../.kiro/prompts/resolve_cve.md)
- **Purpose**: Scans GitHub issues for CVEs, verifies presence in codebase, attempts automated fixes

## Adding New Skills

When adding new skills to this directory:

1. **Claude skill file**: `skill-name.md` (the actual skill definition)
2. **Kiro prompt file**: `../../.kiro/prompts/skill-name.md` (Kiro-format prompt that delegates to Claude skill)
3. **Documentation**: `skill-name-README.md` (comprehensive user guide)  
4. **Update this README**: Add entry to "Available Skills" section with both usage formats

## Skill Development Guidelines

- Follow the existing skill template format with frontmatter
- Include clear usage examples and error handling
- Document all parameters and expected outputs
- Test thoroughly before committing
- Keep skills focused on specific, well-defined tasks

---

For general Claude Code documentation, see [CLAUDE.md](../../CLAUDE.md) in the project root.