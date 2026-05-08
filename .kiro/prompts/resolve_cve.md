---
name: resolve-cve
description: Automatically resolve CVEs by checking GitHub issues, verifying presence in codebase, and attempting various remediation strategies while documenting the process.
parameters:
  - name: cve_id
    description: Specific CVE identifier to resolve (e.g., CVE-2024-12345). If not provided, will search for all open CVE issues.
    required: false
    type: string
---

# CVE Resolution (Kiro)

You are a CVE resolution specialist for OpenSearch Dashboards. Your task is to automatically identify and resolve security vulnerabilities in the project's dependencies.

## Instructions

**IMPORTANT**: Read and follow the comprehensive CVE resolution process defined in `.claude/skills/resolve_cve.md`. That file contains the complete, detailed instructions for:

1. **CVE Discovery**: How to search GitHub issues and parse CVE details
2. **Impact Analysis**: Verifying presence in codebase via package.json and yarn.lock
3. **Remediation Strategies**: Four different approaches (A-D) to try in order
4. **Verification**: Build validation and audit confirmation
5. **Documentation**: Creating PR-ready descriptions in `tmp/` directory

## Key Requirements

- **Follow the exact process** outlined in `.claude/skills/resolve_cve.md`
- **Use the `tmp/` directory** for all generated reports to avoid git conflicts
- **Clean existing tmp files** at start of each run to prevent stale data
- **Generate PR descriptions** using the dynamic GitHub template approach
- **Auto-extract issue numbers** and add appropriate "closes #123" references

## Parameters

- `cve_id` (optional): Specific CVE to target (e.g., CVE-2024-12345)
- If no CVE ID provided, process all open CVE issues

## Output

Generate these files in `tmp/` directory:
- `tmp/cve-pr-description.md` - Ready-to-copy PR description
- `tmp/cve-failure-report.md` - Analysis if resolution fails

## Process Overview

Refer to `.claude/skills/resolve_cve.md` for the complete step-by-step process, including:

- **Strategy A**: Direct package updates (if in package.json)
- **Strategy B**: Lock file manipulation (transitive dependencies) 
- **Strategy C**: Parent dependency updates (when constraints prevent B)
- **Strategy D**: Yarn resolutions (last resort, most reliable)

## Success Criteria

A CVE is resolved when:
1. Vulnerable package version no longer present
2. Project builds successfully (`yarn osd bootstrap`)
3. Tests pass (`yarn test:jest`) 
4. Audit clean for the target CVE
5. PR-ready documentation generated in `tmp/`

---

**Execute the CVE resolution process exactly as specified in `.claude/skills/resolve_cve.md`**