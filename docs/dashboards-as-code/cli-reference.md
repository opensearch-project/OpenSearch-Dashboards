# CLI Reference

`osdctl` is the command-line tool for Dashboards-as-Code workflows.

## Global Options

| Option | Description |
|--------|-------------|
| `--server <url>` | OpenSearch Dashboards server URL |
| `--profile <name>` | Configuration profile from `~/.osdctl/config.yaml` |
| `--format <json\|yaml>` | Output format (default: `json`) |

---

## `osdctl init`

Scaffold a new DaC project.

```bash
osdctl init --directory <path> [--language <lang>]
```

| Option | Default | Description |
|--------|---------|-------------|
| `--directory, -d` | `.` | Project directory |
| `--language` | `typescript` | Language template (`typescript`, `python`*, `go`*, `java`*) |

\* Python, Go, and Java scaffolding coming soon.

**Creates:** `package.json`, `tsconfig.json`, `.osdctl.yaml`, example dashboard file.

---

## `osdctl build`

Compile TypeScript/JavaScript dashboard definitions to JSON/YAML.

```bash
osdctl build -d <dir> -o <output-dir> [--format <json|yaml>]
```

| Option | Default | Description |
|--------|---------|-------------|
| `-d, --directory` | `.` | Source directory with `.ts`/`.js` files |
| `-f, --file` | | Single file to build |
| `-o, --output` | `./output` | Output directory for compiled files |
| `--format` | `json` | Output format |
| `--stdout` | `false` | Write to stdout instead of files |

**How it works:** Executes each source file via `npx tsx`. The file must write JSON to stdout (e.g., `console.log(JSON.stringify(dashboard.build(), null, 2))`).

---

## `osdctl validate`

Validate built resource files against JSON Schemas.

```bash
osdctl validate -d <dir> [--server <url>]
```

| Option | Default | Description |
|--------|---------|-------------|
| `-d, --directory` | `.` | Directory of JSON/YAML resource files |
| `--server` | | Server URL for full validation (reference checks) |

**Modes:**
- **Local only** (no `--server`): Validates against bundled JSON Schemas
- **Full** (with `--server`): Also checks that referenced objects exist on the server

**Exit codes:** `0` = valid, `1` = validation errors found.

---

## `osdctl diff`

Compare local definitions against deployed state.

```bash
osdctl diff -d <dir> --server <url>
```

| Option | Default | Description |
|--------|---------|-------------|
| `-d, --directory` | `.` | Directory of resource files |
| `--server` | *required* | Server URL |

**Output:** Colorized diff showing additions, removals, and changes per resource.

**Exit codes:**
- `0` — No differences (in sync)
- `1` — Error
- `2` — Drift detected (differences found)

---

## `osdctl apply`

Deploy resource definitions to a running instance.

```bash
osdctl apply -d <dir> --server <url> [--dry-run] [--confirm]
```

| Option | Default | Description |
|--------|---------|-------------|
| `-d, --directory` | `.` | Directory of resource files |
| `--server` | *required* | Server URL |
| `--dry-run` | `false` | Validate without persisting |
| `--confirm` | `false` | Skip confirmation prompt |

**Behavior:**
- Calls `POST /api/saved_objects/_bulk_apply` with all resources
- Resolves dependencies automatically (topological sort)
- Tags deployed objects with `managed-by: osdctl` label
- Reports per-resource status: `created`, `updated`, `unchanged`, `error`

---

## `osdctl pull`

Export saved objects from a running instance to files.

```bash
osdctl pull --server <url> -o <dir> [--label <key=value>] [--format <json|yaml>]
```

| Option | Default | Description |
|--------|---------|-------------|
| `--server` | *required* | Server URL |
| `-o, --output` | `./pulled` | Output directory |
| `--format` | `json` | Output format |
| `--label` | | Filter by label (e.g., `team=platform`) |
| `--per-page` | `100` | Pagination size |

**Output:** Deterministic, sorted-key files suitable for version control.

---

## `osdctl lint`

Check dashboards against configurable policy rules.

```bash
osdctl lint -d <dir> [--config <path>]
```

| Option | Default | Description |
|--------|---------|-------------|
| `-d, --directory` | `.` | Directory of resource files |
| `--config` | `.osdctl.yaml` | Lint configuration file |

**Built-in rules:**

| Rule | Description |
|------|-------------|
| `require-labels` | Objects must have specific labels |
| `require-annotations` | Objects must have specific annotations |
| `require-description` | Objects should have a description field |
| `max-panels` | Limit the number of panels per dashboard |
| `naming-convention` | ID must match a regex pattern |

**Configuration** (in `.osdctl.yaml`):

```yaml
lint:
  rules:
    require-labels:
      severity: error
      labels: [team, env]
    max-panels:
      severity: warning
      max: 30
    naming-convention:
      severity: error
      pattern: "^[a-z][a-z0-9-]+$"
```

---

## `osdctl preview`

> Coming soon. Ephemeral dashboard testing without persisting to the index.
