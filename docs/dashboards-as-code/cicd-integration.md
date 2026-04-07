# CI/CD Integration

Dashboards-as-Code is designed for pipeline automation. This page shows how to integrate `osdctl` into common CI/CD systems.

## GitHub Actions

### Validate on Pull Request

```yaml
name: Validate Dashboards
on:
  pull_request:
    paths:
      - 'dashboards/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build definitions
        run: npx osdctl build -d ./dashboards -o ./output

      - name: Validate schemas
        run: npx osdctl validate -d ./output

      - name: Lint policies
        run: npx osdctl lint -d ./output
```

### Deploy on Merge to Main

```yaml
name: Deploy Dashboards
on:
  push:
    branches: [main]
    paths:
      - 'dashboards/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npx osdctl build -d ./dashboards -o ./output

      - name: Validate
        run: npx osdctl validate -d ./output --server ${{ secrets.OSD_URL }}

      - name: Diff (preview)
        run: npx osdctl diff -d ./output --server ${{ secrets.OSD_URL }}

      - name: Apply
        run: npx osdctl apply -d ./output --server ${{ secrets.OSD_URL }} --confirm
        env:
          OSD_TOKEN: ${{ secrets.OSD_TOKEN }}
```

### Drift Detection (Scheduled)

```yaml
name: Drift Detection
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  check-drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install & build
        run: npm ci && npx osdctl build -d ./dashboards -o ./output

      - name: Check for drift
        id: drift
        run: |
          npx osdctl diff -d ./output --server ${{ secrets.OSD_URL }}
          echo "exit_code=$?" >> $GITHUB_OUTPUT
        continue-on-error: true

      - name: Alert on drift
        if: steps.drift.outputs.exit_code == '2'
        run: |
          echo "::warning::Dashboard drift detected! Someone may have edited managed objects through the UI."
```

## GitLab CI

```yaml
stages:
  - validate
  - deploy

validate:
  stage: validate
  image: node:18
  script:
    - npm ci
    - npx osdctl build -d ./dashboards -o ./output
    - npx osdctl validate -d ./output
    - npx osdctl lint -d ./output
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      changes:
        - dashboards/**

deploy:
  stage: deploy
  image: node:18
  script:
    - npm ci
    - npx osdctl build -d ./dashboards -o ./output
    - npx osdctl diff -d ./output --server $OSD_URL
    - npx osdctl apply -d ./output --server $OSD_URL --confirm
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      changes:
        - dashboards/**
  environment:
    name: production
```

## Generic Pipeline Script

For Jenkins, Azure DevOps, or custom pipelines:

```bash
#!/bin/bash
set -euo pipefail

# Build
npx osdctl build -d ./dashboards -o ./output

# Validate locally
npx osdctl validate -d ./output

# Lint
npx osdctl lint -d ./output

# Diff (fail on drift if in deploy mode)
npx osdctl diff -d ./output --server "$OSD_URL"
DIFF_EXIT=$?

if [ "$DIFF_EXIT" -eq 2 ]; then
  echo "Changes detected, deploying..."
  npx osdctl apply -d ./output --server "$OSD_URL" --confirm
elif [ "$DIFF_EXIT" -eq 0 ]; then
  echo "No changes to deploy."
else
  echo "Error during diff"
  exit 1
fi
```

## Best Practices

1. **Validate in PRs, deploy on merge.** Never deploy from feature branches.
2. **Use `--dry-run` in staging** before applying to production.
3. **Set up drift detection** to catch manual UI edits on managed objects.
4. **Store credentials in secrets**, never in code. Use `token_command` with vault integrations.
5. **Pin `osdctl` version** in your pipeline to avoid unexpected behavior from updates.
