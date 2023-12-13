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

import {
  ToolingLog,
  ToolingLogCollectingWriter,
  createAnyInstanceSerializer,
} from '@osd/dev-utils';

import { Config, Platform } from '../../lib';
import { DownloadNodeBuilds } from './download_node_builds_task';
import { stripAnsiSnapshotSerializer } from '../../../../core/test_helpers/strip_ansi_snapshot_serializer';

jest.mock('./node_shasums');
jest.mock('./node_download_info');
jest.mock('../../lib/download');
jest.mock('../../lib/get_build_number');

expect.addSnapshotSerializer(createAnyInstanceSerializer(ToolingLog));
expect.addSnapshotSerializer(stripAnsiSnapshotSerializer);

const { getNodeDownloadInfo, getNodeVersionDownloadInfo } = jest.requireMock(
  './node_download_info'
);
const { getNodeShasums } = jest.requireMock('./node_shasums');
const { download } = jest.requireMock('../../lib/download');

const log = new ToolingLog();
const testWriter = new ToolingLogCollectingWriter();
log.setWriters([testWriter]);

beforeEach(() => {
  testWriter.messages.length = 0;
  jest.clearAllMocks();
});

async function setup({ failOnUrl }: { failOnUrl?: string } = {}) {
  const config = await Config.create({
    isRelease: true,
    targetAllPlatforms: true,
    targetPlatforms: {
      linux: false,
      linuxArm: false,
      darwin: false,
      darwinArm: false,
      windows: false,
    },
  });

  getNodeDownloadInfo.mockImplementation((_: Config, platform: Platform) => {
    return {
      url: `${platform.getName()}:url`,
      downloadPath: `${platform.getName()}:downloadPath`,
      downloadName: `${platform.getName()}:downloadName`,
    };
  });

  getNodeVersionDownloadInfo.mockImplementation(
    (version: string, architecture: string, isWindows: boolean, repoRoot: string) => {
      return {
        url: `https://mirrors.nodejs.org/dist/v${version}/node-v${version}-${architecture}.tar.gz`,
        downloadName: `node-v${version}-${architecture}.tar.gz`,
        downloadPath: `/mocked/path/.node_binaries/${version}/node-v${version}-${architecture}.tar.gz`,
        extractDir: `/mocked/path/.node_binaries/${version}/${architecture}`,
        version,
      };
    }
  );

  getNodeShasums.mockReturnValue({
    'linux:downloadName': 'linux:sha256',
    'linux-arm64:downloadName': 'linux-arm64:sha256',
    'darwin:downloadName': 'darwin:sha256',
    'darwin-arm64:downloadName': 'darwin-arm64:sha256',
    'win32:downloadName': 'win32:sha256',
  });

  download.mockImplementation(({ url }: any) => {
    if (url === failOnUrl) {
      throw new Error('Download failed for reasons');
    }
  });

  return { config };
}

it('downloads node builds for each platform', async () => {
  const { config } = await setup();

  await DownloadNodeBuilds.run(config, log, []);

  expect(download.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "destination": "linux:downloadPath",
          "log": <ToolingLog>,
          "retries": 3,
          "sha256": "linux:sha256",
          "url": "linux:url",
        },
      ],
      Array [
        Object {
          "destination": "linux:downloadPath",
          "log": <ToolingLog>,
          "retries": 3,
          "sha256": "linux:sha256",
          "url": "linux:url",
        },
      ],
      Array [
        Object {
          "destination": "darwin:downloadPath",
          "log": <ToolingLog>,
          "retries": 3,
          "sha256": "darwin:sha256",
          "url": "darwin:url",
        },
      ],
      Array [
        Object {
          "destination": "darwin:downloadPath",
          "log": <ToolingLog>,
          "retries": 3,
          "sha256": "darwin:sha256",
          "url": "darwin:url",
        },
      ],
      Array [
        Object {
          "destination": "win32:downloadPath",
          "log": <ToolingLog>,
          "retries": 3,
          "sha256": "win32:sha256",
          "url": "win32:url",
        },
      ],
      Array [
        Object {
          "destination": "/mocked/path/.node_binaries/14.21.3/node-v14.21.3-linux-x64.tar.gz",
          "log": <ToolingLog>,
          "retries": 3,
          "sha256": undefined,
          "url": "https://mirrors.nodejs.org/dist/v14.21.3/node-v14.21.3-linux-x64.tar.gz",
        },
      ],
      Array [
        Object {
          "destination": "/mocked/path/.node_binaries/14.21.3/node-v14.21.3-linux-arm64.tar.gz",
          "log": <ToolingLog>,
          "retries": 3,
          "sha256": undefined,
          "url": "https://mirrors.nodejs.org/dist/v14.21.3/node-v14.21.3-linux-arm64.tar.gz",
        },
      ],
      Array [
        Object {
          "destination": "/mocked/path/.node_binaries/14.21.3/node-v14.21.3-darwin-x64.tar.gz",
          "log": <ToolingLog>,
          "retries": 3,
          "sha256": undefined,
          "url": "https://mirrors.nodejs.org/dist/v14.21.3/node-v14.21.3-darwin-x64.tar.gz",
        },
      ],
      Array [
        Object {
          "destination": "/mocked/path/.node_binaries/14.21.3/node-v14.21.3-win32-x64.tar.gz",
          "log": <ToolingLog>,
          "retries": 3,
          "sha256": undefined,
          "url": "https://mirrors.nodejs.org/dist/v14.21.3/node-v14.21.3-win32-x64.tar.gz",
        },
      ],
    ]
  `);
  /* ToDo [NODE14]: Replace when Node.js 14 support is removed
   * expect(testWriter.messages).toMatchInlineSnapshot(`Array []`);
   */
  expect(testWriter.messages).toMatchSnapshot();
});

it('rejects if any download fails', async () => {
  const { config } = await setup({ failOnUrl: 'linux:url' });

  await expect(DownloadNodeBuilds.run(config, log, [])).rejects.toMatchInlineSnapshot(
    `[Error: Download failed for reasons]`
  );
  /* ToDo [NODE14]: Replace when Node.js 14 support is removed
   * expect(testWriter.messages).toMatchInlineSnapshot(`Array []`);
   */
  expect(testWriter.messages).toMatchSnapshot();
});
