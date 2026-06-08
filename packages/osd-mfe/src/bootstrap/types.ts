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
 * Browser-runtime contracts for the MFE bootstrap (Phase 3, Story 3).
 *
 * These types describe the globals the bootstrap touches at runtime — the
 * Module Federation share scope, a loaded remote container, the `__osdBundles__`
 * shim that `plugin_reader.ts` reads synchronously, and the shared-deps global —
 * so the bootstrap can be written and unit-tested without `any`/casts beyond a
 * single `window` narrowing. See docs/01-MFE-DESIGN.md §6.
 */

/**
 * One entry in a Module Federation share scope: a host-provided shared module
 * keyed by version. `get` returns a *factory* (calling it yields the module
 * exports), matching the webpack/rspack MF runtime contract.
 */
export interface SharedModuleRecord {
  /** Returns a factory; invoking the factory returns the module exports. */
  get: () => unknown;
  /** Origin marker; `'host'` for modules the host page provides. */
  from: string;
  /** Whether the module is already available without an async load. */
  eager?: boolean;
  /** Loaded marker used by the MF runtime (`1` = already loaded). */
  loaded?: number;
}

/**
 * A Module Federation share scope: package name → version → shared module.
 * The SAME object reference is passed to every container so singletons (react,
 * react-dom, …) resolve to one shared copy.
 */
export type ShareScope = Record<string, Record<string, SharedModuleRecord>>;

/**
 * A Module Federation remote container, as exposed on `window[scope]` after its
 * `remoteEntry.js` loads (rspack `@rspack/core` 1.6.4, webpack5-compatible).
 */
export interface MfeContainer {
  /** Seed the container's share scope. Idempotent per container in our usage. */
  init: (shareScope: ShareScope) => void | Promise<void>;
  /** Resolve an exposed module key (e.g. `./public`) to its factory. */
  get: (module: string) => Promise<() => unknown>;
}

/**
 * Shape of a plugin's exposed `./public` module. `plugin_reader.ts` only
 * requires `.plugin` to be a function (the `PluginInitializer`).
 */
export interface PluginPublicModule {
  plugin: (...args: unknown[]) => unknown;
}

/**
 * The `window.__osdBundles__` shim contract (see
 * src/legacy/ui/ui_render/bootstrap/osd_bundles_loader_source.js). It is a plain
 * object — NOT a Map. `define` stores a thunk; `get` CALLS that thunk and
 * returns its result.
 */
export interface OsdBundlesShim {
  has(key: string): boolean;
  get(key: string): unknown;
  define(key: string, bundleRequire: () => unknown): void;
}

/**
 * The core entry module registered under `entry/core/public`; its
 * `__osdBootstrap__` drives `CoreSystem.setup()/start()`.
 */
export interface CoreEntryModule {
  __osdBootstrap__: () => Promise<void>;
}

/**
 * The subset of `window` the MFE bootstrap relies on. The index signature
 * covers the dynamically-named remote container globals (`window[scope]`).
 */
export interface MfeBrowserWindow {
  __osdBundles__: OsdBundlesShim;
  __osdSharedDeps__: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Narrow the ambient `window` to {@link MfeBrowserWindow}. Centralised so the
 * `as unknown as` cast lives in exactly one place.
 */
export function mfeWindow(): MfeBrowserWindow {
  return (window as unknown) as MfeBrowserWindow;
}
