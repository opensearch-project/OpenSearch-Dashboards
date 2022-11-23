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

import { simpleOpenSearchDashboardsPlatformExtensionDiscovery } from '@osd/dev-utils';

export interface OpenSearchDashboardsPlatformExtension {
  readonly directory: string;
  readonly manifestPath: string;
  readonly extensionId: string;
  readonly isUiExtension: boolean;
  readonly extraPublicDirs: string[];
}

const isArrayOfStrings = (input: any): input is string[] =>
  Array.isArray(input) && input.every((p) => typeof p === 'string');

/**
 * Helper to find the new platform extensions.
 */
export function findOpenSearchDashboardsPlatformExtensions(scanDirs: string[], paths: string[]) {
  return simpleOpenSearchDashboardsPlatformExtensionDiscovery(scanDirs, paths).map(
    ({ directory, manifestPath, manifest }): OpenSearchDashboardsPlatformExtension => {
      let extraPublicDirs: string[] | undefined;
      if (manifest.extraPublicDirs) {
        if (!isArrayOfStrings(manifest.extraPublicDirs)) {
          throw new TypeError(
            'expected new platform extension manifest to have an array of strings `extraPublicDirs` property'
          );
        }
        extraPublicDirs = manifest.extraPublicDirs;
      }

      return {
        directory,
        manifestPath,
        extensionId: manifest.extensionId,
        isUiExtension: manifest.ui,
        extraPublicDirs: extraPublicDirs || [],
      };
    }
  );
}
