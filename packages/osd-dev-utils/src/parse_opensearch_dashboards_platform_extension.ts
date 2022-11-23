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

import Path from 'path';
import loadJsonFile from 'load-json-file';

export interface OpenSearchDashboardsPlatformExtension {
  readonly directory: string;
  readonly manifestPath: string;
  readonly manifest: {
    extensionId: string;
    ui: boolean;
    server: boolean;
    [key: string]: unknown;
  };
}

export function parseOpenSearchDashboardsPlatformExtension(
  manifestPath: string
): OpenSearchDashboardsPlatformExtension {
  if (!Path.isAbsolute(manifestPath)) {
    throw new TypeError('expected new platform manifest path to be absolute');
  }

  const manifest = loadJsonFile.sync(manifestPath);
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new TypeError('expected new platform extension manifest to be a JSON encoded object');
  }

  if (typeof manifest.extensionId !== 'string') {
    throw new TypeError('expected new platform extension manifest to have a string extensionId');
  }

  return {
    directory: Path.dirname(manifestPath),
    manifestPath,
    manifest: {
      ...manifest,
      ui: !!manifest.ui,
      server: !!manifest.server,
      extensionId: manifest.extensionId,
    },
  };
}
