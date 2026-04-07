# Getting Started

This guide walks you through creating your first Dashboards-as-Code project.

## Prerequisites

- Node.js 18+
- A running OpenSearch Dashboards instance (for deploy/pull commands)
- `osdctl` CLI (bundled in `packages/osd-cli`)

## 1. Initialize a Project

```bash
osdctl init --directory my-dashboards --language typescript
```

This creates:

```
my-dashboards/
  package.json
  tsconfig.json
  .osdctl.yaml
  dashboards/
    example.ts
```

## 2. Define a Dashboard

Edit `dashboards/example.ts`:

```typescript
import { Dashboard, Panel, Query } from '@osd/dashboards-sdk';

const dashboard = Dashboard.create('web-traffic')
  .title('Web Traffic Overview')
  .description('Real-time web traffic metrics')
  .labels({ team: 'frontend', env: 'production' })
  .timeRange('now-24h', 'now')
  .refreshInterval('30s')
  .addPanel(
    Panel.create('requests-per-minute')
      .title('Requests per Minute')
      .visualization('line')
      .gridPosition({ x: 0, y: 0, w: 24, h: 12 })
      .query(Query.ppl('source = access_logs | stats count() by span(timestamp, 1m)'))
  )
  .addPanel(
    Panel.create('status-codes')
      .title('HTTP Status Codes')
      .visualization('bar')
      .gridPosition({ x: 0, y: 12, w: 12, h: 8 })
      .query(Query.ppl('source = access_logs | stats count() by status'))
  )
  .addPanel(
    Panel.create('error-rate')
      .title('Error Rate')
      .visualization('metric')
      .gridPosition({ x: 12, y: 12, w: 12, h: 8 })
      .query(Query.dql('status >= 500'))
  );

console.log(JSON.stringify(dashboard.build(), null, 2));
```

## 3. Build

Compile TypeScript definitions to JSON:

```bash
osdctl build -d ./dashboards -o ./output
```

This runs each `.ts` file through `tsx` and writes the JSON output to `./output/`.

## 4. Validate

Check the built files against JSON Schemas locally (no server needed):

```bash
osdctl validate -d ./output
```

For full validation including reference checks against a running server:

```bash
osdctl validate -d ./output --server https://localhost:5601
```

## 5. Preview Changes

See what would change before deploying:

```bash
osdctl diff -d ./output --server https://localhost:5601
```

Exit codes: `0` = no changes, `1` = error, `2` = drift detected.

## 6. Deploy

Apply definitions to a running instance:

```bash
osdctl apply -d ./output --server https://localhost:5601
```

Add `--dry-run` for a safe preview without persistence:

```bash
osdctl apply -d ./output --server https://localhost:5601 --dry-run
```

## 7. Pull Existing Dashboards

Export dashboards from a running instance to version-controlled files:

```bash
osdctl pull --server https://localhost:5601 -o ./imported --format yaml
```

Filter by label:

```bash
osdctl pull --server https://localhost:5601 --label team=platform -o ./imported
```

## Configuration

Create `~/.osdctl/config.yaml` for authentication profiles:

```yaml
profiles:
  dev:
    server: https://dev-dashboards.example.com:5601
    auth:
      type: basic
      username: admin
      password_env: OSD_DEV_PASSWORD
  prod:
    server: https://prod-dashboards.example.com:5601
    auth:
      type: token
      token_command: "vault read -field=token secret/osd-prod"
```

Use profiles with any command:

```bash
osdctl apply -d ./output --profile prod
```

## Next Steps

- [CLI Reference](cli-reference.md) - All commands and flags
- [SDK Reference](sdk-reference.md) - Builder API details
- [Managed Objects](managed-objects.md) - Understanding code-managed locking
- [CI/CD Integration](cicd-integration.md) - Automate with GitHub Actions
