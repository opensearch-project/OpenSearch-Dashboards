# `@osd/mfe`

Module Federation (MF) build + runtime for OpenSearch Dashboards UI plugins.

This package turns each UI plugin into an MF **remote**, served from a CDN and
selected at runtime by a **dynamic registry**. A per-request server render then
resolves the registry against the requesting host's dimensions and injects a
flat **boot manifest** that the browser bootstrap consumes to load every plugin
from its resolved CDN URL. It runs alongside the existing `@osd/optimizer`
build; with no MFE flag, OSD behaves exactly as before.

## Overview

The MFE pipeline has three producer/consumer surfaces glued by a single JSON
data document:

| Producer | Middle | Consumer |
|---|---|---|
| `deploy_mfe` CLI (uploads MF remotes to CDN, emits deploy manifest) | The **registry** (`schemaVersion: 1` layered doc) authored via `update_registry` | The `--mfe` server render (resolves the doc → boot manifest → injected HTML) and the browser **bootstrap** (loads remotes) |

Every piece is DATA-driven. Registry edits are hot-reloaded per request; a
version flip is a data change reflected on the next page load — no code
change, no rebuild, no restart.

## Architecture

```
            build-mfe                deploy-mfe              update-registry
  OSD plugins ───────▶ MF remoteEntry ───────▶ CDN (versioned) ───────▶ registry.json
  (Rspack + MF plugin)   per plugin            /mfe/<id>/<hash>/...       (default / rollouts /
                                                                          tenantOverrides + global assets)
                                                                              │
  Browser ◀── injected boot manifest ◀── OSD server (--mfe reads registry) ◀──┘
     │  loads MF remotes from CDN URLs, shares __osdSharedDeps__ singletons
     └─ dev override: ?mfe.<id>=<url>  OR inspector panel  (non-prod only)
```

- **Remotes** — each UI plugin built as an MF container exposing `./public`.
- **Host/shell** — OSD core bootstrap, extended to consume remotes instead of
  local `plugin/<id>/<id>.plugin.js` script tags.
- **Shared singletons** — the existing `__osdSharedDeps__` set (react,
  react-dom, rxjs, lodash, @elastic/eui, @elastic/charts, moment,
  @osd/i18n, styled-components, tslib …) declared MF `shared` so a single
  instance is used across all remotes.

## Key invariants (locked)

1. **No-flag path unchanged.** With no `--mfe`, the served HTML + behavior are
   byte-for-byte identical to a stock OSD. The dual-path CI gate
   (`scripts/ci/mfe_dual_path.sh`) proves this on every PR.
2. **SRI fail-closed.** Every plugin `remoteEntry.js` load carries the
   registry-pinned `integrity` + `crossorigin="anonymous"`. A mismatch fires
   `error` and routes through the env-keyed compat policy:
   non-prod = HARD-BLOCK the page; prod = SKIP the plugin (app boots).
3. **Compat contract.** Every remote records what OSD version + shared-singleton
   ranges it was BUILT AGAINST. At load time a pure classifier compares the
   remote's metadata to the running host and returns `compatible` /
   `incompatible` / `unknown`. The env-keyed policy decides load / skip / block.
4. **Per-failure isolation.** A single failed remote does NOT abort core boot.
   It is registered as a disabled placeholder that satisfies `plugin_reader`
   and shows a friendly status page on direct navigation to `/app/<id>`.
5. **Server-side per-tenant resolution.** The server resolves the layered
   registry document against `{ env, customerId, userBucket }` and injects the
   flat `BootManifest` — the browser makes ZERO `/registry` HTTP fetches on
   the canonical path.
6. **Registry authenticity.** When configured, the on-disk registry document
   is signed (HMAC-SHA256) with a key held in trusted server config. An
   unsigned or mis-signed document is REJECTED at read time (Node) and at
   boot (browser). A tampered CDN registry cannot forge a signature — that
   is the threat this defends against.
7. **The unified schema.** `schemaVersion: 1` is the SINGLE shippable schema.
   There is no older shape on the read path, no migration code.

## Configuration

`opensearchDashboards.mfe.*` server config keys:

| Key | Purpose |
|---|---|
| `enabled` | Turn `--mfe` mode on. Absent/false = old-way OSD unchanged. |
| `registryUrl` | Origin URL of the registry doc (fallback path). |
| `sharedDepsUrl` | URL of the shared-deps entry (`__osdSharedDeps__`). |
| `bootstrapUrl` | URL of the MFE bootstrap bundle (this package). |
| `registryPath` | On-disk path to the registry doc; enables server-side per-tenant resolution + boot-manifest injection. |
| `cdnOrigin` | CDN origin to add to the served CSP `script-src` / `worker-src`. |
| `allowOverride` | Dev URL-override gate. Absent = dev/prod default (dev on, prod off). Explicit boolean wins. |
| `devOverrideOrigins` | Extra origins to allow in the served CSP (dev only). |
| `compat.onIncompatible` | `block` (non-prod default) / `skip` (prod default). |
| `compat.onMissing` | `warn-load` (non-prod default) / `skip` (prod default). |
| `compat.strictShared` | Enforce shared-singleton compat (default `true`). |
| `registrySignature.*` | HMAC key + keyId for registry-authenticity verification. |
| `customerId` | Tenant id used by server-side resolution (default `default`). |
| `userBucket.cookieName` | Cookie name for sticky 0–99 canary bucket. |
| `telemetryEndpoint` | URL for fire-and-forget load-telemetry events (default unset = disabled). |

## Sub-packages

| Sub-package | What it does | README |
|---|---|---|
| `src/registry/` | Registry schema, resolution, authoring CLI, HMAC signing. | `src/registry/README.md` |
| `src/bootstrap/` | Browser boot pipeline: SRI, compat enforcement, degradation, telemetry, inspector. | `src/bootstrap/README.md` |
| `src/deploy/` | CDN publish + deploy-manifest contract for the authoring CLI. | `src/deploy/README.md` |
| `dev/` | Local dev harness: mock origin (`:8080`), `--mfe` runner (`:5602`), verifiers, fixtures. | `dev/README.md` |

## How to use locally

```bash
# One-time setup
source packages/osd-mfe/dev/env.sh

# Build every plugin as an MF remote
node scripts/build_mfe --all

# Launch the local dev origin + --mfe OSD
bash packages/osd-mfe/dev/run_osd_mfe.sh
# :5601 — old-way OSD (regression reference; unchanged)
# :5602 — --mfe OSD (boots from Module Federation remotes)
# :8080 — local origin (serves /registry, /mfe/<id>/*, /shared-deps, /bootstrap)

# Reset when done
bash packages/osd-mfe/dev/reset_env.sh
```

See `dev/README.md` for full harness details, env vars, and troubleshooting.

## How to author a plugin

Every plugin's MF build is driven by the same `packages/osd-mfe/src/mfe_rspack_config.ts`.
The plugin author does not need to write MF config — the build tools do that:

1. **Build** — `node scripts/build_mfe --plugin <id> --dist` produces
   `target/mfe/<id>/remoteEntry.js` and its chunks.
2. **Deploy** — `node scripts/deploy_mfe --plugin <id>` publishes the built
   artifacts to `s3://<bucket>/<prefix>/<id>/<contentHash>/...` at an
   immutable, content-addressed path and emits a deploy manifest.
3. **Register** — `node scripts/update_registry --from-manifest <deploy-manifest>` stamps
   the plugin's entry into the layered registry document (in `default` /
   `rollouts` / `tenantOverrides`). When a signing key is configured, the doc
   is re-signed atomically.

At load time:
- The plugin's `builtAgainst` (OSD version + shared-singleton semver ranges) is
  recorded at generation time from the SAME sources the build uses.
- The plugin's `compat` declaration (min core version + compatible range) is
  computed from `builtAgainst` — defaulting to "same OSD major.minor".
- The runtime classifier compares these to the host and applies the policy.

Rollouts and tenant overrides let a plugin ship a canary version to a bucket
percentage or a specific tenant — see `src/registry/README.md`.

## Testing

- **Unit tests** — `node scripts/jest packages/osd-mfe/`. Tests cover the
  registry (schema, resolver, signing), the bootstrap (SRI, compat,
  degradation, telemetry), and the deploy pipeline (plan, upload semantics,
  manifest contract).
- **Dev verifiers** — under `dev/`: `verify_baseline.js` (baseline HTML),
  `verify_noflag_diff.js` (no-flag invariant), `verify_mfe_render.js`
  (end-to-end MFE render via Playwright), `verify_mfe_coverage.js` (all 58
  plugin remotes reachable).
- **CI gate** — `scripts/ci/mfe_dual_path.sh` runs the four verifiers above,
  wired into `.github/workflows/mfe_dual_path.yml` on every PR. It exits
  non-zero if any check fails, including the no-flag invariant.

## Status / known limitations

- **`HttpRegistryReader`** — the registry-reader interface is designed to swap
  filesystem for HTTP / DynamoDB / S3, but an in-tree production HTTP reader
  is not yet included. `FileRegistryReader` is the reference implementation.
- **Asymmetric registry signing** — the current signing model is symmetric
  HMAC (key held in server config, delivered to the browser by the trusted
  origin). An asymmetric algorithm (browser holds only a public key) is a
  natural next step; the envelope shape (`{ algorithm, keyId, value }`) is
  stable across such an upgrade.
- **Canary bucket cookie** — the default cookie name is
  `_osd_mfe_bucket` and the bucket value is derived from a hash of the
  cookie's value. Integrations that want to use existing tenant/user cookies
  can override via `opensearchDashboards.mfe.userBucket.cookieName`.
