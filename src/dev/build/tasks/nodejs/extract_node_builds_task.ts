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

import { untar, unzip, GlobalTask } from '../../lib';
import {
  getNodeDownloadInfo,
  getNodeVersionDownloadInfo,
  NODE14_FALLBACK_VERSION,
} from './node_download_info';

export const ExtractNodeBuilds: GlobalTask = {
  global: true,
  description: 'Extracting node.js builds for all platforms',
  async run(config, log) {
    await Promise.all([
      ...config.getTargetPlatforms().map(async (platform) => {
        const { downloadPath, extractDir } = await getNodeDownloadInfo(config, platform);
        if (platform.isWindows()) {
          await unzip(downloadPath, extractDir, { strip: 1 });
        } else {
          await untar(downloadPath, extractDir, { strip: 1 });
        }
      }),
      // ToDo [NODE14]: Remove this Node.js 14 fallback download
      ...config.getTargetPlatforms().map(async (platform) => {
        if (platform.getBuildName() === 'darwin-arm64') {
          log.warning(`There are no fallback Node.js versions released for darwin-arm64.`);
          return;
        }
        const { downloadPath, extractDir } = await getNodeVersionDownloadInfo(
          NODE14_FALLBACK_VERSION,
          platform.getNodeArch(),
          platform.isWindows(),
          config.resolveFromRepo()
        );
        if (platform.isWindows()) {
          await unzip(downloadPath, extractDir, { strip: 1 });
        } else {
          await untar(downloadPath, extractDir, { strip: 1 });
        }
      }),
    ]);
  },
};
