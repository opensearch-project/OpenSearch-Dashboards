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
import Fs from 'fs';
import { promisify } from 'util';

const existsAsync = promisify(Fs.exists);

export async function findOpenSearchDashboardsJson(directory: string): Promise<string | undefined> {
  if (await existsAsync(Path.resolve(directory, 'opensearch_dashboards.json'))) {
    return directory;
  }

  const parent = Path.dirname(directory);
  if (parent === directory) {
    return undefined;
  }

  return findOpenSearchDashboardsJson(parent);
}
