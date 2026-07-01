/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/**
 * The MFE bootstrap orchestrator — the LOCKED sequence from
 * `packages/osd-mfe/README.md`.
 *
 * Module Federation remote loading is ASYNC, but `plugin_reader.ts` reads
 * `window.__osdBundles__` SYNCHRONOUSLY during `CoreSystem` start. So this
 * bootstrap MUST finish all remote loading and shim registration BEFORE it
 * invokes core boot:
 *
 *   1. Load shared deps (`__osdSharedDeps__`) from the origin and seed the MF
 *      share scope (react/react-dom as singletons).
 *   2. Fetch the CURRENT registry at serve time (injected URL / `GET /registry`).
 *   3. For each UI plugin: load its remote container, get `./public`, and
 *      register it into the `__osdBundles__` shim as `plugin/<id>/public`.
 *   4. Then run core `__osdBootstrap__()` → `CoreSystem.setup()/start()`.
 */

import { assertValidRegistry, MfeEntry, Registry, SCHEMA_VERSION } from '../registry/schema';
import type { RegistryProvider } from '../registry/provider';
import { resolve, OverrideMap, ResolvedRemote } from '../registry/dev_override';
import { HostEnvironment } from '../registry/compat_classifier';
import { RegistryVerification, SignatureCheck } from '../registry/signing_common';
import { verifyRegistrySignatureWeb } from '../registry/verify_registry_web';
import { BootManifest, assertValidBootManifest } from '../registry/boot_manifest';
import { buildShareScope } from './share_scope';
import { getRemoteModuleFactory, loadRemoteContainer, loadScript } from './load_remote';
import { invokeCoreBootstrap, registerPluginFactory } from './osd_bundles';
import {
  createDisabledPluginModuleWithReason,
  createDisabledPluginRecord,
  DisabledPluginRecord,
} from './disabled_plugin';
import { buildOverrideMap, OverrideStorage, parseOverrideSources } from './override_sources';
import { CompatPolicy } from './compat_policy';
import { decideCompat, EvaluatedRemote } from './compat_enforcement';
import { renderCompatBlockPage } from './compat_block_page';
import { installChunkErrorSurface } from './chunk_error_surface';
import {
  MfeLoadTelemetryInput,
  TelemetryDispatcher,
  TelemetryDispatcherConfig,
  TelemetryErrorClass,
  createTelemetryDispatcher,
} from './telemetry';
import { mfeWindow } from './types';

// NOTE: `./inspector` is intentionally NOT imported statically here. It pulls in
// react / react-dom / @elastic/eui, which the bootstrap build externalizes to the
// `window.__osdSharedDeps__` globals (packages/osd-mfe/dev/build_bootstrap.js). A static
// import would evaluate those externals when the bootstrap bundle is first run by
// the page (see the load-step sequence in the header comment), which is BEFORE
// bootstrapMfe() loads shared-deps
// (step 1, below) — so `__osdSharedDeps__` would be undefined and the whole bundle
// would throw `ReferenceError`, never assigning window.__osdBootstrapMfe__. Instead
// the default `mountInspector` dep below lazily `import()`s it at mount time (step 5),
// AFTER shared-deps is loaded, so the externals resolve safely.

/**
 * Collaborators of {@link bootstrapMfe}, injectable for unit testing. Each
 * defaults to the real implementation in production.
 */
export interface BootstrapMfeDeps {
  loadScript: typeof loadScript;
  loadRemoteContainer: typeof loadRemoteContainer;
  getRemoteModuleFactory: typeof getRemoteModuleFactory;
  registerPluginFactory: typeof registerPluginFactory;
  invokeCoreBootstrap: typeof invokeCoreBootstrap;
  fetchImpl: typeof fetch;
  /**
   * Read the current page's query string (defaults to `window.location.search`)
   * — the source of `?mfe.<id>=<url>` dev overrides. Injectable for tests.
   */
  readOverrideSearch: () => string;
  /**
   * Read the persisted-override store (defaults to `window.localStorage`), or
   * `undefined` when unavailable. Injectable for tests / tolerant of a blocked
   * store.
   */
  readOverrideStorage: () => OverrideStorage | undefined;
  /**
   * Mount the dev-only Inspector panel for the resolved
   * remotes. The bootstrap calls this ONLY when the non-production
   * `allowOverride` gate is on (see {@link bootstrapMfe}), so the panel is never
   * mounted in production. The default mounts the real React/EUI panel and
   * swallows any render failure (the inspector is a dev convenience that must
   * NEVER break app boot); tests inject a spy.
   *
   * Visible degradation: the inspector ALSO renders a "Disabled plugins" section
   * when any remote was disabled (compat-skip / registry-trust skip / load
   * failure). The bootstrap collects a {@link DisabledPluginRecord} at every
   * disable site and passes the array here; an empty array suppresses the
   * section entirely (no banner / placeholder noise on a healthy boot).
   */
  mountInspector: (entries: ResolvedRemote[], disabled: DisabledPluginRecord[]) => void;
  /**
   * Render the version-compatibility HARD-BLOCK page for the offending
   * (incompatible) remotes. Called ONLY in the non-production `block` policy when
   * at least one remote is incompatible: the bootstrap renders this and does NOT
   * boot core. The default replaces the document body with a plain-DOM error
   * screen (no React/EUI — a shared-singleton mismatch may be the very cause of
   * the block); tests inject a spy.
   */
  renderBlockPage: (offenders: EvaluatedRemote[]) => void;
  /**
   * Install the host-side LAZY-CHUNK integrity-failure surface.
   * Registers global `unhandledrejection` + capture-phase `error` listeners that
   * detect a chunk load/SRI failure at the dynamic-`import()` boundary inside an
   * already-mounted remote and turn it into a visible, non-blocking error banner +
   * telemetry — never a white screen or a silent hang. Installed ONCE, early, so it
   * is armed for the whole app lifetime. The default installs the real surface;
   * tests inject a spy. See {@link installChunkErrorSurface}.
   */
  installChunkErrorSurface: typeof installChunkErrorSurface;
  /**
   * Verify the fetched registry's authenticity signature.
   * Called ONLY when a verification key is injected by the (trusted) OSD origin
   * (`options.registryVerification`), BEFORE the registry is used to decide which
   * remotes to load. The default is the Web Crypto HMAC verifier
   * ({@link verifyRegistrySignatureWeb}); tests inject a deterministic spy (jsdom
   * may lack `crypto.subtle`). A non-`ok` result makes the bootstrap fail closed
   * (see {@link bootstrapMfe}); it NEVER loads a remote from an unverified registry.
   */
  verifyRegistrySignature: (
    registry: Registry,
    verification: RegistryVerification
  ) => Promise<SignatureCheck>;
  /**
   * Build the fire-and-forget telemetry dispatcher for this boot. Default
   * is {@link createTelemetryDispatcher} reading `navigator.sendBeacon` and
   * `window.fetch`; tests inject a spy to assert per-remote emission without
   * a real network. The dispatcher MUST be fire-and-forget — `emit()` returns
   * synchronously, never throws, and is a SILENT no-op when the configured
   * endpoint is absent / unreachable. The bootstrap NEVER awaits emit().
   */
  createTelemetryDispatcher: (config: TelemetryDispatcherConfig) => TelemetryDispatcher;
  /**
   * Monotonic clock for measuring per-remote durationMs.
   * Default: `performance.now()` when available (sub-ms resolution, monotonic
   * — not affected by wall-clock skew), else `Date.now()`. Tests inject a
   * deterministic counter so emitted `durationMs` values are stable.
   */
  now: () => number;
}

/** Inputs to {@link bootstrapMfe}. */
export interface BootstrapMfeOptions {
  /**
   * URL of the registry document (serve-time, dynamic — e.g. `/registry`). Used
   * ONLY when {@link bootManifest} is NOT injected (legacy fallback path).
   * With server-side per-tenant resolution the OSD server resolves the registry
   * server-side and injects a flat boot manifest, so the browser does not fetch
   * this URL.
   */
  registryUrl: string;
  /**
   * Server-resolved boot manifest. When the OSD server has resolved the
   * layered registry against the requesting host's dimensions
   * (`customerId`, `userBucket`) and injected the flat boot manifest at
   * `window.__osdMfe__.bootManifest`, the bootstrap consumes it DIRECTLY and
   * SKIPS the registry HTTP fetch + signature verification path entirely. This
   * is the canonical server-side-resolution path; the {@link registryUrl} fetch
   * path is a legacy fallback and is intentionally kept around so older injected
   * pages keep booting. The browser does NOT see the layered document — the OSD
   * server reads it, resolves dimensions, produces a flat boot manifest, and
   * injects it via `<osd-injected-metadata>`.
   *
   * Invariant: in the canonical server-resolution path, the browser makes ZERO
   * HTTP calls to anything matching `/registry` (see the dual-path CI gate).
   */
  bootManifest?: BootManifest;
  /** URL of the shared-deps bundle that assigns `window.__osdSharedDeps__`. */
  sharedDepsUrl: string;
  /**
   * URLs of the shared-deps dependency chunks that MUST load (in order) BEFORE
   * `sharedDepsUrl`. The OSD shared-deps bundle is split (`jsDepFilenames` — e.g.
   * the large `@elastic` vendor chunk), and the entry (`sharedDepsUrl`) only
   * assigns `window.__osdSharedDeps__` once its dependency chunks are present.
   * This mirrors the normal OSD bootstrap, which loads `jsDepFilenames` then
   * `jsFilename`. Defaults to none (the entry is self-contained).
   */
  sharedDepsDepUrls?: string[];
  /**
   * The non-production security GATE for dev URL-overrides
   * (`mfe.allowOverride`, see `packages/osd-mfe/README.md`). When `false` (the
   * DEFAULT, and the only value in production), ALL override sources — query
   * param, inspector, `localStorage` — are IGNORED and every plugin loads from
   * the registry/CDN. The dev URL override gate wires the real config value
   * (injected into the page, default off in prod) into this option; this option
   * only plumbs it, with a safe default of `false` so no override URL can load
   * while the gate is off.
   */
  allowOverride?: boolean;
  /**
   * The running HOST environment (compat contract): the OSD core
   * version + the shared-singleton versions the host actually provides. Injected
   * by the server (`window.__osdMfe__.host`, computed by
   * `src/core/server/utils/resolve_mfe_host_env.ts`) from the SAME sources the
   * remotes recorded their `builtAgainst` against, so in the happy path (all
   * remotes built from one tree) every remote classifies COMPATIBLE. The
   * classifier compares each remote's recorded metadata against this to decide
   * compatible | incompatible | unknown.
   *
   * Optional: when absent (or `compatPolicy` is absent), compatibility
   * enforcement is DISABLED and every remote loads as before (used by tests / a
   * pre-compat page).
   */
  host?: HostEnvironment;
  /**
   * The resolved, env-keyed version-compatibility POLICY. Injected by
   * the server (`window.__osdMfe__.compatPolicy`, resolved by
   * `resolveCompatPolicy` from `opensearchDashboards.mfe.compat.*` + the server's
   * dev/prod mode). Drives how each non-compatible remote is handled: prod skips
   * incompatible/unknown (page still boots); non-prod hard-blocks the page on
   * incompatible and warn-loads unknown. Optional — see {@link host}.
   */
  compatPolicy?: CompatPolicy;
  /**
   * Registry-authenticity verification material, injected by the server
   * (`window.__osdMfe__.registryVerification`) from
   * `opensearchDashboards.mfe.registrySignature.*` — ONLY when a verification key
   * is configured. When present, the bootstrap REQUIRES the fetched registry to
   * carry a valid signature produced with this host-held key and FAILS CLOSED
   * otherwise (the registry decides which remote code loads, so an unauthenticated
   * one is never trusted). When absent (the default / signing off), the registry
   * loads as before — backward compatible, like a missing per-artifact integrity.
   * The key is delivered by the trusted OSD origin, NOT the CDN that serves the
   * registry, so the CDN tamperer this defends against cannot forge a signature.
   * See `../registry/signing_common.ts` for the trust/key model.
   */
  registryVerification?: RegistryVerification;
  /**
   * Telemetry sink URL. Resolved server-side from
   * `opensearchDashboards.mfe.telemetryEndpoint` (mfe-gated config). When
   * unset/empty, telemetry is a SILENT no-op — emit() never makes a network
   * call, never logs, and the load loop is byte-for-byte unchanged. When set,
   * the bootstrap fires (never awaits) one event per remote per load attempt
   * via sendBeacon (preferred) or fetch (fallback). See `./telemetry.ts` for
   * the locked event shape and dispatcher contract.
   */
  telemetryEndpoint?: string;
  /**
   * Stable canary-bucket assignment for the requesting client (0..99), stamped
   * onto every emitted event. Comes from the server-side cookie hash
   * (`bucketFromCookie`); injected at `window.__osdMfe__.bucket`. When
   * absent, defaults to `0` so events still emit with a well-formed dimension
   * (a test / pre-telemetry page that did not inject the bucket field).
   */
  bucket?: number;
  /**
   * Tenant identifier stamped onto every emitted event. Comes from
   * `opensearchDashboards.mfe.customerId` server config (`'default'` until real
   * AuthN); injected at `window.__osdMfe__.customerId`. When absent, defaults
   * to `'default'` for the same reason as {@link bucket}.
   */
  customerId?: string;
  /**
   * Registry-managed OSD core entry script (`core.entry.js`), a global asset
   * root. When the server has resolved a registry's `core` top-level field, it
   * injects the descriptor here so the orchestrator loads `core.entry.js` from
   * the CDN URL (with SRI) BEFORE invoking core boot. A tampered core fails
   * closed: `loadScript` rejects, this Promise rejects, the chunk-error
   * surface (armed earlier in `bootstrapMfe`) catches the unhandled rejection
   * and renders a visible error banner — `invokeCoreBootstrap` is NEVER
   * called, because the entire app cannot proceed on a tampered core. When
   * absent (no `core` global asset), the thin shim's jsDependencyPaths already
   * pre-loaded `core.entry.js` from THIS server (the byte-for-byte legacy path)
   * so the in-orchestrator load is skipped — backward-compat at every
   * consumption site.
   */
  core?: { url: string; integrity?: string };
  /** Optional collaborator overrides (used by tests). */
  deps?: Partial<BootstrapMfeDeps>;
}

function resolveDeps(overrides?: Partial<BootstrapMfeDeps>): BootstrapMfeDeps {
  return {
    loadScript,
    loadRemoteContainer,
    getRemoteModuleFactory,
    registerPluginFactory,
    invokeCoreBootstrap,
    // Bind so the default `fetch` keeps its `window` receiver.
    fetchImpl: ((input: RequestInfo | URL, init?: RequestInit) =>
      window.fetch(input, init)) as typeof fetch,
    readOverrideSearch: () => (typeof window !== 'undefined' ? window.location.search : ''),
    readOverrideStorage: () => {
      // Accessing localStorage can throw (privacy mode / disabled storage); a
      // missing store simply means "no persisted overrides".
      try {
        return typeof window !== 'undefined' ? window.localStorage : undefined;
      } catch {
        return undefined;
      }
    },
    mountInspector: (entries: ResolvedRemote[], disabled: DisabledPluginRecord[]) => {
      // Lazily load the Inspector so its react / react-dom / @elastic/eui imports
      // (externalized to window.__osdSharedDeps__ by the bootstrap build) are only
      // evaluated HERE — at mount time (step 5), AFTER step 1 has loaded shared-deps.
      // A static import would resolve those externals when the bootstrap bundle is
      // first evaluated by the page (before shared-deps exists), throwing a
      // ReferenceError that aborts the entire boot. The `webpackMode: 'eager'` hint
      // (and the build's parser dynamicImportMode='eager') keeps the inspector in the
      // single bootstrap file rather than emitting a separate async chunk.
      import(/* webpackMode: "eager" */ './inspector')
        .then(({ mountInspector: mountInspectorPanel }) => {
          mountInspectorPanel({ entries, disabled });
        })
        .catch((error) => {
          // The inspector is a dev-only convenience; a load/render failure must
          // NEVER abort or degrade app boot.
          // eslint-disable-next-line no-console
          console.warn('[mfe] dev inspector failed to mount; continuing without it.', error);
        });
    },
    renderBlockPage: (offenders: EvaluatedRemote[]) => renderCompatBlockPage(offenders),
    installChunkErrorSurface,
    verifyRegistrySignature: verifyRegistrySignatureWeb,
    createTelemetryDispatcher: (config) => createTelemetryDispatcher(config),
    // Default monotonic clock: prefer `performance.now()` (sub-ms, monotonic);
    // fall back to `Date.now()` in environments where `performance` is absent.
    now: () =>
      typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now(),
    ...overrides,
  };
}

/**
 * Build the dev-override {@link OverrideMap} for the current registry, GATED by
 * the non-production `allowOverride` flag.
 *
 * SECURITY (see the dev URL override gate in `packages/osd-mfe/README.md`):
 * when the gate is off (production, the default), this returns an EMPTY map so
 * `resolve()` always yields the registry/CDN URL and no override source can
 * load arbitrary remote code. When the gate is on (dev), query-param and
 * `localStorage` sources are parsed and expanded against the registry entries.
 */
function buildOverrides(
  allowOverride: boolean,
  registry: Registry,
  deps: BootstrapMfeDeps
): OverrideMap {
  if (!allowOverride) {
    return {};
  }
  const parsed = parseOverrideSources({
    search: deps.readOverrideSearch(),
    storage: deps.readOverrideStorage(),
  });
  return buildOverrideMap(parsed, registry.mfes);
}

/**
 * Wrap an already-fetched, validated {@link Registry} as a
 * {@link RegistryProvider} so the bootstrap resolves each remote through the
 * shared, unit-tested `resolve()` contract (registry → descriptor, with the
 * dev-override hook). The registry is a static snapshot here (one fetch per
 * boot), so the provider just reads the in-memory object.
 */
function inMemoryProvider(registry: Registry): RegistryProvider {
  return {
    read: () => registry,
    getMfe: (id: string) => registry.mfes[id],
    list: () => Object.keys(registry.mfes),
  };
}

/**
 * Returns `true` when the current page URL carries `?inspect=true` — the
 * opt-in signal a developer uses to summon the MFE Inspector panel. The
 * panel's primary gate is `mfe.allowOverride` (server-config, default off in
 * prod), but with `allowOverride` ON the panel previously auto-popped on every
 * page load, which was noisy. This URL-param check turns the panel into an
 * opt-in tool: surface it only when the developer asks for it via
 * `<page>?inspect=true`.
 *
 * Defensive in two ways:
 * - Returns `false` when `window` or `window.location` is unavailable (SSR,
 *   non-browser tests, and any future code path that calls the bootstrap
 *   outside a browser context).
 * - Wraps `URLSearchParams` in try/catch so a malformed query string never
 *   throws into the boot loop.
 */
function inspectorRequestedByUrl(): boolean {
  if (typeof window === 'undefined' || !window.location) return false;
  try {
    return new URLSearchParams(window.location.search).get('inspect') === 'true';
  } catch {
    return false;
  }
}

/**
 * Project a server-resolved {@link BootManifest} onto the
 * in-memory {@link Registry} shape the rest of the bootstrap consumes.
 *
 * The boot manifest is the FLAT projection of a layered registry document already
 * resolved against the requesting host's dimensions; it does NOT carry a
 * signature, a generatedAt timestamp or unrelated layers. We synthesise a
 * minimal, valid Registry around the flat list so the existing compat
 * classifier, override map, factory registration and load sequence keep
 * working unchanged.
 *
 * Fields:
 *  - `schemaVersion`: pinned to the SCHEMA_VERSION constant — the in-memory
 *    Registry is just a transport here, never written or sent over the wire.
 *  - `generatedAt`: stamped at projection time so audit logs are still
 *    chronologically sortable; the boot manifest itself does not carry one and
 *    the resolved doc's generatedAt was already consumed server-side.
 *  - `mfes[id]`: per the manifest entry — `version`, `remoteEntry`, `scope`,
 *    `module`, plus optional `integrity` (SRI) and `compat` (classifier input).
 *    `builtAgainst` and `minCoreVersion` are deliberately omitted — compat
 *    enforcement uses the projected `compat` declaration alone on the
 *    server-resolution path, mirroring how a server-side resolver pre-filters
 *    them.
 */
export function registryFromBootManifest(manifest: BootManifest): Registry {
  const mfes: Record<string, MfeEntry> = {};
  for (const e of manifest.mfes) {
    const entry: MfeEntry = {
      version: e.version,
      remoteEntry: e.remoteEntry,
      scope: e.scope,
      module: e.module,
    };
    if (e.integrity !== undefined && e.integrity.length > 0) {
      entry.integrity = e.integrity;
    }
    if (e.compat !== undefined) {
      entry.compat = {
        minCoreVersion: e.compat.minCoreVersion,
        compatibleCoreRange: e.compat.compatibleCoreRange,
      };
    }
    mfes[e.id] = entry;
  }
  return {
    // The in-memory Registry is a transport for the rest of the bootstrap; it is
    // never serialized back out, so pinning to SCHEMA_VERSION (1) here just keeps
    // the schema validator happy and matches the legacy fetched shape exactly.
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date(0).toISOString(),
    sharedDeps: { ...manifest.sharedDeps },
    mfes,
  };
}

/**
 * Classify a per-remote load error for telemetry — pure
 * mapping from the error and the descriptor's integrity claim onto the
 * locked {@link TelemetryErrorClass} taxonomy:
 *
 *  - `Failed to load script: …` from {@link loadScript}: the browser's
 *    `onerror` fired on the remoteEntry <script>. With an integrity claim that
 *    means a Subresource-Integrity mismatch OR an unfetchable artifact (the
 *    browser does not distinguish to JS, and the SRI fail-closed contract
 *    conflates them as `sri-mismatch` for fail-closed reasoning); without it,
 *    the bytes were simply unreachable, so it is `network`.
 *  - `Subresource Integrity` anywhere in the message: SRI failure (defensive
 *    against runtimes whose error wording differs).
 *  - `Remote container "…" not found after loading …` from
 *    {@link loadRemoteContainer}: the remoteEntry executed but didn't register
 *    the container global. That is a Module-Federation runtime malformation,
 *    not a bytes-tampering issue — `mf-runtime-error`.
 *  - Any other error from container.init / container.get / factory wiring
 *    propagates here and is also `mf-runtime-error`.
 *  - The catch-all `unknown` is reserved for an empty/non-Error reason.
 *
 * @param err the rejected value from the per-remote load chain
 * @param hasIntegrity whether the descriptor carried an SRI hash
 */
function classifyLoadError(
  err: unknown,
  hasIntegrity: boolean
): import('./telemetry').TelemetryErrorClass {
  const msg =
    err instanceof Error ? `${err.name}: ${err.message}` : typeof err === 'string' ? err : '';
  if (msg === '') {
    return 'unknown';
  }
  if (/Subresource Integrity/i.test(msg)) {
    return 'sri-mismatch';
  }
  if (/Failed to load script/i.test(msg)) {
    return hasIntegrity ? 'sri-mismatch' : 'network';
  }
  return 'mf-runtime-error';
}

/**
 * Boot OSD's UI from Module Federation remotes. Resolves once core boot has
 * been invoked (and, for the default core bootstrap, once it completes).
 *
 * Individual remote-load failures are tolerated by graceful degradation: a
 * remote that cannot be loaded is logged and registered as a DISABLED
 * placeholder (so OSD core's plugin_reader still resolves it) rather than
 * aborting boot. Only the fatal prerequisites still throw.
 *
 * @throws if shared deps are unavailable, the registry fetch fails, or the
 *   registry is invalid. A single remote that cannot be loaded is logged and
 *   disabled (it does NOT throw / abort boot).
 */
export async function bootstrapMfe(options: BootstrapMfeOptions): Promise<void> {
  const { registryUrl, sharedDepsUrl, sharedDepsDepUrls, allowOverride = false } = options;
  const { host, compatPolicy, registryVerification, bootManifest } = options;
  const deps = resolveDeps(options.deps);

  // Build the fire-and-forget telemetry dispatcher EARLY, with
  // server-injected dimensions (bucket + customerId) so every emitted event is
  // pre-partitioned for canary/baseline split downstream. Defaults make this a
  // SILENT no-op when the endpoint is unset / empty, so the load loop is
  // byte-for-byte unchanged when telemetry is off (the production default).
  // The dispatcher must NEVER block boot; emit() is synchronous and swallows
  // every transport failure. See `./telemetry.ts`.
  const telemetry: TelemetryDispatcher = deps.createTelemetryDispatcher({
    endpoint: options.telemetryEndpoint,
    bucket: typeof options.bucket === 'number' ? options.bucket : 0,
    customerId: typeof options.customerId === 'string' ? options.customerId : 'default',
  });
  // Helper: emit an event without ever throwing into the load loop, even if a
  // misbehaving dispatcher synchronously throws (the contract says it must not,
  // but defense-in-depth keeps a flaky sink from corrupting boot).
  const fireTelemetry = (input: MfeLoadTelemetryInput): void => {
    try {
      telemetry.emit(input);
    } catch {
      // SILENT — telemetry NEVER blocks or surfaces.
    }
  };

  // VISIBLE graceful-degradation UX. Every disable site
  // (compat-skip / registry-trust skip / per-remote load failure) appends a
  // {@link DisabledPluginRecord} here so the dev Inspector panel can render a
  // "Disabled plugins" section AFTER boot, AND each placeholder registers a
  // hidden degraded app stub at `/app/<id>` that renders a friendly status
  // component instead of OSD's default 404 (see ./disabled_plugin.ts).
  //
  // Single-failure isolation invariant: this is purely additive — the existing
  // silent-disable mechanism (the placeholder satisfies plugin_reader so a
  // single failed remote does NOT block core boot) is kept verbatim; we only
  // enrich the placeholder's `setup()` with an OSD `application.register` call
  // wrapped in defense-in-depth try/catch.
  const disabledPlugins: DisabledPluginRecord[] = [];

  /**
   * Disable a plugin at the given id with the supplied error class. Builds
   * the {@link DisabledPluginRecord}, registers a degraded-aware placeholder
   * for it (`createDisabledPluginModuleWithReason` — registers the hidden
   * `application` stub at setup time), and tracks the record so the Inspector
   * can render its "Disabled plugins" section. Single source of truth for the
   * three disable sites below — keeps `humanReason` consistent and the
   * Inspector record array exhaustive.
   */
  const disablePlugin = (id: string, version: string, errorClass: TelemetryErrorClass): void => {
    const record = createDisabledPluginRecord(id, version, errorClass);
    disabledPlugins.push(record);
    const placeholder = createDisabledPluginModuleWithReason(record);
    deps.registerPluginFactory(id, () => placeholder);
  };

  // Arm the lazy-CHUNK integrity-failure surface BEFORE anything loads, so it is
  // Arm the lazy-CHUNK integrity-failure surface BEFORE anything loads, so it is
  // active for the entire page lifetime. A remote's lazy chunks are
  // integrity-checked by the browser (rspack SubresourceIntegrityPlugin +
  // crossOriginLoading, see mfe_rspack_config.ts); a tampered chunk is rejected at
  // the remote's own dynamic-`import()` site AFTER it is mounted — a RUNTIME event,
  // not a boot-time skip. This host-side safety net catches that rejection and
  // surfaces a visible error + telemetry instead of letting it white-screen / hang.
  // It is purely additive (global listeners) and never affects the load sequence.
  deps.installChunkErrorSurface();

  // 0. Registry-managed OSD core entry (`core.entry.js`). When the server
  //    advertised a `core` global-asset descriptor, the thin shim OMITTED the
  //    legacy `${regularBundlePath}/core/core.entry.js` preload, so the
  //    orchestrator MUST load core from the CDN URL itself BEFORE invoking
  //    core boot. The order mirrors the legacy thin-shim sequence:
  //    core.entry.js loads → registers `entry/core/public` into the
  //    __osdBundles__ shim (its `__osdBootstrap__` is NOT invoked yet) →
  //    shared-deps + plugin remotes load (steps 1-3 below) → finally
  //    `deps.invokeCoreBootstrap()` (step 4) calls the registered
  //    `__osdBootstrap__`. Loading core BEFORE shared-deps is safe (and
  //    matches the legacy ordering) because the entry script only DEFINES
  //    into the shim at load time; it does not yet touch
  //    `window.__osdSharedDeps__`.
  //
  //    FAIL-CLOSED (SRI posture extended to core): on SRI mismatch
  //    or unfetchable bytes, `loadScript` rejects → bootstrapMfe's Promise
  //    rejects → the chunk-error surface armed above catches the unhandled
  //    rejection → visible error banner. `invokeCoreBootstrap` is NEVER
  //    called: the entire app cannot proceed on a tampered or unreachable
  //    core (unlike a single plugin remote, which degrades to a placeholder).
  //
  //    Telemetry: the locked error-class taxonomy is
  //    re-used unchanged — an integrity claim that fails is `sri-mismatch`
  //    (the SRI fail-closed contract conflates tampered bytes and unfetchable
  //    bytes when integrity is pinned); no claim collapses to `network`. The
  //    event id is the sentinel `'core'` so downstream aggregators can
  //    distinguish a core failure from a plugin failure without expanding the
  //    locked emit() shape.
  //
  //    Backward-compat: when `options.core` is absent (no `core` global asset
  //    advertised), this block is a no-op — the thin shim already pre-loaded
  //    `${regularBundlePath}/core/core.entry.js` from THIS server
  //    (byte-for-byte legacy path), so the shim's `entry/core/public`
  //    registration is already in place by the time step 4 invokes
  //    `__osdBootstrap__`.
  if (options.core) {
    const coreLoadStart = deps.now();
    try {
      await deps.loadScript(options.core.url, options.core.integrity);
    } catch (err) {
      const errorClass: TelemetryErrorClass = options.core.integrity ? 'sri-mismatch' : 'network';
      fireTelemetry({
        id: 'core',
        version: '',
        status: 'failure',
        durationMs: deps.now() - coreLoadStart,
        errorClass,
      });
      // eslint-disable-next-line no-console
      console.error(
        `[mfe] Failed to load OSD core (core.entry.js) from ${options.core.url}; refusing to ` +
          `invoke core boot. App cannot proceed on a tampered or unreachable core ` +
          `(errorClass=${errorClass}).`,
        err
      );
      // Re-throw to fail-close: bootstrapMfe's Promise rejects, the chunk-error
      // surface catches the unhandled rejection, and the rest of the load
      // sequence (shared-deps / plugins / invokeCoreBootstrap) is never run.
      throw err;
    }
  }

  // 1. Load shared deps and seed the MF share scope (singletons). The shared-deps
  //    bundle is split, so load its dependency chunks (in order) BEFORE the entry
  //    — the entry only assigns window.__osdSharedDeps__ once they are present.
  for (const depUrl of sharedDepsDepUrls ?? []) {
    await deps.loadScript(depUrl);
  }
  await deps.loadScript(sharedDepsUrl);
  const sharedDeps = mfeWindow().__osdSharedDeps__;
  if (!sharedDeps) {
    throw new Error(`__osdSharedDeps__ is not available after loading ${sharedDepsUrl}`);
  }
  const shareScope = buildShareScope(sharedDeps);

  // 2. Get the current registry. Server-resolution path: when the OSD server
  //    has server-side resolved the layered registry against the requesting
  //    host's dimensions and INJECTED a flat boot manifest, the bootstrap
  //    consumes it DIRECTLY — no `/registry` HTTP fetch, no signature
  //    verification, no browser-side resolve (the dual-path CI gate asserts
  //    ZERO `/registry` fetches in --mfe mode). Otherwise (legacy fallback),
  //    fall back to the original fetch + signature-verify path. The two paths
  //    converge on the in-memory `Registry` shape so the rest of the load
  //    sequence (compat classifier, override map, factory registration,
  //    allSettled load) is identical regardless of source.
  let registry: Registry;
  if (bootManifest) {
    // Validate the injected slot defensively — a malformed manifest is a
    // corrupted server-side resolution and must abort with a descriptive error
    // rather than fall through to a confusing TypeError on .scope/.module.
    assertValidBootManifest(bootManifest);
    registry = registryFromBootManifest(bootManifest);
  } else {
    const response = await deps.fetchImpl(registryUrl, { credentials: 'omit' });
    if (!response.ok) {
      throw new Error(`Failed to fetch MFE registry from ${registryUrl}: HTTP ${response.status}`);
    }
    registry = assertValidRegistry(await response.json());
  }

  // 2a. Registry AUTHENTICITY — verify BEFORE the registry is used to decide
  //     which remotes to load. The registry document selects WHICH remote code
  //     each plugin loads, so an attacker who can alter the registry bytes (a
  //     compromised CDN / MITM serving a different registry.json at the pinned
  //     path) could redirect every plugin to arbitrary code even though the
  //     per-artifact SRI protects each pinned artifact. So when the (trusted)
  //     OSD origin injected a verification key, the registry MUST carry a
  //     valid HMAC signature produced with that host-held key; otherwise we
  //     FAIL CLOSED and never load a remote from an unauthenticated registry.
  //     The key is delivered by the OSD origin, NOT the CDN, so the CDN
  //     tamperer lacks it (a bare hash served next to the registry would be
  //     theater). When no key is injected (signing off), this is skipped and
  //     the registry loads as before. Only fires on an ACTUAL signature
  //     failure, so a correctly-signed registry never false-rejects.
  //
  //     Server-resolution cut-over: when a server-resolved `bootManifest` was
  //     injected, the trust path moved server-side (the OSD origin read the
  //     registry from disk and produced the manifest), so there is no
  //     client-side signature to verify here. Skip this entire block in that
  //     case — this is the canonical server-resolution path, and signature
  //     checks belong on a future server-side non-browser hop, not the
  //     boot-manifest path. The HMAC primitive in `../registry/signing.ts`
  //     stays available for that future use.
  if (!bootManifest && registryVerification && registryVerification.key) {
    const check = await deps.verifyRegistrySignature(registry, registryVerification);
    if (!check.ok) {
      const reason = check.reason ?? 'unknown reason';
      // eslint-disable-next-line no-console
      console.error(
        `[mfe] Registry signature verification FAILED (refusing to load any micro-frontend ` +
          `from an unauthenticated registry): ${reason}`
      );

      // Fail-closed reaction, reusing the env-keyed surfaces (mirrors the
      // integrity-failure handling):
      //   - non-prod `block`: render the loud block page and do NOT boot core — the
      //     app does not start with an untrusted registry (never a silent hang).
      //   - prod `skip` / no policy: do NOT load ANY remote (we cannot trust the
      //     document that lists them); register every advertised plugin as a DISABLED
      //     placeholder and still boot the core shell so the app degrades visibly
      //     rather than white-screening. No untrusted remote bytes are ever loaded.
      const trustOffender: EvaluatedRemote = {
        id: 'registry',
        compatibility: 'incompatible',
        reasons: [
          `Registry signature verification failed: ${reason}. The served registry was ` +
            `tampered with, is unsigned, or was signed with a different key than the configured ` +
            `verification key (opensearchDashboards.mfe.registrySignature.verificationKey).`,
        ],
      };
      if (compatPolicy?.onIncompatible === 'block') {
        deps.renderBlockPage([trustOffender]);
        return;
      }
      // Registry-trust skip: an unverified registry means we cannot know which
      // version each plugin should load, but we still satisfy plugin_reader by
      // registering a degraded-aware placeholder for every advertised id.
      // `version` is intentionally `''` — no specific artifact failed; the
      // document itself is untrusted (telemetry surfaces this as
      // `errorClass: 'unknown'` for now — the registry-trust taxonomy is not
      // part of the locked telemetry-event enum and would expand the contract).
      for (const id of Object.keys(registry.mfes)) {
        disablePlugin(id, '', 'unknown');
      }
      // eslint-disable-next-line no-console
      console.warn(
        `[mfe] Booting the core shell with ALL ${Object.keys(registry.mfes).length} ` +
          `micro-frontend(s) DISABLED because the registry signature did not verify ` +
          `(compat policy = "skip"). No remote code was loaded.`
      );
      await deps.invokeCoreBootstrap();
      return;
    }
  }

  // 2b. Build the dev-override map (GATED: empty unless `allowOverride`), and
  //     wrap the registry as a provider so each remote is resolved through the
  //     shared `resolve()` contract — an overridden id yields the override URL,
  //     everything else the registry/CDN URL. See the dev URL override gate
  //     section in `packages/osd-mfe/README.md`.
  const overrides = buildOverrides(allowOverride, registry, deps);
  const provider = inMemoryProvider(registry);

  // 3. Load every plugin remote and register its FACTORY into the __osdBundles__
  //    shim. We register factories (lazy) rather than evaluated modules, and define
  //    ALL of them before core boot, so when a plugin module is evaluated during
  //    core start and imports a peer plugin via __osdBundles__.get, the peer's
  //    factory is already defined and resolves synchronously (the remotes load
  //    concurrently, so eager evaluation here would hit an unregistered peer).
  //    All remotes share the SAME share scope object, so singletons stay single.
  //
  //    Graceful degradation: we use Promise.allSettled rather than Promise.all
  //    so a single failed or missing remote (e.g. one unreachable CDN object
  //    among the 58) does NOT abort the whole app boot. Each remote that
  //    fails is logged and registered as a DISABLED placeholder (see below) so that
  //    OSD core's plugin_reader still finds a definition for it and the remaining
  //    plugins boot normally. A plugin that hard-depends on a failed peer's exports
  //    may still surface its own error, but a leaf/optional plugin degrades cleanly.
  const ids = Object.keys(registry.mfes);

  // 2c. Version-compatibility ENFORCEMENT. When the host environment + policy
  //     are injected (always, behind --mfe), classify each remote against the
  //     running host and apply the locked, env-keyed policy BEFORE loading
  //     anything:
  //       - NON-PROD `block`: any INCOMPATIBLE remote is an offender => render a
  //         loud block page listing offenders + reasons and do NOT boot the app
  //         (no white-screen, no half-booted app).
  //       - PROD `skip`: INCOMPATIBLE / UNKNOWN remotes are skipped — registered
  //         as a DISABLED placeholder (reusing graceful degradation) with
  //         a clear console reason, and the app still boots from the rest.
  //       - UNKNOWN under `warn-load` (non-prod default): a warning is logged and
  //         the remote loads normally.
  //     Shared singletons are STRICT by default (a mismatch is enforced via the
  //     same policy); `strictShared:false` tolerates a shared-only mismatch (see
  //     compat_enforcement). In the happy path (all remotes built from one tree)
  //     every remote is COMPATIBLE, so this is a no-op and all ids load.
  let idsToLoad = ids;
  if (host && compatPolicy) {
    const decision = decideCompat(ids, (id) => registry.mfes[id], host, compatPolicy);

    if (decision.block) {
      // HARD-BLOCK (non-prod): list every offender + reason, render the block
      // page, and abort boot. The app is intentionally NOT started.
      // Telemetry: emit one `failure` + `compat-reject` event per offender so
      // an operator can see which remote caused the page block (sendBeacon
      // flushes even when we replace the document).
      for (const offender of decision.offenders) {
        fireTelemetry({
          id: offender.id,
          version: registry.mfes[offender.id]?.version ?? '',
          status: 'failure',
          durationMs: 0,
          errorClass: 'compat-reject',
        });
      }
      const offenderSummary = decision.offenders
        .map((o) => `${o.id} (${o.compatibility}): ${o.reasons.join('; ')}`)
        .join('\n  - ');
      // eslint-disable-next-line no-console
      console.error(
        `[mfe] Blocking startup: ${decision.offenders.length} incompatible remote(s) detected ` +
          `(compat policy onIncompatible/onMissing = "block"):\n  - ${offenderSummary}`
      );
      deps.renderBlockPage(decision.offenders);
      return;
    }

    // PROD skip (or onMissing:skip): register a DISABLED placeholder for each
    // skipped remote so OSD core's plugin_reader still resolves it and the app
    // boots; log a clear, per-remote reason (telemetry).
    for (const skipped of decision.skip) {
      // Tracked + degraded-aware placeholder. errorClass is `compat-reject`
      // for both incompatible and unknown remotes — compat classification is
      // the single source of "this plugin should not load against this host",
      // and the Inspector's humanReason ("incompatible with this OSD version")
      // covers both phrasings.
      disablePlugin(skipped.id, registry.mfes[skipped.id]?.version ?? '', 'compat-reject');
      // Telemetry: a compat-skip is a `skipped` event with errorClass
      // `compat-reject` (durationMs=0 — no load attempted). Emitted BEFORE the
      // warn so the dispatcher fires even if the warn handler is mutated in
      // some hostile environment.
      fireTelemetry({
        id: skipped.id,
        version: registry.mfes[skipped.id]?.version ?? '',
        status: 'skipped',
        durationMs: 0,
        errorClass: 'compat-reject',
      });
      // eslint-disable-next-line no-console
      console.warn(
        `[mfe] Skipping ${skipped.compatibility} remote "${skipped.id}" and registering it as ` +
          `DISABLED (compat policy = "skip"): ${skipped.reasons.join('; ')}`
      );
    }

    // UNKNOWN remotes under `warn-load` are in `decision.load`; surface a warning
    // so a missing-metadata remote is loud in non-prod without blocking. A loaded
    // remote is "unknown" exactly when its compatibility metadata is incomplete.
    //
    // Design note: the boot manifest deliberately omits `builtAgainst`
    // (see `BootManifestEntry` in `registry/boot_manifest.ts`) — server-side
    // resolution has already used it to make the compat decision before injecting
    // the manifest. We therefore only check `compat` here; `builtAgainst` is
    // guaranteed to be absent in the resolved manifest by design.
    if (compatPolicy.onMissing === 'warn-load') {
      for (const id of decision.load) {
        const entry = registry.mfes[id];
        if (!entry.compat) {
          // eslint-disable-next-line no-console
          console.warn(
            `[mfe] Loading remote "${id}" despite missing/unknown compatibility metadata ` +
              `(compat policy onMissing = "warn-load").`
          );
        }
      }
    }

    idsToLoad = decision.load;
  }

  // 3. Load every selected plugin remote and register its FACTORY into the
  //    __osdBundles__ shim. We register factories (lazy) rather than evaluated
  //    modules, and define ALL of them before core boot, so when a plugin module
  //    is evaluated during core start and imports a peer plugin via
  //    __osdBundles__.get, the peer's factory is already defined and resolves
  //    synchronously (the remotes load concurrently, so eager evaluation here
  //    would hit an unregistered peer). All remotes share the SAME share scope
  //    object, so singletons stay single.
  //
  //    Graceful degradation: we use Promise.allSettled rather than Promise.all
  //    so a single failed or missing remote (e.g. one unreachable CDN object
  //    among the 58) does NOT abort the whole app boot. Each remote that fails
  //    is logged and registered as a DISABLED placeholder (see below) so that
  //    OSD core's plugin_reader still finds a definition for it and the
  //    remaining plugins boot normally. A plugin that hard-depends on a failed
  //    peer's exports may still surface its own error, but a leaf/optional
  //    plugin degrades cleanly.
  //
  // Pre-resolve each id (override URL wins over registry) so both the loader and
  // the failure log below reference the EFFECTIVE remoteEntry. ids come from the
  // registry, so resolve() never returns null here (the empty filter is defensive).
  const resolved = new Map<string, ResolvedRemote>();
  for (const id of idsToLoad) {
    const descriptor = resolve(provider, id, overrides);
    if (descriptor !== null) {
      resolved.set(id, descriptor);
    }
  }
  const results = await Promise.allSettled(
    idsToLoad.map(async (id) => {
      const descriptor = resolved.get(id)!;
      // Per-remote timing for the load-telemetry event.
      // Captured around the WHOLE load chain (script load + share-scope wiring
      // + factory resolution) so `durationMs` reflects what the operator cares
      // about (end-to-end latency to "this plugin is registered"). The clock
      // is monotonic (`performance.now()` by default) so a wall-clock skew
      // can never produce a negative duration. Defense-in-depth: a misbehaving
      // injected `now()` could; if it does, we clamp to 0 below.
      const start = deps.now();
      try {
        // Pass the registry `integrity` (when present) so the remoteEntry <script>
        // is integrity-checked by the browser (SRI). An override descriptor has
        // no integrity (its bytes differ from the registry build), so it loads
        // without SRI — see resolve() / load_remote.loadScript().
        const container = await deps.loadRemoteContainer(
          descriptor.remoteEntry,
          descriptor.scope,
          descriptor.integrity
        );
        const factory = await deps.getRemoteModuleFactory(container, shareScope, descriptor.module);
        deps.registerPluginFactory(id, factory);
        // SUCCESS. Emit (non-blocking) BEFORE returning. version is taken from
        // the registry/manifest so it survives compat-strip / boot-manifest
        // projection unchanged. The caller (Promise.allSettled) sees the
        // resolution, the existing flow continues unchanged.
        fireTelemetry({
          id,
          version: registry.mfes[id]?.version ?? '',
          status: 'success',
          durationMs: Math.max(0, deps.now() - start),
        });
      } catch (error) {
        // FAILURE. Classify against descriptor.integrity so a load error on an
        // SRI-protected remote is `sri-mismatch` (SRI fail-closed semantics:
        // the browser does not distinguish "tampered" from "unfetchable" once an
        // integrity claim is set, and we defer to the integrity-bearing label).
        // Emit BEFORE re-throw so the existing failure-routing block (graceful
        // degradation / SRI fail-closed) sees the event already dispatched.
        // Re-throw so Promise.allSettled records `rejected` and the existing
        // per-remote disable / page-block decision runs unchanged.
        fireTelemetry({
          id,
          version: registry.mfes[id]?.version ?? '',
          status: 'failure',
          durationMs: Math.max(0, deps.now() - start),
          errorClass: classifyLoadError(error, descriptor.integrity !== undefined),
        });
        throw error;
      }
    })
  );

  // Report each remote that failed and decide how to handle it.
  //
  // Graceful degradation (the DEFAULT): a remote that cannot be loaded is
  // logged and registered as a DISABLED placeholder so OSD core's plugin_reader
  // (UNCHANGED) still finds a definition for every plugin in the server-injected
  // list and core boot is NOT aborted. The failed plugin is effectively disabled;
  // the rest of the app still boots.
  //
  // SRI FAIL-CLOSED: a remote that carries an `integrity` hash and FAILS to load
  // is a potential Subresource-Integrity violation (the browser refused to
  // execute bytes that did not match the pinned hash — a compromised CDN / MITM,
  // or simply unavailable bytes). We route that through the SAME env-keyed
  // policy as a version incompatibility:
  //   - dev / non-prod (`onIncompatible: 'block'`) => treat it as a page OFFENDER
  //     and HARD-BLOCK (loud block page, core does NOT boot — never run a
  //     half-verified app);
  //   - prod (`onIncompatible: 'skip'`, or no policy injected) => SKIP it (the
  //     disabled placeholder above), so the app still boots from the rest.
  // A remote WITHOUT integrity (e.g. a dev override) keeps pure graceful
  // degradation regardless of env — there is no integrity claim to have violated,
  // so a load failure cannot be an SRI failure. Because this only fires on an
  // actual load `error`, a CORRECT artifact never triggers it (no false rejects).
  const blockOnIntegrityFailure = compatPolicy?.onIncompatible === 'block';
  const failedIds: string[] = [];
  const integrityOffenders: EvaluatedRemote[] = [];
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      const id = idsToLoad[index];
      const descriptor = resolved.get(id)!;
      const hasIntegrity = descriptor.integrity !== undefined;

      if (hasIntegrity && blockOnIntegrityFailure) {
        // FAIL-CLOSED (dev block): collect as an offender; the page hard-blocks
        // below and core never boots. Do NOT register a placeholder (the app is
        // not going to start).
        integrityOffenders.push({
          id,
          compatibility: 'incompatible',
          reasons: [
            `remoteEntry failed to load from ${descriptor.remoteEntry} — the browser refused ` +
              `to execute it (Subresource Integrity mismatch against ${descriptor.integrity}, ` +
              `or the bytes were unavailable). Refusing to run unverified code ` +
              `(compat policy onIncompatible = "block").`,
          ],
        });
        // eslint-disable-next-line no-console
        console.error(
          `[mfe] Integrity verification failed for remote "${id}" (${descriptor.remoteEntry}); ` +
            `blocking startup rather than executing unverified bytes.`,
          result.reason
        );
        return;
      }

      // Graceful degradation (prod skip, no policy, or non-integrity remote).
      failedIds.push(id);
      // Classify the rejection AGAIN (cheap, pure) so the disabled-plugin
      // record carries the same `errorClass` the telemetry event already
      // emitted in the load-loop catch-block above. Two-call path keeps the
      // locked telemetry contract intact (telemetry is observational — see
      // `./telemetry.ts`) while still letting the visible-UX layer reuse the
      // same classification without coupling.
      const errorClass = classifyLoadError(result.reason, hasIntegrity);
      const version = registry.mfes[id]?.version ?? '';
      disablePlugin(id, version, errorClass);
      // eslint-disable-next-line no-console
      console.error(
        `[mfe] Failed to load remote "${id}" from ${descriptor.remoteEntry}; ` +
          `registering it as DISABLED and continuing to boot the rest of the app.`,
        result.reason
      );
    }
  });

  // FAIL-CLOSED (dev block): if any integrity-protected remote failed its SRI
  // check, render the loud block page and do NOT boot core. This reuses the same
  // hard-block surface as a version incompatibility — never a white screen
  // or a silent hang.
  if (integrityOffenders.length > 0) {
    const offenderSummary = integrityOffenders
      .map((o) => `${o.id}: ${o.reasons.join('; ')}`)
      .join('\n  - ');
    // eslint-disable-next-line no-console
    console.error(
      `[mfe] Blocking startup: ${integrityOffenders.length} remote(s) failed Subresource ` +
        `Integrity verification (compat policy onIncompatible = "block"):\n  - ${offenderSummary}`
    );
    deps.renderBlockPage(integrityOffenders);
    return;
  }

  if (failedIds.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `[mfe] ${failedIds.length} of ${ids.length} remote(s) failed to load and were disabled: ` +
        `${failedIds.join(', ')}. Affected plugins will be unavailable.`
    );
  }

  // 4. Only now — every plugin factory (real or disabled placeholder) is defined
  //    plugin_reader reads __osdBundles__ synchronously during CoreSystem start,
  //    evaluating each plugin factory (and any peer factories it pulls in) lazily.
  await deps.invokeCoreBootstrap();

  // 5. Dev-only Inspector panel, GATED by the non-production `allowOverride`
  //    flag. It lists each MFE with its resolved source (registry/CDN vs
  //    override) and lets a developer repoint a single remote.
  //    SECURITY: mounting is inside the `allowOverride` branch, so in production
  //    (gate off) the panel is NEVER rendered — the same boundary that makes
  //    `buildOverrides()` return an empty map. Mounted after core boot so it
  //    observes the booted app and never interferes with the locked load
  //    sequence above.
  //
  //    UX: even with `allowOverride` on, the panel is opt-in via a
  //    `?inspect=true` URL query parameter (see {@link inspectorRequestedByUrl}).
  //    A developer who wants to use the inspector navigates to
  //    `<page>?inspect=true`; the panel does not auto-pop on every page load.
  //    This double-gate (server-config + URL flag) keeps the panel out of
  //    the way for everyday dev work, surfaced only on demand.
  //
  //    Visible degradation: pass the collected disabled records so the panel
  //    can render its "Disabled plugins" section. The bootstrap appended a
  //    record at every disable site (compat-skip / registry-trust skip /
  //    load failure) above; an empty list = no failures = no extra section
  //    rendered.
  if (allowOverride && inspectorRequestedByUrl()) {
    deps.mountInspector(Array.from(resolved.values()), disabledPlugins);
  }
}
