---
name: resolve_cve
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

**Important**: 
- Always create reports in `tmp/` directory (gitignored) to avoid committing temporary files
- Clean existing tmp files at start of each run to prevent stale data in PR descriptions

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

Create a PR-ready description in `tmp/cve-pr-description.md` by **dynamically using the current GitHub PR template**:

1. **Read the current PR template**: Load `.github/pull_request_template.md` to get the latest format
2. **Parse template structure**: Identify sections like Description, Issues Resolved, Testing, etc.
3. **Fill in CVE-specific content**: Replace template placeholders with actual CVE resolution details
4. **Auto-extract GitHub Issue Numbers**: Parse CVE issue URLs and add `closes #[number]` entries

**Content Mapping Strategy**:

- **Description section**: Fill with CVE summary, affected packages, resolution strategy
- **Issues Resolved section**: Auto-populate with `closes #[issue-number]` from found CVE issues
- **Testing section**: Add CVE-specific verification commands
- **Checklist section**: Mark relevant items as completed based on resolution results

**Dynamic Template Approach**:

```bash
# Always use current template as base
cp .github/pull_request_template.md tmp/cve-pr-description.md

# Then programmatically fill in sections with CVE data:
# - Replace "<!-- Describe what this change achieves-->" with CVE details
# - Replace "<!-- List any issues this PR will resolve -->" with closes #123
# - Fill testing section with CVE verification steps
```

This ensures the skill **always respects the current PR template format**, even if it changes in the future - no manual skill updates required!

### Step 6: Setup and Failure Documentation

**Setup tmp/ directory and generate PR description**:

```bash
mkdir -p tmp
echo "tmp/" >> .gitignore  # if not already present

# IMPORTANT: Clean any existing tmp files to avoid stale data
rm -f tmp/cve-pr-description.md tmp/cve-failure-report.md

# Use current GitHub PR template as base (future-proof!)
cp .github/pull_request_template.md tmp/cve-pr-description.md
```

**Why we clean tmp files first**:
- **Prevents stale data**: Ensures fresh reports with current CVE status
- **Accurate issue refs**: Avoids outdated "closes #123" references  
- **No confusion**: Eliminates mixing data from multiple CVE runs
- **Current state**: Always reflects the actual dependency versions being fixed

**Template Content Replacement Guide**:

1. **Description section**: Replace `<!-- Describe what this change achieves-->` with:

   ```
   Resolves security vulnerabilities in project dependencies:
   - **CVE-[ID]** ([Severity]): [Brief description]
   - **Package**: [affected-package@version] → [safe-version]
   - **Resolution Strategy**: [Strategy used]
   ```

2. **Issues Resolved section**: Replace `<!-- List any issues... -->` with:

   ```
   - closes #[issue-number]  (auto-extracted from GitHub CVE issues)
   ```

3. **Testing section**: Replace `<!-- Please provide detailed steps... -->` with CVE-specific validation steps

This approach ensures the skill **automatically adapts** to any future PR template changes without requiring skill updates.

If CVE cannot be automatically resolved, document in `tmp/cve-failure-report.md`:

- Which strategies were attempted
- Specific error messages encountered
- Dependency conflicts preventing resolution
- Recommended manual intervention steps
- Upstream dependency update requirements
- GitHub issue numbers for tracking

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
2. Project builds successfully (`yarn osd bootstrap` passes)
3. All tests pass (`yarn test:jest` passes)
4. No new vulnerabilities introduced (`yarn audit` clean for resolved CVE)
5. PR-ready documentation created in `tmp/cve-pr-description.md`
6. GitHub issue numbers auto-extracted and added as `closes #123` references

## Output Files

- `tmp/cve-pr-description.md` - PR description ready to copy/paste, **dynamically generated from current `.github/pull_request_template.md`**
- `tmp/cve-failure-report.md` - Failure analysis (if resolution fails), using same template approach
- Both files automatically adapt to future PR template changes - no skill maintenance required!
