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

/**
 * sha256 of every Node.js archive the build downloads, committed for the version in
 * `.node-version` so a download is never checked against data from the same server.
 * Regenerate with `node scripts/update_node_checksums <version>`.
 */
export const NODE_CHECKSUMS_PATH = resolve(__dirname, 'node_checksums.json');

export async function getNodeShasums(log: ToolingLog, nodeVersion: string) {
  const { version, sha256 } = JSON.parse(readFileSync(NODE_CHECKSUMS_PATH, 'utf8')) as {
    version: string;
    sha256: Record<string, string>;
  };

  if (version !== nodeVersion) {
    throw new Error(
      `${NODE_CHECKSUMS_PATH} has checksums for Node.js ${version}, but .node-version is ${nodeVersion}. ` +
        `Run: node scripts/update_node_checksums ${nodeVersion}`
    );
  }

  log.debug('Using committed checksums for Node.js', nodeVersion);
  return sha256;
}
