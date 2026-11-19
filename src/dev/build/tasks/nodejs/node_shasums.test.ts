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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { ToolingLog } from '@osd/dev-utils';

import { ALL_PLATFORMS } from '../../lib/platform';
import { getNodeVersionDownloadInfo } from './node_download_info';
import { getNodeShasums, NODE_CHECKSUMS_PATH } from './node_shasums';

const REPO_ROOT = resolve(__dirname, '../../../../..');
const committed = JSON.parse(readFileSync(NODE_CHECKSUMS_PATH, 'utf8'));
const log = new ToolingLog();

describe('getNodeShasums', () => {
  it('returns the committed checksums for the pinned version', async () => {
    const pinned = readFileSync(resolve(REPO_ROOT, '.node-version'), 'utf8').trim();
    await expect(getNodeShasums(log, pinned)).resolves.toEqual(committed.sha256);
  });

  it('refuses a version it has no checksums for', async () => {
    await expect(getNodeShasums(log, '99.99.99')).rejects.toThrow(
      'Run: node scripts/update_node_checksums 99.99.99'
    );
  });

  it('has a sha256 for every archive the build downloads', async () => {
    for (const platform of ALL_PLATFORMS) {
      const { downloadName } = await getNodeVersionDownloadInfo(
        committed.version,
        platform.getNodeArch(),
        platform.isWindows(),
        REPO_ROOT
      );
      expect(committed.sha256[downloadName]).toMatch(/^[a-f0-9]{64}$/);
    }
    expect(Object.keys(committed.sha256)).toHaveLength(ALL_PLATFORMS.length);
  });
});
