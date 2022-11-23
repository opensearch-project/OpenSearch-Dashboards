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

import globby from 'globby';

import { parseOpenSearchDashboardsPlatformExtension } from './parse_opensearch_dashboards_platform_extension';

/**
 * Helper to find the new platform extensions.
 */
export function simpleOpenSearchDashboardsPlatformExtensionDiscovery(
  scanDirs: string[],
  extensionPaths: string[]
) {
  const patterns = Array.from(
    new Set([
      // find opensearch_dashboards.json files up to 5 levels within the scan dir
      ...scanDirs.reduce(
        (acc: string[], dir) => [
          ...acc,
          Path.resolve(dir, '*/opensearch_dashboards.json'),
          Path.resolve(dir, '*/*/opensearch_dashboards.json'),
          Path.resolve(dir, '*/*/*/opensearch_dashboards.json'),
          Path.resolve(dir, '*/*/*/*/opensearch_dashboards.json'),
          Path.resolve(dir, '*/*/*/*/*/opensearch_dashboards.json'),
        ],
        []
      ),
      ...extensionPaths.map((path) => Path.resolve(path, `opensearch_dashboards.json`)),
    ])
  );

  const manifestPaths = globby.sync(patterns, { absolute: true }).map((path) =>
    // absolute paths returned from globby are using normalize or
    // something so the path separators are `/` even on windows,
    // Path.resolve solves this
    Path.resolve(path)
  );

  return manifestPaths.map(parseOpenSearchDashboardsPlatformExtension);
}
