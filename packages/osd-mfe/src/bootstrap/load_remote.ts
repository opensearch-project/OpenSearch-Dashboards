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
 */
export function loadScript(url: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const el = document.createElement('script');
    el.src = url;
    el.type = 'text/javascript';
    el.async = false;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    document.head.appendChild(el);
  });
}

/**
 * Load a remote's `remoteEntry.js` and return its container global.
 *
 * @param remoteEntry absolute URL of the remote's `remoteEntry.js`
 * @param scope the container global name (the plugin id / MF container `name`)
 * @throws if the container global is missing or malformed after the load
 */
export async function loadRemoteContainer(
  remoteEntry: string,
  scope: string
): Promise<MfeContainer> {
  await loadScript(remoteEntry);

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
  if (!initialized.has(container)) {
    await container.init(shareScope);
    initialized.add(container);
  }
  const factory = await container.get(moduleKey);
  return factory() as PluginPublicModule;
}
