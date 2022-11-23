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

import { ExtensionInitializer } from './extension';

/**
 * Unknown variant for internal use only for when extensions are not known.
 * @internal
 */
export type UnknownExtensionInitializer = ExtensionInitializer<unknown, Record<string, unknown>>;

/**
 * Custom window type for loading bundles. Do not extend global Window to avoid leaking these types.
 * @internal
 */
export interface CoreWindow {
  __osdBundles__: {
    has(key: string): boolean;
    get(key: string): { extension: UnknownExtensionInitializer } | undefined;
  };
}

/**
 * Reads the extension's bundle declared in the global context.
 */
export function read(name: string) {
  const coreWindow = (window as unknown) as CoreWindow;
  const exportId = `extension/${name}/public`;

  if (!coreWindow.__osdBundles__.has(exportId)) {
    throw new Error(`Definition of extension "${name}" not found and may have failed to load.`);
  }

  const extensionExport = coreWindow.__osdBundles__.get(exportId);
  if (typeof extensionExport?.extension !== 'function') {
    throw new Error(`Definition of extension "${name}" should be a function.`);
  } else {
    return extensionExport.extension;
  }
}
