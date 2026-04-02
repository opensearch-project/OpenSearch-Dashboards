---
name: resolve-cve
description: Automatically resolve CVEs by checking GitHub issues, verifying presence in codebase, and attempting various remediation strategies while documenting the process.
arguments:
  - name: cve_id
    description: Specific CVE identifier to resolve (e.g., CVE-2024-12345). If not provided, will search for all open CVE issues.
    required: false
---

# CVE Resolution Skill

Automatically resolve CVEs by checking GitHub issues, verifying presence in codebase, and attempting various remediation strategies while documenting the process.

## Usage

```
/resolve-cve [--cve_id CVE-2024-12345]
```

If no CVE ID is provided, will search for all open CVE issues.

## Process

You are a CVE resolution specialist for OpenSearch Dashboards. Your goal is to automatically identify and resolve security vulnerabilities in the project's dependencies.

### Step 1: Identify CVEs

1. **Search GitHub Issues**: Look for open CVE issues in https://github.com/opensearch-project/OpenSearch-Dashboards/issues
   - Use GitHub API or web search to find issues with "CVE" in title
   - Filter for open issues only
   - Extract CVE numbers and affected package information

2. **Parse CVE Details**: For each CVE found, extract:
   - CVE identifier (e.g., CVE-2024-12345)
   - Affected package name and vulnerable version range
   - Recommended safe version
   - Severity level

### Step 2: Verify Presence in Codebase

1. **Check package.json**: Search for the vulnerable package in package.json files
2. **Check yarn.lock**: Verify if vulnerable versions are actually installed
3. **Analyze dependency tree**: Use `yarn why <package>` to understand why the package is included

### Step 3: Remediation Strategies

Try the following strategies in order until successful:

#### Strategy A: Direct Package Update (if in package.json)
1. If vulnerable package is explicitly declared in package.json:
   - Update version to safe version with caret (^)
   - Run `yarn osd bootstrap` to update lock file and verify build

#### Strategy B: Lock File Manipulation (if transitive dependency)
1. If package is NOT in package.json (transitive dependency):
   - Delete vulnerable package entries from yarn.lock
   - Run `yarn osd bootstrap` to regenerate with latest versions
   - Check if vulnerability is resolved

#### Strategy C: Peer Dependency Resolution
1. If Strategy B fails due to peer dependency constraints:
   - Identify which dependency requires the vulnerable version
   - Delete that dependency's yarn.lock entries too
   - Run `yarn osd bootstrap` again
   - May need to update parent dependency version

#### Strategy D: Resolutions (last resort)
1. If other strategies fail:
   - Add yarn resolutions to package.json to force safe version
   - Use the least invasive resolution path possible
   - Example: If package "a" has a CVE and the vulnerable version comes from dependency "b", use a targeted resolution like `"**/b/a": "^3.5.3"` instead of a global `"a": "^3.5.3"`
   - Document why the resolution was needed and which dependency path required it

### Step 4: Verification

After each remediation attempt:
1. Run `yarn osd bootstrap` to ensure build succeeds
2. Run `yarn audit` to check if vulnerability is resolved
3. Run basic smoke tests if available
4. Verify no new vulnerabilities were introduced

### Step 5: Documentation

Create a comprehensive `cve.md` file in project root with:

```markdown
# CVE Resolution Report

## CVE: [CVE-ID]
**Status**: [Resolved/Failed/Partial]
**Date**: [Current date]
**Package**: [affected-package@version]
**Severity**: [High/Medium/Low]

## Summary
[Brief description of the vulnerability]

## Resolution Strategy Applied
[Which strategy was used - A, B, C, or D]

## Changes Made
[Detailed list of files modified and changes made]

### package.json changes:
```json
[diff of package.json changes if any]
```

### yarn.lock changes:
[Summary of lock file changes]

## Verification Results
- [ ] Build passes (`yarn osd bootstrap`)
- [ ] Audit clean (`yarn audit`)  
- [ ] No new vulnerabilities introduced
- [ ] Smoke tests pass (if applicable)

## Manual Steps Required (if any)
[List any manual intervention needed]

## Notes
[Additional context, warnings, or recommendations]
```

### Step 6: Failure Documentation

If CVE cannot be automatically resolved, document:
- Which strategies were attempted
- Specific error messages encountered
- Dependency conflicts preventing resolution
- Recommended manual intervention steps
- Upstream dependency update requirements

## Error Handling

- Always backup original package.json and yarn.lock before making changes
- If any step fails, restore backups and document the failure
- Never leave the project in a broken state
- Provide clear next steps for manual resolution

## Constraints

- Only modify dependency versions, never remove required dependencies
- Maintain compatibility with Node.js version requirements
- Preserve existing functionality
- Follow semver best practices for version updates
- Document all changes for PR review

## Success Criteria

A CVE is considered resolved when:
1. Vulnerable package version is no longer present
2. Project builds successfully
3. All tests pass
4. No new vulnerabilities introduced
5. Documentation is complete