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
 * Bridging remote-loaded plugins into the `__osdBundles__` shim, and triggering
 * core boot (Phase 3, Story 3).
 *
 * `src/core/public/plugins/plugin_reader.ts` (UNCHANGED) reads
 * `window.__osdBundles__` SYNCHRONOUSLY during `CoreSystem` start, looking up
 * `plugin/<id>/public` and expecting `get(key)` to return an object whose
 * `.plugin` is a function. The shim's `define(key, thunk)` stores a thunk that
 * `get(key)` later calls, so we register a plugin by defining a thunk that
 * returns the already-loaded remote module. See docs/01-MFE-DESIGN.md §6 and
 * src/legacy/ui/ui_render/bootstrap/osd_bundles_loader_source.js.
 */

import { CoreEntryModule, PluginPublicModule, mfeWindow } from './types';

/** The `__osdBundles__` key a plugin is registered under. */
export function pluginBundleKey(id: string): string {
  return `plugin/${id}/public`;
}

/**
 * Register a remote-loaded plugin module into the `__osdBundles__` shim so
 * `plugin_reader` resolves it synchronously, exactly as if it had been loaded
 * from a local `plugin/<id>/public` bundle. No-op if already registered (the
 * shim's `define` throws on duplicate keys, so we guard with `has`).
 */
export function registerPlugin(id: string, mod: PluginPublicModule): void {
  const w = mfeWindow();
  const key = pluginBundleKey(id);
  if (w.__osdBundles__.has(key)) {
    return;
  }
  w.__osdBundles__.define(key, () => mod);
}

/** Whether a plugin id is already present in the `__osdBundles__` shim. */
export function isPluginRegistered(id: string): boolean {
  return mfeWindow().__osdBundles__.has(pluginBundleKey(id));
}

/**
 * Invoke core boot via the server-provided core entry bundle, mirroring
 * `bootstrap.js.hbs`: `__osdBundles__.get('entry/core/public').__osdBootstrap__()`.
 * MUST be called only AFTER every plugin shim is registered.
 */
export function invokeCoreBootstrap(): Promise<void> {
  const core = mfeWindow().__osdBundles__.get('entry/core/public') as CoreEntryModule;
  return core.__osdBootstrap__();
}
