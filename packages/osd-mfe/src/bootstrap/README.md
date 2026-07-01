# `@osd/mfe` — Bootstrap subsystem

The **bootstrap** is the browser-side entry point in `--mfe` mode. It orchestrates
the fixed sequence from shell → shared-deps → registry/boot-manifest → per-remote
loading → core boot → optional inspector. Every micro-frontend is loaded here;
compatibility, SRI, override, telemetry, and degradation policy all funnel through
this pipeline.

See `packages/osd-mfe/README.md` for the package-level design and
`packages/osd-mfe/src/registry/README.md` for the schema this consumes.

## The load pipeline

`bootstrapMfe(options)` in `bootstrap_mfe.ts` runs a strict sequence. Module
Federation is async, but `plugin_reader.ts` reads `window.__osdBundles__`
SYNCHRONOUSLY during `CoreSystem.start()`, so every remote must be registered
BEFORE core boot:

1. **Arm the chunk-error surface** — global `unhandledrejection` +
   capture-phase `error` listeners catch post-boot lazy chunk integrity failures.
2. **Load registry-managed core** (optional) — when advertised, `core.entry.js`
   loads from the CDN URL with SRI. Fail-closed: a tampered core rejects the
   whole boot Promise (`invokeCoreBootstrap` is never called).
3. **Load shared-deps** — pre-load dependency chunks in order, then load
   `sharedDepsUrl` which assigns `window.__osdSharedDeps__`. Seed the MF share
   scope from those globals (react, react-dom, lodash, ... as singletons).
4. **Get the registry** — canonical path: consume the server-injected
   `bootManifest` directly (ZERO `/registry` HTTP fetches). Legacy fallback:
   fetch `registryUrl` + verify HMAC signature.
5. **Compat enforcement** — classify each remote against `options.host`; apply
   the env-keyed policy (block / skip / warn-load). Offenders hit the
   compat block page; skipped remotes get a disabled-plugin placeholder.
6. **Load each remote in parallel** (`Promise.allSettled`) — inject `<script>`
   with `integrity` + `crossorigin="anonymous"`, get the container, seed its
   share scope, resolve the `./public` factory. Successes register into
   `__osdBundles__`; failures emit telemetry and become disabled placeholders.
7. **Invoke core boot** — with every plugin factory (real or degraded) present,
   `plugin_reader.read()` resolves synchronously and OSD starts.
8. **Mount inspector** (dev-only, opt-in via `?inspect=true`) — displays each
   plugin's source + a "Disabled plugins" section.

## SRI enforcement (fail-closed)

Every `remoteEntry.js` load carries `integrity` (from the registry) +
`crossorigin="anonymous"`. A mismatch fires `error` (not `load`), rejecting the
per-remote load. The bootstrap routes that failure through the env-keyed policy:

- **non-prod (`onIncompatible: 'block'`)** — HARD-BLOCK: the compat block page
  is rendered, core is NOT booted. Never run half-verified code.
- **prod (`onIncompatible: 'skip'`)** — SKIP: the remote gets a disabled
  placeholder, the app still boots from the rest.

Post-boot lazy chunk SRI failures are caught by `chunk_error_surface.ts` and
surfaced as a dismissible error banner + telemetry — they can't page-block
because the app is already mounted.

## Compat policy (block / skip)

`compat_policy.ts` resolves the env-keyed matrix from server config:

| Case | non-prod default | prod default |
|---|---|---|
| INCOMPATIBLE (known mismatch) | `block` (page-level) | `skip` (per-plugin) |
| MISSING/UNKNOWN metadata | `warn-load` (log + load) | `skip` |
| SHARED SINGLETON mismatch | Same as INCOMPATIBLE | Same as INCOMPATIBLE |

`compat_enforcement.ts` maps each classifier verdict to load / skip / offender
as a pure `CompatDecision` the bootstrap acts on.

## Visible degradation UX

The silent-disable placeholder (which satisfies `plugin_reader.read()`) is
enriched with two surfaces:

1. **Degraded app stub** — `application.register` with `navLinkStatus: hidden`,
   so direct navigation to `/app/<id>` shows a friendly status page naming the
   failure reason. Pure DOM (no React/EUI) so a shared-singleton mismatch
   cannot itself break the surface.
2. **Inspector "Disabled plugins" section** — lists every disabled plugin with
   its `errorClass` (developer label) and `humanReason` (user-facing).

Every disable site (compat-skip, registry-trust skip, load failure) appends a
`DisabledPluginRecord` to a per-boot array, threaded into both surfaces.

## Telemetry (fire-and-forget)

- **Never blocks boot** — `emit()` is synchronous and swallows all transport
  errors. Absent endpoint = SILENT no-op (production default).
- **Transport** — `navigator.sendBeacon()` preferred, `fetch({ keepalive: true })`
  fallback. Both never awaited.
- **Event shape (locked)** — `{ id, version, status, durationMs, errorClass?,
  bucket, customerId, timestamp }`. Primitives only; JSON.stringify total.
- **Error taxonomy (locked)** — `sri-mismatch` | `network` | `compat-reject` |
  `mf-runtime-error` | `unknown`. Every failure site maps deterministically.

`bucket` and `customerId` are bound at construction from server-injected
values so events are pre-partitioned for canary/baseline split.

## Override sources (dev only)

`?mfe.<id>=<url>` (per-plugin) / `?mfe.all=<baseUrl>` (rewrite origin) / optional
`localStorage` persistence. Parsing is gate-agnostic; the bootstrap enforces
the `mfe.allowOverride` gate (default OFF in prod, ON in dev). With the gate
OFF, parser output is DISCARDED and every remote loads from the registry/CDN.

## Inspector panel

Dev-only React/EUI panel behind a double gate: `mfe.allowOverride` (server
config) AND `?inspect=true` (URL param). In production never rendered.
React/EUI resolved via bootstrap-bundle externals to the host's shared-deps
singletons — no duplicate copies.

## Files

| File | Purpose |
|---|---|
| `bootstrap_mfe.ts` | The orchestrator. |
| `browser_entry.ts` | Bundle entry — assigns `window.__osdBootstrapMfe__`. |
| `types.ts` | Runtime types (`ShareScope`, `MfeContainer`, shim). |
| `share_scope.ts` | Seeds MF share scope from `__osdSharedDeps__`. |
| `load_remote.ts` | Injects `<script>` (with SRI), resolves MF containers. |
| `osd_bundles.ts` | Registers plugin factories + invokes core boot. |
| `compat_policy.ts` | Resolves env-keyed compat policy. |
| `compat_enforcement.ts` | Pure classifier-verdict → action mapper. |
| `compat_block_page.ts` | Renders the hard-block page (pure DOM). |
| `disabled_plugin.ts` | Degraded app stub + reason record. |
| `chunk_error_surface.ts` | Post-boot lazy-chunk integrity surface. |
| `telemetry.ts` | Fire-and-forget per-plugin load events. |
| `override_sources.ts` | Parses dev URL/storage overrides. |
| `inspector.tsx` | Dev inspector panel (gated). |
