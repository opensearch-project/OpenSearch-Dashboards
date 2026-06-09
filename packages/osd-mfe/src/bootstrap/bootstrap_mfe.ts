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
 * The MFE bootstrap orchestrator (Phase 3, Story 3) — the LOCKED sequence from
 * docs/01-MFE-DESIGN.md §6.
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

import { assertValidRegistry, Registry } from '../registry/schema';
import { RegistryProvider } from '../registry/provider';
import { resolve, OverrideMap, ResolvedRemote } from '../registry/resolve';
import { buildShareScope } from './share_scope';
import { getRemoteModuleFactory, loadRemoteContainer, loadScript } from './load_remote';
import {
  createDisabledPluginModule,
  invokeCoreBootstrap,
  registerPluginFactory,
} from './osd_bundles';
import { buildOverrideMap, OverrideStorage, parseOverrideSources } from './override_sources';
import { mountInspector as mountInspectorPanel } from './inspector';
import { mfeWindow } from './types';

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
   * Mount the dev-only Inspector panel (Phase 5, Story 3) for the resolved
   * remotes. The bootstrap calls this ONLY when the non-production
   * `allowOverride` gate is on (see {@link bootstrapMfe}), so the panel is never
   * mounted in production. The default mounts the real React/EUI panel and
   * swallows any render failure (the inspector is a dev convenience that must
   * NEVER break app boot); tests inject a spy.
   */
  mountInspector: (entries: ResolvedRemote[]) => void;
}

/** Inputs to {@link bootstrapMfe}. */
export interface BootstrapMfeOptions {
  /** URL of the registry document (serve-time, dynamic — e.g. `/registry`). */
  registryUrl: string;
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
   * (`mfe.allowOverride`, docs/01-MFE-DESIGN.md §7). When `false` (the DEFAULT,
   * and the only value in production), ALL override sources — query param,
   * inspector, `localStorage` — are IGNORED and every plugin loads from the
   * registry/CDN. Phase 5, Story 2 wires the real config value (injected into
   * the page, default off in prod) into this option; Story 1 only plumbs it,
   * with a safe default of `false` so no override URL can load while the gate
   * is off.
   */
  allowOverride?: boolean;
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
    mountInspector: (entries: ResolvedRemote[]) => {
      try {
        mountInspectorPanel({ entries });
      } catch (error) {
        // The inspector is a dev-only convenience; a render failure must NEVER
        // abort or degrade app boot.
        // eslint-disable-next-line no-console
        console.warn('[mfe] dev inspector failed to mount; continuing without it.', error);
      }
    },
    ...overrides,
  };
}

/**
 * Build the dev-override {@link OverrideMap} for the current registry, GATED by
 * the non-production `allowOverride` flag.
 *
 * SECURITY (docs/01-MFE-DESIGN.md §7): when the gate is off (production, the
 * default), this returns an EMPTY map so `resolve()` always yields the
 * registry/CDN URL and no override source can load arbitrary remote code. When
 * the gate is on (dev), query-param and `localStorage` sources are parsed and
 * expanded against the registry entries.
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
 * Boot OSD's UI from Module Federation remotes. Resolves once core boot has
 * been invoked (and, for the default core bootstrap, once it completes).
 *
 * Individual remote-load failures are tolerated (Phase 4, Story 5): a remote
 * that cannot be loaded is logged and registered as a DISABLED placeholder
 * (so OSD core's plugin_reader still resolves it) rather than aborting boot.
 * Only the fatal prerequisites still throw.
 *
 * @throws if shared deps are unavailable, the registry fetch fails, or the
 *   registry is invalid. A single remote that cannot be loaded is logged and
 *   disabled (it does NOT throw / abort boot).
 */
export async function bootstrapMfe(options: BootstrapMfeOptions): Promise<void> {
  const { registryUrl, sharedDepsUrl, sharedDepsDepUrls, allowOverride = false } = options;
  const deps = resolveDeps(options.deps);

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

  // 2. Fetch the current registry at serve time.
  const response = await deps.fetchImpl(registryUrl, { credentials: 'omit' });
  if (!response.ok) {
    throw new Error(`Failed to fetch MFE registry from ${registryUrl}: HTTP ${response.status}`);
  }
  const registry = assertValidRegistry(await response.json());

  // 2b. Build the dev-override map (GATED: empty unless `allowOverride`), and
  //     wrap the registry as a provider so each remote is resolved through the
  //     shared `resolve()` contract — an overridden id yields the override URL,
  //     everything else the registry/CDN URL. See docs/01-MFE-DESIGN.md §7.
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
  //    Graceful degradation (Phase 4, Story 5): we use Promise.allSettled rather
  //    than Promise.all so a single failed or missing remote (e.g. one unreachable
  //    CDN object among the 58) does NOT abort the whole app boot. Each remote that
  //    fails is logged and registered as a DISABLED placeholder (see below) so that
  //    OSD core's plugin_reader still finds a definition for it and the remaining
  //    plugins boot normally. A plugin that hard-depends on a failed peer's exports
  //    may still surface its own error, but a leaf/optional plugin degrades cleanly.
  const ids = Object.keys(registry.mfes);
  // Pre-resolve each id (override URL wins over registry) so both the loader and
  // the failure log below reference the EFFECTIVE remoteEntry. ids come from the
  // registry, so resolve() never returns null here (the empty filter is defensive).
  const resolved = new Map<string, ResolvedRemote>();
  for (const id of ids) {
    const descriptor = resolve(provider, id, overrides);
    if (descriptor !== null) {
      resolved.set(id, descriptor);
    }
  }
  const results = await Promise.allSettled(
    ids.map(async (id) => {
      const descriptor = resolved.get(id)!;
      const container = await deps.loadRemoteContainer(descriptor.remoteEntry, descriptor.scope);
      const factory = await deps.getRemoteModuleFactory(container, shareScope, descriptor.module);
      deps.registerPluginFactory(id, factory);
    })
  );

  // Report each remote that failed and register an INERT placeholder in its
  // place so OSD core's plugin_reader (UNCHANGED) finds a definition for every
  // plugin in the server-injected list and core boot is NOT aborted. The failed
  // plugin is effectively disabled; the rest of the app still boots.
  const failedIds: string[] = [];
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      const id = ids[index];
      failedIds.push(id);
      deps.registerPluginFactory(id, createDisabledPluginModule);
      // eslint-disable-next-line no-console
      console.error(
        `[mfe] Failed to load remote "${id}" from ${resolved.get(id)!.remoteEntry}; ` +
          `registering it as DISABLED and continuing to boot the rest of the app.`,
        result.reason
      );
    }
  });
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

  // 5. Dev-only Inspector panel (Phase 5, Story 3), GATED by the non-production
  //    `allowOverride` flag. It lists each MFE with its resolved source
  //    (registry/CDN vs override) and lets a developer repoint a single remote.
  //    SECURITY: mounting is inside the `allowOverride` branch, so in production
  //    (gate off) the panel is NEVER rendered — the same boundary that makes
  //    `buildOverrides()` return an empty map. Mounted after core boot so it
  //    observes the booted app and never interferes with the locked load
  //    sequence above.
  if (allowOverride) {
    deps.mountInspector(Array.from(resolved.values()));
  }
}
