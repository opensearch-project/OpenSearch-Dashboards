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

import { scanCopy, Task } from '../lib';
import { getNodeDownloadInfo, getNodeVersionDownloadInfo, NODE14_FALLBACK_VERSION } from './nodejs';

export const CreateArchivesSources: Task = {
  description: 'Creating platform-specific archive source directories',
  async run(config, log, build) {
    await Promise.all(
      config.getTargetPlatforms().map(async (platform) => {
        // copy all files from generic build source directory into platform-specific build directory
        await scanCopy({
          source: build.resolvePath(),
          destination: build.resolvePathForPlatform(platform),
        });

        log.debug(
          'Generic build source copied into',
          platform.getNodeArch(),
          'specific build directory'
        );

        // copy node.js install
        await scanCopy({
          source: (await getNodeDownloadInfo(config, platform)).extractDir,
          destination: build.resolvePathForPlatform(platform, 'node'),
        });

        // ToDo [NODE14]: Remove this Node.js 14 fallback download
        // Copy the Node.js 14 binaries into node/fallback to be used by `use_node`
        await scanCopy({
          source: (
            await getNodeVersionDownloadInfo(
              NODE14_FALLBACK_VERSION,
              platform.getNodeArch(),
              platform.isWindows(),
              config.resolveFromRepo()
            )
          ).extractDir,
          destination: build.resolvePathForPlatform(platform, 'node', 'fallback'),
        });

        log.debug('Node.js copied into', platform.getNodeArch(), 'specific build directory');
      })
    );
  },
};
