# resolve-cve Skill Documentation

Comprehensive guide for the **`resolve-cve`** skill (`resolve_cve.md`).

Automated tool for identifying and resolving security vulnerabilities (CVEs) in OpenSearch Dashboards dependencies.

## 🔧 What it does

The CVE resolution skill automatically:
- 🔍 **Finds open CVE issues** from GitHub  
- 🔎 **Verifies which affect your code** by analyzing package.json and yarn.lock
- 🛠️ **Attempts multiple fix strategies** (direct updates, lock manipulation, resolutions)
- ✅ **Validates the fixes work** by running builds and audits
- 📋 **Documents everything** in a comprehensive report for your PR

## 🚀 Usage

### Basic Commands

```bash
# Scan and fix ALL open CVEs
/resolve-cve

# Target a specific CVE
/resolve-cve --cve_id CVE-2025-54798

# Get help on available options
/resolve-cve --help
```

### Example Workflow

1. **Run the skill:**
   ```bash
   /resolve-cve --cve_id CVE-2025-54798
   ```

2. **Review the generated `tmp/cve-pr-description.md`** for PR-ready content

3. **Test your changes:**
   ```bash
   yarn osd bootstrap
   yarn test:jest  # optional
   ```

4. **Copy `tmp/cve-pr-description.md` content to your PR** - it's formatted and ready!

## 📂 Output Files

After running the skill, look in the `tmp/` directory for:

- **`tmp/cve-pr-description.md`** 📋 - **Main output**: Copy this content into your PR description
- **`tmp/cve-failure-report.md`** ⚠️ - **If resolution fails**: Manual steps and error analysis

> **💡 Tip**: The PR description follows GitHub's template format and includes auto-generated "closes #123" references!

## 📋 Prerequisites

Make sure you have:
- ✅ **Clean working directory** (commit any pending changes)
- ✅ **Yarn installed** (the skill uses `yarn osd bootstrap`)
- ✅ **GitHub access** (for searching CVE issues)
- ✅ **Node.js 20+** (required by OpenSearch Dashboards)

## 📂 File Management

**Important**: The skill automatically cleans `tmp/` files at the start of each run to prevent stale data:

```bash
# These files are removed before generating new reports
rm -f tmp/cve-pr-description.md tmp/cve-failure-report.md
```

**Why this matters**:
- 🚫 **Prevents outdated PR content** - No risk of copying old CVE info
- ✅ **Ensures current data** - Reports always reflect actual dependency state  
- 🎯 **Accurate issue references** - Correct "closes #123" GitHub issue numbers
- 🔄 **Clean slate each run** - No confusion from previous CVE resolution attempts

If you need to preserve previous reports, copy them elsewhere before running the skill again.

## 🔍 How it works

### Step 1: CVE Discovery
- Searches https://github.com/opensearch-project/OpenSearch-Dashboards/issues
- Filters for open issues containing "CVE"
- Extracts vulnerability details (package, versions, severity)

### Step 2: Impact Analysis  
- Checks if vulnerable packages exist in your `package.json`
- Analyzes `yarn.lock` for vulnerable transitive dependencies
- Uses `yarn why <package>` to understand dependency chains

### Step 3: Smart Remediation
The skill tries multiple strategies in order:

**Strategy A: Direct Updates** 
- For packages explicitly in `package.json`
- Updates to safe versions with caret ranges

**Strategy B: Lock File Manipulation**
- For transitive dependencies  
- Removes vulnerable entries, lets yarn regenerate with latest

**Strategy C: Parent Dependency Updates**
- When Strategy B fails due to constraints
- Updates parent dependencies that pull in vulnerable packages  

**Strategy D: Yarn Resolutions** ⭐
- Last resort for stubborn vulnerabilities
- Forces specific safe versions using targeted resolutions
- Example: `"**/selenium-webdriver/tmp": "^0.2.4"`

### Step 4: Validation
- ✅ Runs `yarn osd bootstrap` to ensure build works
- ✅ Checks `yarn audit` to confirm CVE is resolved  
- ✅ Verifies no new vulnerabilities introduced
- ✅ Creates backup files for easy rollback

## 📄 Generated Documentation

The skill creates comprehensive documentation in the `tmp/` directory:

**Primary Output: `tmp/cve-pr-description.md`** - Ready-to-copy PR description following GitHub template format

**Content includes:**

```markdown
### Description

Resolves security vulnerability in project dependencies:
- **CVE-2025-54798** (Low): Vulnerability in tmp package
- **Package**: tmp@0.0.30 → tmp@0.2.5

### Issues Resolved
- closes #10376

## Testing the changes
[CVE-specific verification commands]

## Changelog
- fix: Resolve CVE-2025-54798 in tmp dependency
```

**Failure Reports: `tmp/cve-failure-report.md`** - Detailed analysis if resolution fails

## 🛡️ Safety Features

- **🔙 Automatic backups**: Creates `*.bak` files before any changes
- **🚫 Never breaks builds**: Validates changes before proceeding  
- **📝 Complete audit trail**: Documents every action taken
- **🔄 Easy rollback**: Restore from backups if needed
- **🎯 Targeted fixes**: Uses least invasive resolution strategies

## 🐛 Troubleshooting

### "Unknown skill: resolve-cve"
The skill needs to be in your global skills directory:
```bash
# Check if skill exists
ls ~/.claude/skills/resolve-cve/

# If not, skills may be project-local only
ls .claude/skills/resolve-cve.md
```

### "Build fails after CVE fix"
1. **Restore backups:**
   ```bash
   mv package.json.bak package.json
   mv yarn.lock.bak yarn.lock
   yarn osd bootstrap
   ```

2. **Check `tmp/cve-failure-report.md`** for manual steps required

3. **Try a different strategy** - some CVEs need manual intervention

### "CVE still shows in audit"
- Check if multiple packages have the same vulnerability
- Some audit tools cache results - try `yarn audit --force`
- Verify you're checking the right CVE ID

### "Skill doesn't find CVE issues"  
- Ensure you have internet access for GitHub API calls
- Check if the CVE issue still exists and is open
- Try searching GitHub manually: "repo:opensearch-project/OpenSearch-Dashboards CVE"

## 💡 Pro Tips

1. **Run regularly**: Use `/resolve-cve` weekly to catch new vulnerabilities early

2. **Test thoroughly**: Always run the full test suite after CVE fixes:
   ```bash
   yarn test:jest
   yarn test:jest_integration  
   ```

3. **Review yarn resolutions**: If Strategy D was used, periodically check if resolutions can be removed after dependency updates

4. **Batch related CVEs**: If multiple CVEs affect the same package, fix them together

5. **Keep backups**: The `*.bak` files are your safety net - don't delete them until your PR is merged

## 🔗 Related Commands

```bash
# Check current vulnerabilities
yarn audit --level moderate

# Find why a package is installed  
yarn why <package-name>

# Update all dependencies (careful!)
yarn upgrade-interactive --latest

# Clean build after fixes
yarn osd clean && yarn osd bootstrap
```

## 📞 Getting Help

- **Skill issues**: Check the skill file at `.claude/skills/resolve-cve.md`
- **CVE questions**: Review files in `tmp/` directory (cve-pr-description.md, cve-failure-report.md)
- **Build problems**: See OpenSearch Dashboards troubleshooting in `CLAUDE.md`
- **Security concerns**: Consult with security team before merging CVE fixes

---

**Happy CVE hunting! 🛡️**