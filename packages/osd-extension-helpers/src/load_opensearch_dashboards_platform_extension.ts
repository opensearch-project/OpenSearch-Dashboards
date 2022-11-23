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

import { REPO_ROOT } from '@osd/utils';
import {
  parseOpenSearchDashboardsPlatformExtension,
  OpenSearchDashboardsPlatformExtension,
  createFailError,
} from '@osd/dev-utils';

export type Extension = OpenSearchDashboardsPlatformExtension;

export function loadOpenSearchDashboardsPlatformExtension(extensionDir: string) {
  const parentDir = Path.resolve(extensionDir, '..');

  const isFixture = extensionDir.includes('__fixtures__');
  const isExample = Path.basename(parentDir) === 'examples';
  const isRootExtension = parentDir === Path.resolve(REPO_ROOT, 'extensions');

  if (isFixture || isExample || isRootExtension) {
    return parseOpenSearchDashboardsPlatformExtension(
      Path.resolve(extensionDir, 'opensearch_dashboards.json')
    );
  }

  throw createFailError(
    `Extension located at [${extensionDir}] must be moved to the extensions directory at the root of the OpenSearch Dashboards repo`
  );
}
