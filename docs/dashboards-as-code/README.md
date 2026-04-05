# Dashboards-as-Code

Dashboards-as-Code (DaC) lets you define, validate, version-control, and deploy OpenSearch Dashboards resources programmatically using TypeScript, a CLI, and CI/CD pipelines.

## Overview

Instead of clicking through the UI, you write dashboard definitions in code:

```typescript
import { Dashboard, Panel, Query } from '@osd/dashboards-sdk';

const dashboard = Dashboard.create('prod-monitoring')
  .title('Production Monitoring')
  .labels({ team: 'platform', env: 'production' })
  .addPanel(
    Panel.create('error-rate')
      .title('Error Rate')
      .visualization('line')
      .gridPosition({ x: 0, y: 0, w: 24, h: 12 })
      .query(Query.dql('level: error'))
  );

console.log(JSON.stringify(dashboard.build(), null, 2));
```

Then use the CLI to build, validate, diff, and deploy:

```bash
osdctl build -d ./dashboards -o ./output
osdctl validate -d ./output
osdctl diff -d ./output --server https://localhost:5601
osdctl apply -d ./output --server https://localhost:5601
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Resource** | A saved object (dashboard, visualization, index pattern, search) expressed as JSON/YAML |
| **SDK** | TypeScript builder library for constructing resources programmatically |
| **CLI (`osdctl`)** | Command-line tool for build/validate/diff/apply/pull/lint workflows |
| **Managed lock** | Objects deployed via `_bulk_apply` are tagged `managed-by: osdctl` and protected from UI edits |
| **Schema registry** | Server-side JSON Schemas for each resource type, accessible via `GET /_schemas` |

## Documentation

- [Getting Started](getting-started.md) - Set up your first DaC project
- [CLI Reference](cli-reference.md) - All `osdctl` commands and options
- [SDK Reference](sdk-reference.md) - TypeScript SDK builders and types
- [API Reference](api-reference.md) - Server-side DaC API endpoints
- [Managed Objects](managed-objects.md) - How code-managed object locking works
- [CI/CD Integration](cicd-integration.md) - GitHub Actions and pipeline examples
