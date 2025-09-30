# Contributing and Community Guide

Welcome to the OpenSearch Dashboards community! This guide provides comprehensive information about contributing to the project, engaging with the community, and understanding our development processes.

## Table of Contents

1. [Contribution Guidelines](#contribution-guidelines)
2. [Code Review Process](#code-review-process)
3. [Issue Triage and Bug Reporting](#issue-triage-and-bug-reporting)
4. [Community Resources and Support](#community-resources-and-support)
5. [Release Process and Versioning](#release-process-and-versioning)
6. [Best Practices for Contributors](#best-practices-for-contributors)

## Contribution Guidelines

### Getting Started Contributing

OpenSearch Dashboards welcomes contributions from everyone! Here's how to begin your contribution journey:

#### 1. Set Up Your Development Environment

Before contributing code, you'll need to:

1. **Fork the repository** on GitHub
2. **Clone your fork** locally: `git clone git@github.com:YOUR_USERNAME/OpenSearch-Dashboards.git`
3. **Install dependencies** following the [Developer Guide](../../DEVELOPER_GUIDE.md)
4. **Set up your IDE** with TypeScript/JavaScript support (VSCode recommended)

#### 2. Find Something to Work On

- Browse [open issues](https://github.com/opensearch-project/OpenSearch-Dashboards/issues)
- Look for issues labeled `good first issue` or `help wanted`
- Check the [project roadmap](https://github.com/orgs/opensearch-project/projects) for upcoming features
- Join discussions in [Slack](#slack-channels) or the [forum](#forum)

### Types of Contributions Welcomed

We appreciate all forms of contribution:

#### Code Contributions
- **Bug fixes**: Address existing issues and improve stability
- **Features**: Implement new functionality aligned with project goals
- **Performance improvements**: Optimize code for better efficiency
- **Tests**: Increase test coverage and improve reliability
- **Refactoring**: Improve code structure and maintainability

#### Non-Code Contributions
- **Documentation**: Improve guides, API docs, and examples
- **Issue triage**: Help categorize and validate bug reports
- **Code reviews**: Provide feedback on pull requests
- **Community support**: Answer questions in forums and Slack
- **Design**: Contribute UX/UI improvements and mockups

### Contribution Workflow and Process

Follow this workflow for all contributions:

#### 1. Open an Issue First
**Always start by opening an issue** before making changes. This ensures:
- No duplicate work is being done
- The approach aligns with project direction
- Maintainers can provide early feedback

Exception: Trivial changes like typo fixes can skip this step.

#### 2. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

#### 3. Make Your Changes
- Write clean, well-documented code
- Follow our [code guidelines](../../DEVELOPER_GUIDE.md#code-guidelines)
- Include tests for new functionality
- Update documentation as needed

#### 4. Commit Your Changes
All commits must be signed with a Developer Certificate of Origin (DCO):

```bash
git commit -s -m "Your commit message"
```

The `-s` flag adds the required `Signed-off-by` line automatically.

#### 5. Push and Create a Pull Request
```bash
git push origin feature/your-feature-name
```

Then create a pull request following our [PR template](../../.github/pull_request_template.md).

### Code of Conduct and Community Standards

All contributors must adhere to the [Amazon Open Source Code of Conduct](https://aws.github.io/code-of-conduct):

- **Be respectful**: Treat everyone with respect and consideration
- **Be collaborative**: Work together towards common goals
- **Be inclusive**: Welcome diverse perspectives and backgrounds
- **Be professional**: Maintain professional conduct in all interactions
- **Report violations**: Contact opensource-codeofconduct@amazon.com

## Code Review Process

### Preparing Pull Requests

Create high-quality PRs that are easy to review:

#### PR Checklist
- [ ] **Descriptive title**: Clearly summarize the change
- [ ] **Issue reference**: Link to related issues with `closes #XXXX`
- [ ] **Clear description**: Explain what, why, and how
- [ ] **Tests pass**: All CI checks must be green
- [ ] **Documentation updated**: Include relevant docs changes
- [ ] **Screenshots**: Required for any UI changes
- [ ] **Changelog entry**: Add entry in the PR description
- [ ] **DCO signed**: All commits include `Signed-off-by`

#### PR Size Guidelines
- **Keep PRs focused**: One feature or fix per PR
- **Break large changes**: Split into logical, reviewable chunks
- **Aim for < 500 lines**: Easier to review thoroughly
- **Separate refactoring**: Don't mix with feature changes

### Code Review Best Practices

#### For Authors
1. **Self-review first**: Check your own code before requesting review
2. **Provide context**: Explain design decisions and trade-offs
3. **Be responsive**: Address feedback promptly
4. **Test thoroughly**: Include manual testing steps
5. **Update regularly**: Keep branch up-to-date with main

#### For Reviewers
1. **Be constructive**: Provide actionable, specific feedback
2. **Acknowledge good work**: Positive feedback is valuable
3. **Focus on important issues**: Prioritize functionality over style
4. **Test the changes**: Pull and test locally when possible
5. **Be timely**: Respond to review requests promptly

### Review Criteria and Standards

Pull requests are evaluated on:

#### Required Criteria
- **Functionality**: Does it work as intended?
- **Tests**: Are changes adequately tested?
- **Security**: No vulnerabilities introduced
- **Performance**: No significant regressions
- **Documentation**: User-facing changes documented
- **Code quality**: Follows project standards

#### Additional Considerations
- **Architecture**: Aligns with project design patterns
- **Maintainability**: Code is readable and maintainable
- **Accessibility**: UI changes meet a11y standards
- **Backward compatibility**: Breaking changes clearly noted
- **User experience**: Intuitive and consistent

### Addressing Feedback Effectively

1. **Thank reviewers**: Appreciate the time spent reviewing
2. **Ask for clarification**: Don't hesitate if feedback is unclear
3. **Explain your reasoning**: Discuss trade-offs and constraints
4. **Make requested changes**: Or explain why you disagree
5. **Mark conversations resolved**: Keep PR threads organized
6. **Re-request review**: After addressing all feedback

## Issue Triage and Bug Reporting

### How to Report Bugs Effectively

Good bug reports help us fix issues quickly:

#### Bug Report Template
```markdown
**Describe the bug**
Clear, concise description of the problem

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen instead

**Environment**
- OpenSearch version: X.X.X
- Dashboards version: X.X.X
- OS: [e.g., Ubuntu 20.04]
- Browser: [e.g., Chrome 120]

**Screenshots**
If applicable, add screenshots

**Additional context**
Any other relevant information
```

#### Information to Include
- **Error messages**: Complete stack traces and logs
- **Configuration**: Relevant settings and plugins
- **Sample data**: Minimal reproduction case
- **Workarounds**: Any temporary solutions found
- **Regression info**: Did it work in previous versions?

### Issue Templates and Information Needed

We provide templates for different issue types:

1. **Bug Report**: For reporting defects and errors
2. **Feature Request**: For suggesting new functionality
3. **Documentation**: For docs improvements and gaps

Always provide:
- Specific version numbers
- Complete reproduction steps
- Expected vs. actual behavior
- Environmental details

### Triaging Process for Maintainers

Maintainers follow this process for new issues:

1. **Validate**: Confirm the issue is reproducible
2. **Categorize**: Apply appropriate labels
3. **Prioritize**: Assess severity and impact
4. **Assign**: Route to appropriate team/person
5. **Respond**: Provide initial feedback to reporter

#### Standard Labels
- `bug`: Something isn't working
- `enhancement`: New feature request
- `documentation`: Documentation improvements
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention needed
- `untriaged`: Needs initial review
- Priority labels: `P1` (critical) through `P5` (low)

### Working with the Issue Tracker

#### Search Before Creating
- Check existing issues to avoid duplicates
- Look at closed issues for previous solutions
- Use advanced search with filters and labels

#### Keep Issues Updated
- Add new information as discovered
- Update when workarounds are found
- Close when resolved or no longer relevant

## Community Resources and Support

### Communication Channels

#### Slack Channels
Join our [OpenSearch Slack workspace](https://opensearch.slack.com):

- **#dashboards**: General Dashboards discussion
- **#dashboards-ux**: UX/UI design discussions
- **#general**: Project-wide announcements
- **#development**: Technical development topics

#### Forum
The [OpenSearch Forum](https://forum.opensearch.org/) provides:
- Searchable discussions and solutions
- Technical support from community experts
- Feature discussions and proposals
- OpenSearch Dashboards [specific category](https://forum.opensearch.org/c/opensearch-dashboards/57)

### Community Meetings and Events

#### Developer Office Hours
- **When**: Every other Thursday, 10AM-11AM PT
- **Purpose**: Direct interaction with maintainers
- **Topics**: Technical designs, roadmap, development help
- **How to join**: Sign up in the forum thread

Office hours are ideal for:
- Reviewing proposals and technical designs
- Learning about APIs and extension points
- Discussing roadmap and initiatives
- Getting development guidance

#### Community Meetings
- Monthly community calls for updates and discussions
- Special interest group (SIG) meetings
- Conference talks and workshops
- Check the [events calendar](https://opensearch.org/events)

### Getting Help and Asking Questions

#### Where to Get Help
1. **Documentation**: Start with [official docs](https://opensearch.org/docs/latest/dashboards/)
2. **Forum**: Search existing discussions or ask new questions
3. **Slack**: Real-time help from community members
4. **GitHub Discussions**: Project-specific Q&A
5. **Stack Overflow**: Tag questions with `opensearch-dashboards`

#### How to Ask Good Questions
1. **Search first**: Check if already answered
2. **Be specific**: Include versions, errors, and context
3. **Show effort**: Explain what you've tried
4. **Provide examples**: Include code snippets or configs
5. **Follow up**: Update with solutions for others

### Finding Mentorship and Guidance

#### For New Contributors
- Look for issues labeled `good first issue`
- Join #dashboards-newbies Slack channel
- Attend Developer Office Hours
- Find a mentor through the forum

#### Mentorship Opportunities
- **Pair programming**: Work with experienced contributors
- **Code reviews**: Learn from feedback on your PRs
- **Documentation**: Start with docs to understand the codebase
- **Testing**: Help with test coverage to learn the system

## Release Process and Versioning

### Understanding the Release Cycle

OpenSearch Dashboards follows a predictable release schedule:

#### Release Cadence
- **Major releases**: Annually (X.0.0)
- **Minor releases**: Every 6-8 weeks (X.Y.0)
- **Patch releases**: As needed for critical fixes (X.Y.Z)

#### Release Phases
1. **Development**: Active feature development
2. **Code freeze**: No new features, only bug fixes
3. **Release candidate**: Testing and stabilization
4. **General availability**: Official release

### Version Compatibility and Breaking Changes

#### Compatibility Matrix
OpenSearch Dashboards versions are compatible with corresponding OpenSearch versions:

| Dashboards Version | OpenSearch Version | Notes |
|-------------------|-------------------|--------|
| 2.x.x | 2.x.x | Must match minor version |
| 1.x.x | 1.x.x | Legacy versions |

#### Breaking Changes Policy
- Documented in CHANGELOG and release notes
- Deprecated features warned one version ahead
- Migration guides provided for major changes
- Backward compatibility maintained in minor releases

### Contributing to Releases

#### How to Contribute
1. **Feature development**: Complete features before code freeze
2. **Bug fixes**: Priority during stabilization phase
3. **Testing**: Help test release candidates
4. **Documentation**: Update docs for new features
5. **Release notes**: Contribute changelog entries

#### Changelog Entries
Add changelog entries in your PR description:

```markdown
## Changelog
- feat: Add new visualization type
- fix: Resolve data table sorting issue
- docs: Update plugin development guide
```

Entry types:
- `breaking`: Breaking changes
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation
- `test`: Testing improvements
- `refactor`: Code refactoring
- `chore`: Maintenance tasks

### Beta Testing and Feedback

#### Participating in Beta Testing
1. **Install beta versions**: Test in non-production environments
2. **Report issues**: File detailed bug reports
3. **Provide feedback**: Share user experience insights
4. **Test migrations**: Verify upgrade paths work
5. **Validate fixes**: Confirm issues are resolved

#### Beta Testing Best Practices
- Use realistic data and workflows
- Test plugin compatibility
- Check performance characteristics
- Verify security features
- Document any regressions

## Best Practices for Contributors

### Tips for New Contributors

#### Getting Started Successfully
1. **Start small**: Pick simple issues initially
2. **Read the docs**: Understand project structure
3. **Ask questions**: Don't hesitate to seek help
4. **Join the community**: Participate in discussions
5. **Be patient**: Learning takes time

#### Common Pitfalls to Avoid
- Opening PRs without issues
- Making too many changes at once
- Ignoring CI failures
- Not testing thoroughly
- Forgetting DCO sign-off

### Effective Community Participation

#### Building Reputation
1. **Be consistent**: Regular, quality contributions
2. **Help others**: Answer questions and review PRs
3. **Share knowledge**: Write blog posts or tutorials
4. **Be professional**: Maintain high standards
5. **Stay positive**: Encourage and support others

#### Communication Guidelines
- **Be clear**: Use precise language
- **Be concise**: Respect others' time
- **Be respectful**: Assume good intentions
- **Be patient**: Allow time for responses
- **Be grateful**: Acknowledge help received

### Long-term Contribution Strategies

#### Growing as a Contributor
1. **Expand scope**: Take on larger features
2. **Mentor others**: Help new contributors
3. **Specialize**: Become expert in specific areas
4. **Lead initiatives**: Propose and drive improvements
5. **Join maintainership**: Work towards becoming a maintainer

#### Maintaining Motivation
- Set realistic goals
- Celebrate achievements
- Take breaks when needed
- Focus on impact
- Connect with community

## Additional Resources

### Important Links
- [OpenSearch Dashboards Repository](https://github.com/opensearch-project/OpenSearch-Dashboards)
- [Contributing Guide](../../CONTRIBUTING.md)
- [Developer Guide](../../DEVELOPER_GUIDE.md)
- [Code of Conduct](../../CODE_OF_CONDUCT.md)
- [Maintainers List](../../MAINTAINERS.md)
- [Communications Guide](../../COMMUNICATIONS.md)

### External Resources
- [OpenSearch Documentation](https://opensearch.org/docs/latest/)
- [OpenSearch Blog](https://opensearch.org/blog/)
- [OpenSearch YouTube Channel](https://www.youtube.com/c/OpenSearchProject)
- [OpenSearch Twitter](https://twitter.com/OpenSearchProj)

### Getting Further Help
If you need additional assistance:
1. Post in the [forum](https://forum.opensearch.org/)
2. Ask in [Slack](https://opensearch.slack.com)
3. Attend [Developer Office Hours](#developer-office-hours)
4. Contact maintainers directly (for urgent issues)

---

Thank you for contributing to OpenSearch Dashboards! Your participation helps make this project successful and benefits the entire community.