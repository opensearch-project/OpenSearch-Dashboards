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

import globby from 'globby';

import { getFileHashes, write, GlobalTask } from '../lib';

export const WriteShaSums: GlobalTask = {
  global: true,
  description: 'Writing sha1 and sha256 checksums of archives and packages in target directory',

  async run(config) {
    const artifacts = await globby(['*.zip', '*.tar.gz', '*.deb', '*.rpm'], {
      cwd: config.resolveFromTarget('.'),
      absolute: true,
    });

    // Process artifacts sequentially: the single-pass getFileHashes() already halves the
    // disk reads per artifact (the gain that matters), and parallel streaming across all
    // artifacts would open N ReadStreams at once and lose the old code's error-containment
    // behaviour (one bad artifact aborts the rest of the loop immediately).
    for (const artifact of artifacts) {
      const { sha1, sha256 } = await getFileHashes(artifact, ['sha1', 'sha256'] as const);
      await Promise.all([
        write(`${artifact}.sha1.txt`, sha1),
        write(`${artifact}.sha256.txt`, sha256),
      ]);
    }
  },
};
