---
name: create_pr_description
description: Generate comprehensive PR descriptions by analyzing code changes and adhering to the project's pull request template
arguments:
  - name: pr_number
    description: PR number to analyze. If not provided, will analyze local uncommitted changes
    required: false
  - name: include_diff
    description: Include detailed code diff analysis in the description
    required: false
  - name: auto_commit_message
    description: Use commit messages to enhance context and change explanations
    required: false
  - name: output_file
    description: File path to save the generated PR description (defaults to tmp/pr-description.md)
    required: false
---

# Create PR Description Skill

Generate comprehensive, template-compliant PR descriptions by intelligently analyzing code changes, commit history, and project context. Transforms rushed, incomplete PR descriptions into thorough, reviewer-friendly documentation.

## Usage

```bash
/create_pr_description [--pr_number 123] [--include_diff] [--auto_commit_message] [--output_file path/to/output.md]
```

## Key Features

- **Template Compliance**: Automatically reads and fills `.github/pull_request_template.md`
- **Dual Mode Analysis**: Works with existing PRs or local uncommitted changes
- **Smart Content Generation**: AI-powered analysis of code changes and impact
- **Auto-Issue Detection**: Finds and links related GitHub issues from commits/branch names
- **Testing Recommendations**: Suggests specific test commands based on changed files
- **Changelog Generation**: Creates appropriate changelog entries following project conventions
- **Checklist Intelligence**: Auto-completes checklist items based on actual changes

## Process

### Step 1: Determine Analysis Mode

**If `--pr_number` provided:**
```bash
# Analyze existing PR
gh pr view {pr_number} --json number,title,body,headRefName,baseRefName,files
gh pr diff {pr_number} --name-only
```

**If no PR number (local changes mode):**
```bash
# Analyze local changes
git status --porcelain
git diff --name-only
git diff --staged --name-only
git log --oneline -10  # Recent commit context
```

### Step 2: Load and Parse PR Template

**Read current template dynamically:**
```bash
# Always use current template (future-proof)
template_path=".github/pull_request_template.md"
if [[ -f "$template_path" ]]; then
    # Parse template structure
    # Identify sections: Description, Issues Resolved, Testing, Changelog, etc.
    # Extract placeholders and instructions
fi
```

**Template Section Detection:**
- Parse markdown headers (`## Description`, `## Testing`, etc.)
- Identify comment placeholders (`<!-- Describe your changes -->`)
- Detect checklists (`- [ ] Added unit tests`)
- Extract existing content to preserve manual additions

### Step 3: Analyze Code Changes

**File Analysis:**
```bash
# Categorize changed files
changed_files=()
test_files=()
doc_files=()
config_files=()

for file in $(git diff --name-only); do
    case "$file" in
        *.test.* | *spec.* | cypress/**) test_files+=("$file") ;;
        *.md | docs/**) doc_files+=("$file") ;;
        package.json | yarn.lock | *.config.*) config_files+=("$file") ;;
        *) changed_files+=("$file") ;;
    esac
done
```

**Change Impact Assessment:**
- **Frontend changes**: React components, UI files, stylesheets
- **Backend changes**: Server plugins, APIs, saved objects
- **Core changes**: Platform code, shared utilities
- **Security impact**: Authentication, authorization, data access
- **Breaking changes**: API modifications, config changes, deprecations

### Step 4: Extract Context and Intent

**From Commit Messages (if `--auto_commit_message`):**
```bash
# Get recent commit messages for context
git log --oneline --no-merges -10 --pretty=format:"%s"
# Parse for:
# - Issue references (fixes #123, closes #456)
# - Change type keywords (feat:, fix:, refactor:, etc.)
# - Scope information ((plugin), (core), (ui))
```

**From Branch Names:**
```bash
current_branch=$(git branch --show-current)
# Extract patterns:
# - Issue numbers: feature/issue-123, fix-1234
# - Change type: feat/new-feature, bugfix/auth-error
# - Scope: plugin/data-views, core/saved-objects
```

**From File Content (if `--include_diff`):**
```bash
# Analyze actual code changes
git diff HEAD~1 --unified=3
# Look for:
# - New functions/classes added
# - Deprecated code removed  
# - Configuration changes
# - Test additions/modifications
# - Documentation updates
```

### Step 5: Generate Template Content

**Description Section:**
```markdown
## Summary
{Generated summary based on change analysis}

This PR {change_type} {main_functionality} in {affected_components}.

### Key Changes
- {List of major changes with file context}
- {Impact on existing functionality}
- {New features or capabilities added}

### Technical Details
{Detailed explanation of implementation approach}
```

**Issues Resolved Section:**
```bash
# Auto-extract from commits and branch name
issue_refs=$(git log --grep="fixes\|closes\|resolves" --oneline -10 | grep -oE "#[0-9]+")
branch_issue=$(echo "$current_branch" | grep -oE "[0-9]+")

# Generate closes statements
for issue in $issue_refs; do
    echo "- closes $issue"
done
```

**Testing Section:**
```bash
# Generate test commands based on changed files
if [[ ${#test_files[@]} -gt 0 ]]; then
    echo "### Unit Tests"
    for test_file in "${test_files[@]}"; do
        echo "yarn test:jest $test_file"
    done
fi

if [[ -n $(find . -name "*.cy.ts" -newer HEAD~1) ]]; then
    echo "### Cypress Tests"  
    echo "yarn cypress:run --spec path/to/new/spec.cy.ts"
fi

# Manual testing recommendations
echo "### Manual Testing"
echo "1. Navigate to affected UI components"
echo "2. Verify functionality works as expected"
echo "3. Test edge cases and error conditions"
```

**Changelog Section:**
```bash
# Generate appropriate changelog entry
change_type="FEATURE"  # or FIX, BREAKING, CHORE based on analysis

case "$change_type" in
    "FEATURE") echo "[$change_type] Add {functionality_description}" ;;
    "FIX") echo "[$change_type] Resolve {issue_description}" ;;  
    "BREAKING") echo "[$change_type] Remove deprecated {component_name}" ;;
    "CHORE") echo "[$change_type] Update {dependency/tooling}" ;;
esac
```

**Smart Checklist Completion:**
```bash
# Auto-check based on actual changes
checklist_items=(
    "Added unit tests:${#test_files[@]} -gt 0"
    "Updated documentation:${#doc_files[@]} -gt 0"  
    "Added changelog entry:always_required"
    "Requires security review:security_files_changed"
)

for item in "${checklist_items[@]}"; do
    condition="${item#*:}"
    text="${item%:*}"
    if eval "$condition"; then
        echo "- [x] $text"
    else  
        echo "- [ ] $text"
    fi
done
```

### Step 6: Output Generation

**Create final PR description:**
```bash
output_file="${output_file:-tmp/pr-description.md}"
mkdir -p "$(dirname "$output_file")"

# Clean existing file
rm -f "$output_file"

# Use current template as base
cp .github/pull_request_template.md "$output_file"

# Replace template sections with generated content
# Use intelligent placeholder replacement
sed -i 's/<!-- Describe what this change achieves-->/{generated_description}/g' "$output_file"
sed -i 's/<!-- List any issues this PR will resolve -->/{generated_issues}/g' "$output_file"
# ... continue for all template sections
```

**Success output:**
```bash
echo "✅ PR description generated successfully!"
echo "📄 Output: $output_file"
echo ""
echo "📋 Generated content includes:"
echo "  - Comprehensive change summary"
echo "  - Auto-detected issue references" 
echo "  - Specific testing recommendations"
echo "  - Appropriate changelog entry"
echo "  - Smart checklist completion"
echo ""
echo "📂 Ready to copy-paste into your PR description!"
```

## Advanced Features

### **Intelligent Change Classification:**
- **New Features**: New files, exported functions, UI components
- **Bug Fixes**: Changes to existing logic, error handling additions
- **Refactoring**: Code restructuring without functional changes
- **Breaking Changes**: Removed exports, changed APIs, config modifications
- **Security Updates**: Authentication, authorization, data validation changes

### **Context-Aware Recommendations:**
- **Core Platform Changes**: Recommend additional reviewer assignment
- **Plugin Changes**: Suggest plugin-specific testing
- **UI Changes**: Include screenshot recommendations
- **API Changes**: Highlight backward compatibility impact
- **Database Changes**: Note migration requirements

### **Template Customization:**
- Adapts to any project's PR template format
- Preserves existing template structure and styling
- Maintains project-specific sections and requirements
- Future-proof against template updates

## Error Handling

- **No template found**: Generate basic structured description
- **Git errors**: Fall back to file system analysis
- **Empty changes**: Provide template with guidance prompts
- **Permission issues**: Clear error messages with resolution steps

## Integration Patterns

**Pre-commit hook usage:**
```bash
# Add to .git/hooks/pre-commit
/create_pr_description --auto_commit_message --output_file pr-description.md
echo "PR description ready in pr-description.md"
```

**CI/CD integration:**
```bash
# Auto-generate for draft PRs
if [[ "$PR_STATUS" == "draft" ]]; then
    /create_pr_description --pr_number "$PR_NUMBER" 
fi
```

**Branch naming convention support:**
```bash
# Extract context from standardized branch names
# feat/OSD-123-add-visualization -> Feature for issue OSD-123
# fix/login-redirect-bug -> Bug fix for login redirect
# refactor/data-views-service -> Refactoring data views service
```

This skill transforms the tedious PR description process into an automated, intelligent workflow that produces consistent, high-quality documentation every time! 🚀