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

import { Bundle } from '../common';

import { OpenSearchDashboardsPlatformExtension } from './opensearch_dashboards_platform_extensions';

export function getExtensionBundles(
  extensions: OpenSearchDashboardsPlatformExtension[],
  repoRoot: string,
  outputRoot: string
) {
  return extensions
    .filter((p) => p.isUiExtension)
    .map(
      (p) =>
        new Bundle({
          type: 'extension',
          id: p.extensionId,
          publicDirNames: ['public', ...p.extraPublicDirs],
          sourceRoot: repoRoot,
          contextDir: p.directory,
          outputDir: Path.resolve(
            outputRoot,
            Path.relative(repoRoot, p.directory),
            'target/public'
          ),
          manifestPath: p.manifestPath,
          banner: undefined,
        })
    );
}
