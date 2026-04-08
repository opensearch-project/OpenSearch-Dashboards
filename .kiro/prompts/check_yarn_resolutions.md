---
name: check-yarn-resolutions
description: Audit yarn resolutions to identify which ones can be safely removed and document why remaining ones are necessary for security or compatibility.
parameters:
  - name: resolution_pattern
    description: Specific resolution pattern to check (e.g., "**/package-name"). If not provided, will check all resolutions.
    required: false
    type: string
---

# Yarn Resolutions Audit (Kiro)

You are a dependency management specialist for OpenSearch Dashboards. Your task is to systematically audit yarn resolutions to identify outdated entries that can be safely removed while maintaining security and compatibility.

## Instructions

**IMPORTANT**: Read and follow the comprehensive yarn resolutions audit process defined in `.claude/skills/check_yarn_resolutions.md`. That file contains the complete, detailed instructions for:

1. **Resolution Discovery**: How to parse and categorize existing yarn resolutions
2. **Safety Testing**: Systematic approach to testing resolution removal one-by-one  
3. **Security Validation**: Using yarn audit to ensure no CVEs are introduced
4. **Build Verification**: Confirming compatibility after each change
5. **Documentation Generation**: Creating comprehensive reports in `tmp/` directory

## Key Requirements

- **Follow the exact process** outlined in `.claude/skills/check_yarn_resolutions.md`
- **Use the `tmp/` directory** for all generated reports to avoid git conflicts
- **Clean existing tmp files** at start of each run to prevent stale data
- **Test removals one-by-one** - never remove multiple resolutions simultaneously
- **Backup everything** before making any changes (package.json, yarn.lock)
- **Document thoroughly** why each remaining resolution is necessary

## Parameters

- `resolution_pattern` (optional): Specific resolution to target (e.g., "**/lodash")
- If no pattern provided, audit all resolutions in package.json

## Safety Protocol

**Critical safety measures from the skill:**
- Always backup package.json and yarn.lock before starting
- Test each resolution removal individually  
- Run `yarn osd bootstrap` and `yarn audit` after each test
- Restore backups immediately if any issues arise
- Never leave the project in a broken state

## Output

Generate these files in `tmp/` directory:
- `tmp/yarn-resolutions-report.md` - Summary report ready for PR description  
- `tmp/yarn-resolutions-analysis.md` - Detailed technical analysis and maintenance guide

## Process Overview

Refer to `.claude/skills/check_yarn_resolutions.md` for the complete step-by-step process, including:

- **Setup and Backup**: File protection and tmp directory preparation
- **Systematic Testing**: Safe removal testing with rollback procedures
- **Decision Matrix**: Clear criteria for keeping vs. removing resolutions
- **Documentation Standards**: Comprehensive reporting formats for different resolution types

## Success Criteria

A resolution audit is successful when:
1. All safe resolutions have been removed from package.json
2. Project builds successfully (`yarn osd bootstrap`)  
3. No new security vulnerabilities introduced (`yarn audit` clean)
4. Comprehensive documentation generated explaining remaining resolutions
5. Clear maintenance schedule provided for ongoing monitoring

---

**Execute the yarn resolutions audit process exactly as specified in `.claude/skills/check_yarn_resolutions.md`**