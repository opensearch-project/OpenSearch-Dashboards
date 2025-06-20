---
name: 🎆 New module request
about: Suggest new core module into OpenSearch Dashboards
title: '[New core modules] <module-name>'
labels: new_module
assignees: ''
---

## Description

Please provide a brief description of the proposed core module and its purpose.

## Module Requirements Checklist
Please answer each question with Yes/No and provide additional context where needed:

- [ ] Is the module solely dependent on minimal-distribution OpenSearch APIs? 
  > *Answer:*

- [ ] Can existing frameworks/plugins achieve the desired functionality?
  > *Answer:*

- [ ] Will the module add new package dependencies to OpenSearch Dashboards?
  > *Answer:* 
  > *If yes, list the dependencies and justify why they are necessary:*

- [ ] Will other core plugins/modules depend on this feature?
  > *Answer:*
  > *If yes, list which ones and explain the dependency:*

- [ ] Will the module affect OpenSearch Dashboards' performance or global styling?
  > *Answer:*
  > *If yes, describe the impact and mitigation strategies:*

- [ ] Does the plugin/module maintain over 80% code coverage?
  > *Answer:*
  > *Current coverage percentage:*

- [ ] Is all code written in TypeScript without type errors?
  > *Answer:*

## Technical Details
Please provide:

- [ ] Module architecture overview
- [ ] API endpoints (if applicable)
- [ ] Data models
- [ ] Integration points with other modules/plugins

## Testing Strategy
Please describe how the module is tested:

- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance tests (if applicable)

## Documentation
- [ ] Developer documentation
- [ ] User documentation (if applicable)

## Additional Information
Please provide any additional information that might help maintainers evaluate this proposal.

---

## Notes (DO NOT CHANGE)
Next Steps:
* Maintainers will review and vote on this request.
* Any vetoes must include a detailed explanation.
* If no vetoes are received within one week, the request will be approved and the issue closed.
* When submitting the new module PR, please reference this issue for background.