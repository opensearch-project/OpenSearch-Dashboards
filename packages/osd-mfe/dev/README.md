# `packages/osd-mfe/dev/` — local development harness for OSD MFE mode

This directory contains scripts, fixtures, and examples for running OSD with
Module Federation (`--mfe`) locally. It is the **executable companion to
`packages/osd-mfe/src/`** — the production code lives in `src/`, and `dev/`
contains everything you need to exercise it end-to-end on your machine or in
CI without any cloud dependencies.

The contents of `dev/` are **excluded from the published npm package**; only
`src/` ships. See `packages/osd-mfe/package.json` `"files"` field.

---

## What's here

```
dev/
├── README.md                          ← you are here
├── env.example.sh                     ← env var template; copy to env.local.sh
├── run_osd_mfe.sh                     ← the main harness entrypoint
├── local_registry_server.js           ← serves /registry, /shared-deps, /bootstrap, /mfe/*
├── local_asset_server.js              ← serves built MFE plugin artifacts
├── build_bootstrap.js                 ← builds the mfe-bootstrap browser bundle
├── reset_env.sh                       ← stops local-origin processes (cleanup)
├── env.sh                             ← shared shell env helpers used by the scripts
│
├── fixtures/
│   └── registry.example.json          ← sample v3 registry showing 3 plugins
│
├── examples/
│   └── mock_lotus_registry_reader.js  ← teaching example: custom RegistryReader
│
└── (integration tests at the top level — see below)
    verify_baseline.js                 ← no-flag :5601 sanity (8 core pages)
    verify_mfe_render.js               ← --mfe :5602 boot test (remoteEntry served from origin)
    verify_mfe_coverage.js             ← coverage smoke: all pages + all remotes reachable
    verify_noflag_diff.js              ← no-flag HTML byte-identical to reference
```

---

## Quick start — run OSD locally in MFE mode

```bash
# 1. Build OSD as usual (one time)
cd OpenSearch-Dashboards
yarn osd bootstrap

# 2. Build the MFE remotes (one time, ~5-10 min for all 58 plugins)
node scripts/build_mfe --all

# 3. Optionally copy the env template and edit it
cp packages/osd-mfe/dev/env.example.sh packages/osd-mfe/dev/env.local.sh
$EDITOR packages/osd-mfe/dev/env.local.sh

# 4. Launch (starts local-registry-server :8080 + OSD --mfe :5602)
bash packages/osd-mfe/dev/run_osd_mfe.sh

# 5. Open http://localhost:5602/ in a browser
```

Old-way OSD on `:5601` (no `--mfe`) is untouched and runs alongside — that's
your reference for "this should be byte-for-byte identical with the no-flag
path."

---

## Architecture in one diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ Browser                                                             │
│   ↓ http://localhost:5602/app/home (or any OSD page)                │
└─────────────────────┬───────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────────────┐
│ OSD on :5602  (`opensearchDashboards.mfe.enabled: true`)            │
│                                                                     │
│ Server-side: reads registry from configured RegistryReader          │
│              (by default, fetches GET http://localhost:8080/registry)│
│ Renders HTML with CSP allow-listing :8080 + any configured CDN(s)   │
└─────────────────────┬───────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Local origin :8080  (this harness: dev/local_registry_server.js)    │
│                                                                     │
│  GET /registry            → registry.example.json (or your real one)│
│  GET /bootstrap/...       → the OSD MFE bootstrap bundle            │
│  GET /shared-deps/...     → osd-ui-shared-deps.js + .css            │
│  GET /mfe/<id>/<hash>/... → per-plugin remoteEntry.js + chunks      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Environment variables (read by `run_osd_mfe.sh`)

See `env.example.sh` for the full annotated list. The most common:

| Variable | Purpose | Default |
|---|---|---|
| `ORIGIN_PORT` | Local origin HTTP port | `8080` |
| `MFE_PORT` | OSD `--mfe` instance port | `5602` |
| `CDN_BASE_URL` | External CDN base URL (added to CSP `cdnOrigin`) | `''` (local only) |
| `MFE_DEV_OVERRIDE_ORIGINS` | Extra origins for CSP allow-list (comma-sep). Honored only when `allowOverride=true` (dev default). | `''` |
| `MFE_REGISTRY_PATH` | Path to registry.json served at `/registry` | `dev/fixtures/registry.example.json` |
| `MFE_COMPAT_ON_INCOMPATIBLE` | Compat policy override (`block` \| `skip`) | dev default: `block` |
| `MFE_COMPAT_ON_MISSING` | Compat policy override (`warn-load` \| `skip`) | dev default: `warn-load` |
| `MFE_ALLOW_OVERRIDE` | URL-override gate (`true` \| `false`) | dev default: `true` |
| `MFE_CUSTOMER_ID` | Tenant id for Phase 13 routing | `default` |
| `MFE_USER_BUCKET_COOKIE_NAME` | Sticky bucket cookie name | `_osd_mfe_bucket` |
| `MFE_TELEMETRY_ENDPOINT` | URL for Phase 14 Beacon events | unset (disabled) |
| `FORCE_RESTART` | Kill existing `:5602` process before launching | `0` |

---

## How the harness wires up

`run_osd_mfe.sh` is the orchestrator. On each invocation it:

1. **Sources** `env.sh` (shared shell helpers) and your `env.local.sh` if present.
2. **Builds** the OSD MFE bootstrap bundle via `build_bootstrap.js`.
3. **Starts** `local_registry_server.js` on `$ORIGIN_PORT` (default 8080).
4. **Writes** a generated MFE config to `/tmp/osd_mfe_${MFE_PORT}.yml` from
   the env vars above. This is the `-c` config passed to OSD.
5. **Launches** OSD with `--mfe` and the generated config, in background,
   pidfile at `/tmp/osd_mfe_${MFE_PORT}.pid`.
6. **Polls** the HTTP health endpoint until OSD is ready (or times out).

Re-running with `FORCE_RESTART=1` stops the existing `:5602` and relaunches.

---

## CI integration

This harness is the source-of-truth for two CI gates that run on every PR:

- **`scripts/ci/mfe_dual_path.sh`** — runs `verify_baseline.js`,
  `verify_noflag_diff.js`, `verify_mfe_render.js`, `verify_mfe_coverage.js`.
  Credential-free; no cloud dependencies. Exits non-zero if any check fails.
- **`scripts/ci/mfe_smoke.sh`** — runs a small Cypress smoke subset against
  `:5602` to confirm core apps boot end-to-end through MF.

The CI workflow `.github/workflows/mfe_dual_path.yml` invokes both. Both
wrapper scripts derive `HARNESS_DIR` from their own location and resolve to
this `packages/osd-mfe/dev/` directory.

---

## Adding a custom RegistryReader

The default `FileRegistryReader` reads from disk. If you want to plug in a
different backend (corporate registry service, S3, in-memory generator, …),
implement the `RegistryReader` interface from `packages/osd-mfe/src/registry/`.

See `examples/mock_lotus_registry_reader.js` for a worked example that:
1. Wraps an external registry client (mocked, in-process — substitute your real one).
2. Maps the external schema → OSD's BootManifest shape.
3. Returns a manifest that OSD can boot from unchanged.

Run it standalone to see the output:

```bash
node packages/osd-mfe/dev/examples/mock_lotus_registry_reader.js
```

In a real integration, your custom reader is a small Amazon-internal (or
team-internal) wrapper package; OSD's `packages/osd-mfe/src/` does not need
changes.

---

## Cleaning up

```bash
bash packages/osd-mfe/dev/reset_env.sh
```

Stops the local origin and any harness-managed processes. Leaves `:5601`
(old-way OSD) and `:9200` (OpenSearch) running.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `:5602` doesn't start | Build artifacts missing | Run `node scripts/build_mfe --all` first |
| CSP error in browser for some CDN origin | Origin not allow-listed | Set `CDN_BASE_URL` or `MFE_DEV_OVERRIDE_ORIGINS` |
| SRI mismatch | registry's `integrity` doesn't match served bytes | Rebuild the plugin and regenerate the registry; or remove `integrity` for a quick dev workaround |
| `EADDRINUSE :8080` | Previous origin still running | `bash dev/reset_env.sh` |
| `:5602` stale (config change not reflected) | OSD config is read at startup | Re-run with `FORCE_RESTART=1` |

---

## Where to read next

- **Architecture overview**: `docs/01-MFE-DESIGN.md` in the repo root.
- **Production source**: `packages/osd-mfe/src/` (registry, bootstrap, deploy).
- **Phase results**: `docs/02-PHASE1-RESULTS.md` ... `docs/19-PHASE16-RESULTS.md`
  walk through the architecture's design + verification phase by phase.
