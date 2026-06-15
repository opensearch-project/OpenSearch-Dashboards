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
 * Loading Module Federation remote containers in the browser (Phase 3, Story 3).
 *
 * A remote's `remoteEntry.js`, once executed, registers a container global on
 * `window[scope]`. We then seed the container's share scope (once) and resolve
 * the exposed `./public` module to the plugin's public exports. See
 * docs/01-MFE-DESIGN.md §6.
 */

import { MfeContainer, PluginPublicModule, ShareScope, mfeWindow } from './types';

/**
 * Inject a `<script>` and resolve when it loads (reject on error).
 *
 * `async = false` preserves execution order for scripts appended in sequence;
 * the bootstrap awaits each load explicitly regardless.
 *
 * Subresource Integrity (Phase 12, Story 2): when an `integrity` hash is supplied
 * (`sha384-…`, from the registry entry), it is set on the element together with
 * `crossorigin="anonymous"` so the browser verifies the DECODED (uncompressed)
 * response bytes against the hash and REFUSES to execute a tampered/MITM'd script
 * — a mismatch fires `error` (not `load`), so this Promise REJECTS rather than
 * running unverified code. `crossorigin` is REQUIRED for SRI enforcement on a
 * cross-origin script (and for the integrity to be checked at all); the CDN/origin
 * already answer CORS (ACAO:* locally / Managed-CORS-with-preflight on the CDN), so
 * the anonymous (no-credentials) request succeeds. When NO integrity is known
 * (e.g. a dev override, whose bytes differ from the registry build — see
 * `resolve()`), neither attribute is set so the load keeps its prior,
 * no-CORS-required behavior.
 *
 * @param url absolute URL of the script to inject
 * @param integrity optional SRI hash (`sha384-…`); enables `crossorigin` + integrity
 */
export function loadScript(url: string, integrity?: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const el = document.createElement('script');
    el.src = url;
    el.type = 'text/javascript';
    el.async = false;
    if (integrity) {
      // Setting both is deliberate: SRI on a cross-origin script is only enforced
      // when the request is made in CORS mode. We gate `crossorigin` on the
      // presence of integrity so non-integrity loads (shared-deps, dev overrides)
      // do not suddenly require CORS headers they were not relying on before.
      el.integrity = integrity;
      el.crossOrigin = 'anonymous';
    }
    el.onload = () => resolve();
    el.onerror = () =>
      reject(
        new Error(
          integrity
            ? `Failed to load script: ${url} ` +
              `(Subresource Integrity check failed or the script could not be fetched)`
            : `Failed to load script: ${url}`
        )
      );
    document.head.appendChild(el);
  });
}

/**
 * Load a remote's `remoteEntry.js` and return its container global.
 *
 * @param remoteEntry absolute URL of the remote's `remoteEntry.js`
 * @param scope the container global name (the plugin id / MF container `name`)
 * @param integrity optional SRI hash for `remoteEntry` (from the registry entry);
 *   when present the browser integrity-checks the script and this rejects on a
 *   mismatch instead of executing tampered bytes. Absent for dev overrides.
 * @throws if the integrity check fails, the script cannot be fetched, or the
 *   container global is missing or malformed after the load
 */
export async function loadRemoteContainer(
  remoteEntry: string,
  scope: string,
  integrity?: string
): Promise<MfeContainer> {
  await loadScript(remoteEntry, integrity);

  const container = mfeWindow()[scope] as MfeContainer | undefined;
  if (!container || typeof container.get !== 'function' || typeof container.init !== 'function') {
    throw new Error(`Remote container "${scope}" not found after loading ${remoteEntry}`);
  }
  return container;
}

/**
 * Containers we have already `init`-ed. A container may only be initialised
 * once; tracking avoids a double-init when (re)used.
 */
const initialized = new WeakSet<MfeContainer>();

/**
 * Seed the container's share scope (once) and resolve an exposed module.
 *
 * @param container a container returned by {@link loadRemoteContainer}
 * @param shareScope the shared scope to seed (pass the SAME object to every
 *   container so singletons resolve to one shared copy)
 * @param moduleKey the exposed module key (e.g. `./public`)
 * @returns the plugin's exposed `./public` module exports
 */
export async function getRemoteModule(
  container: MfeContainer,
  shareScope: ShareScope,
  moduleKey: string
): Promise<PluginPublicModule> {
  const factory = await getRemoteModuleFactory(container, shareScope, moduleKey);
  return factory();
}

/**
 * Seed the container's share scope (once) and resolve the exposed module's
 * FACTORY — without invoking it. The factory (`() => module`) is synchronous and
 * memoized by the container, so calling it later returns the same exports.
 *
 * This lazy form is what the bootstrap registers into the `__osdBundles__` shim:
 * every plugin's factory is defined BEFORE any is evaluated, so when a plugin's
 * module is finally evaluated (during core boot) and it pulls in a peer plugin via
 * `__osdBundles__.get('plugin/<id>/public')`, that peer's factory is already
 * defined and resolves synchronously — mirroring how the optimizer's
 * `__osdBundles__.define(id, () => require(...))` thunks resolve lazily. Evaluating
 * eagerly here instead would call a peer's `get` before it was registered (remotes
 * load concurrently), throwing "__osdBundles__ does not have a module defined".
 *
 * @returns the exposed module's factory (call it to obtain the module exports)
 */
export async function getRemoteModuleFactory(
  container: MfeContainer,
  shareScope: ShareScope,
  moduleKey: string
): Promise<() => PluginPublicModule> {
  if (!initialized.has(container)) {
    await container.init(shareScope);
    initialized.add(container);
  }
  const factory = await container.get(moduleKey);
  return factory as () => PluginPublicModule;
}
