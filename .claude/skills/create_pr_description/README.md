# Create PR Description Skill

Automatically generate comprehensive, template-compliant PR descriptions by analyzing code changes, commit history, and project context. This skill transforms the tedious process of writing PR descriptions into an intelligent, automated workflow.

## Overview

Writing good PR descriptions is time-consuming but critical for code review quality and project documentation. This skill analyzes your changes and generates detailed, structured descriptions that follow your project's PR template, saving time while improving consistency and thoroughness.

## Quick Start

### For Local Changes (Most Common)
```bash
# Analyze your uncommitted changes and generate PR description  
/create_pr_description

# Include detailed code diff analysis
/create_pr_description --include_diff

# Use commit messages for additional context
/create_pr_description --auto_commit_message
```

### For Existing PRs
```bash
# Analyze and improve an existing PR description
/create_pr_description --pr_number 11659

# Generate comprehensive description with full analysis
/create_pr_description --pr_number 11659 --include_diff --auto_commit_message
```

## Features

### 🎯 **Template Compliance**
- Automatically reads `.github/pull_request_template.md`
- Intelligently fills every template section
- Preserves template structure and formatting
- Future-proof against template changes

### 🧠 **Intelligent Analysis** 
- **Change Classification**: Identifies features, bugs fixes, refactoring, breaking changes
- **Impact Assessment**: Determines scope (frontend, backend, core, security)
- **File Categorization**: Separates source code, tests, documentation, config files
- **Context Extraction**: Pulls intent from commit messages and branch names

### 🔗 **Auto-Detection**
- **Issue Linking**: Finds GitHub issues from commits (`fixes #123`) and branch names
- **Test Files**: Identifies new/modified tests and suggests test commands
- **Breaking Changes**: Detects API changes, removed exports, config modifications
- **Security Impact**: Flags auth, permission, and data access changes

### ✅ **Smart Automation**
- **Checklist Completion**: Auto-checks items based on actual changes
- **Changelog Generation**: Creates appropriate changelog entries
- **Testing Recommendations**: Suggests specific test commands and manual steps
- **Review Guidance**: Highlights areas needing special attention

## Use Cases

### 🚀 **New Feature PRs**
Perfect for feature branches that add new functionality:
```bash
# Branch: feat/new-visualization-component
/create_pr_description --auto_commit_message
```
**Generated content includes:**
- Feature overview and capabilities
- UI component documentation  
- Usage examples and API docs
- Comprehensive testing plan

### 🐛 **Bug Fix PRs**
Ideal for bug fixes with clear issue references:
```bash
# Branch: fix/issue-1234-login-redirect  
/create_pr_description --include_diff
```
**Generated content includes:**
- Root cause analysis
- Fix implementation details
- Regression prevention measures
- Specific test cases for the bug

### 🔧 **Refactoring PRs**
Excellent for code cleanup and restructuring:
```bash
/create_pr_description --include_diff --auto_commit_message
```
**Generated content includes:**
- Refactoring motivation and benefits
- Before/after code structure comparison
- Backward compatibility assurance
- Performance impact assessment

### 🔒 **Security PRs** 
Critical for security-related changes:
```bash
/create_pr_description --include_diff
```
**Generated content includes:**
- Security vulnerability details
- Fix implementation approach  
- Security review requirements
- Additional testing recommendations

## Arguments Reference

| Argument | Description | Example |
|----------|-------------|---------|
| `pr_number` | Analyze existing PR instead of local changes | `--pr_number 11659` |
| `include_diff` | Include detailed code diff analysis | `--include_diff` |
| `auto_commit_message` | Use commit messages for context | `--auto_commit_message` |
| `output_file` | Custom output file path | `--output_file my-pr.md` |

## Output Structure

The skill generates a complete PR description with these sections:

### 📋 **Summary Section**
```markdown
## Summary
This PR adds a new data visualization component that enables users to create
interactive bar charts with customizable aggregation options.

### Key Changes  
- Add BarChartVisualization React component with D3.js integration
- Implement data aggregation service for chart data processing
- Create comprehensive test suite covering edge cases and interactions
- Update visualization registry to include new chart type

### Technical Details
The implementation uses a modular architecture with separate concerns for
data processing, rendering, and user interaction...
```

### 🔗 **Issues Resolved**
```markdown
## Issues Resolved
- closes #1234
- fixes #5678  
```

### 🧪 **Testing Plan**
```markdown
## Testing
### Unit Tests
yarn test:jest src/plugins/vis_type_bar_chart/public/components/bar_chart.test.tsx

### Integration Tests  
yarn test:jest_integration test/functional/apps/visualizations/bar_chart.ts

### Manual Testing
1. Navigate to Visualizations → Create new visualization
2. Select "Bar Chart" from visualization types
3. Configure data source and aggregation options
4. Verify chart renders correctly with sample data
5. Test responsive behavior and interaction features
```

### 📝 **Changelog Entry**
```markdown
## Changelog
- [FEATURE] Add interactive bar chart visualization with D3.js integration and customizable aggregation options
```

### ✅ **Smart Checklist**
```markdown
## Checklist
- [x] Added unit tests (12 new test files)
- [x] Updated documentation (README.md, plugin docs)
- [x] Added changelog entry  
- [x] Tested in multiple browsers
- [ ] Requires security review (no security-related changes)
- [x] Breaking changes documented (no breaking changes)
```

## Integration Examples

### Pre-commit Hook Integration
```bash
# Add to .git/hooks/pre-commit
#!/bin/sh
echo "Generating PR description..."
/create_pr_description --auto_commit_message --output_file pr-description.md
echo "✅ PR description ready in pr-description.md"
```

### VS Code Task Integration
```json
{
    "label": "Generate PR Description",
    "type": "shell", 
    "command": "/create_pr_description",
    "args": ["--include_diff", "--auto_commit_message"],
    "group": "build",
    "presentation": {
        "echo": true,
        "reveal": "always"
    }
}
```

### GitHub Actions Integration
```yaml
name: Auto PR Description
on:
  pull_request:
    types: [opened, synchronize]
jobs:
  generate-description:
    if: github.event.pull_request.body == ''
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Generate PR Description
        run: /create_pr_description --pr_number ${{ github.event.number }}
```

## Tips and Best Practices

### 🎯 **Getting the Best Results**

1. **Use descriptive commit messages**: The skill extracts context from commit messages
   ```bash
   git commit -m "feat(visualizations): add interactive bar chart with D3.js integration"
   ```

2. **Follow branch naming conventions**: Branch names provide additional context
   ```bash
   feat/issue-1234-bar-chart-visualization
   fix/login-redirect-bug  
   refactor/data-views-service
   ```

3. **Stage changes thoughtfully**: The skill analyzes staged vs unstaged changes
   ```bash
   git add src/plugins/  # Add main changes
   git add test/         # Add related tests
   # Leave unrelated changes unstaged
   ```

4. **Include issue references**: Link to GitHub issues in commits or branch names
   ```bash
   git commit -m "fix: resolve login redirect issue (closes #1234)"
   ```

### ⚡ **Workflow Optimization**

**Recommended workflow:**
1. Complete your feature/fix development
2. Stage all related changes (`git add` relevant files)
3. Run `/create_pr_description --auto_commit_message --include_diff`
4. Review and customize the generated description
5. Create your PR with the generated description
6. Make final edits if needed

**For large PRs:**
```bash
# Break down analysis by including specific context
/create_pr_description --include_diff --auto_commit_message --output_file detailed-pr.md
```

**For quick fixes:**
```bash
# Generate basic description for simple changes
/create_pr_description
```

## Troubleshooting

### Common Issues

**No changes detected:**
```bash
# Ensure you have staged or committed changes
git status
git add <files>
/create_pr_description
```

**Template not found:**
```bash
# Skill will generate basic structure if no template exists
# Consider adding .github/pull_request_template.md to your project
```

**Output file permissions:**
```bash
# Default output is tmp/pr-description.md (gitignored)
# Use custom path if needed: --output_file my-description.md
```

### Getting Help

- **Skill not working?** Check that you have staged changes or specify a PR number
- **Want different output format?** Customize the output using the generated file as a base
- **Need more context?** Use `--include_diff` and `--auto_commit_message` for maximum detail

## Examples in Action

See the skill in action with these real-world scenarios:

### Example 1: Feature Addition
**Input:** New React component with tests
**Generated:** Comprehensive description with component API docs, usage examples, and testing plan

### Example 2: Bug Fix  
**Input:** Fix for authentication redirect issue
**Generated:** Root cause analysis, fix details, and regression prevention measures

### Example 3: Refactoring
**Input:** Service layer restructuring 
**Generated:** Motivation, architectural changes, and backward compatibility notes

### Example 4: Security Update
**Input:** Fix for session handling vulnerability
**Generated:** Security impact assessment, fix approach, and additional review requirements

---

This skill transforms PR descriptions from an afterthought into a comprehensive, professional documentation process that improves code review quality and project maintainability! 🚀