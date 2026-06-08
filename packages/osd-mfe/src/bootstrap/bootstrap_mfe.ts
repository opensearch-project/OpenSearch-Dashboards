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

import { assertValidRegistry } from '../registry/schema';
import { buildShareScope } from './share_scope';
import { getRemoteModule, loadRemoteContainer, loadScript } from './load_remote';
import { invokeCoreBootstrap, registerPlugin } from './osd_bundles';
import { mfeWindow } from './types';

/**
 * Collaborators of {@link bootstrapMfe}, injectable for unit testing. Each
 * defaults to the real implementation in production.
 */
export interface BootstrapMfeDeps {
  loadScript: typeof loadScript;
  loadRemoteContainer: typeof loadRemoteContainer;
  getRemoteModule: typeof getRemoteModule;
  registerPlugin: typeof registerPlugin;
  invokeCoreBootstrap: typeof invokeCoreBootstrap;
  fetchImpl: typeof fetch;
}

/** Inputs to {@link bootstrapMfe}. */
export interface BootstrapMfeOptions {
  /** URL of the registry document (serve-time, dynamic — e.g. `/registry`). */
  registryUrl: string;
  /** URL of the shared-deps bundle that assigns `window.__osdSharedDeps__`. */
  sharedDepsUrl: string;
  /** Optional collaborator overrides (used by tests). */
  deps?: Partial<BootstrapMfeDeps>;
}

function resolveDeps(overrides?: Partial<BootstrapMfeDeps>): BootstrapMfeDeps {
  return {
    loadScript,
    loadRemoteContainer,
    getRemoteModule,
    registerPlugin,
    invokeCoreBootstrap,
    // Bind so the default `fetch` keeps its `window` receiver.
    fetchImpl: ((input: RequestInfo | URL, init?: RequestInit) =>
      window.fetch(input, init)) as typeof fetch,
    ...overrides,
  };
}

/**
 * Boot OSD's UI from Module Federation remotes. Resolves once core boot has
 * been invoked (and, for the default core bootstrap, once it completes).
 *
 * @throws if shared deps are unavailable, the registry fetch fails, the
 *   registry is invalid, or a remote cannot be loaded.
 */
export async function bootstrapMfe(options: BootstrapMfeOptions): Promise<void> {
  const { registryUrl, sharedDepsUrl } = options;
  const deps = resolveDeps(options.deps);

  // 1. Load shared deps and seed the MF share scope (singletons).
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

  // 3. Load every plugin remote and register it into the __osdBundles__ shim.
  //    All remotes share the SAME share scope object, so singletons stay single.
  await Promise.all(
    Object.keys(registry.mfes).map(async (id) => {
      const entry = registry.mfes[id];
      const container = await deps.loadRemoteContainer(entry.remoteEntry, entry.scope);
      const mod = await deps.getRemoteModule(container, shareScope, entry.module);
      deps.registerPlugin(id, mod);
    })
  );

  // 4. Only now — every plugin shim is in place — drive core boot. plugin_reader
  //    reads __osdBundles__ synchronously during CoreSystem start, so this MUST
  //    run after step 3 completes.
  await deps.invokeCoreBootstrap();
}
