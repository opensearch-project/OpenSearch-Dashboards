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

import path from 'path';

import { ToolingLog } from '@osd/dev-utils';

import { deleteAll, download, gunzip, untar, Task, Config, Build, Platform, read } from '../lib';

const DOWNLOAD_DIRECTORY = '.native_modules';

interface Package {
  name: string;
  version: string;
  destinationPath: string;
  extractMethod: string;
  archives: Record<
    string,
    {
      url: string;
      sha256: string;
      overriddenExtractMethod?: string;
      overriddenDestinationPath?: string;
    }
  >;
}

// Process for updating urls and checksums after bumping the version of `re2`:
// 1. Match `version` with the version in the yarn.lock file.
// 2. Update the url to match the version.
//    2a. If a Node.js update occurs, the node module version must match as
//        well (i.e. '83'). See https://nodejs.org/en/download/releases/#ref-1.
// 3. Generate the new checksum by executing the following commands:
//    3a. `wget {url}`
//    3b. `sha256sum {downloaded file name}`
//    3c. For `linux-arm64`, the sha256 can also be found by replacing
//        "linux-arm64-83.tar.gz" in the url with "sha256sum.txt.asc"
//        and copying the sha256 from that file.
const packages: Package[] = [
  {
    name: 're2',
    version: '1.17.4',
    destinationPath: 'node_modules/re2/build/Release/re2.node',
    extractMethod: 'gunzip',
    archives: {
      'darwin-x64': {
        url: 'https://github.com/uhop/node-re2/releases/download/1.17.4/darwin-x64-83.gz',
        sha256: '9112ed93c1544ecc6397f7ff20bd2b28f3b04c7fbb54024e10f9a376a132a87d',
      },
      'linux-x64': {
        url: 'https://github.com/uhop/node-re2/releases/download/1.17.4/linux-x64-83.gz',
        sha256: '86e03540783a18c41f81df0aec320b1f64aca6cbd3a87fc1b7a9b4109c5f5986',
      },
      'linux-arm64': {
        url:
          'https://d1v1sj258etie.cloudfront.net/node-re2/releases/download/1.17.4/linux-arm64-83.tar.gz',
        sha256: 'd86ced75b794fbf518b90908847b3c09a50f3ff5a2815aa30f53080f926a2873',
        overriddenExtractMethod: 'untar',
        overriddenDestinationPath: 'node_modules/re2/build/Release',
      },
      'win32-x64': {
        url: 'https://github.com/uhop/node-re2/releases/download/1.17.4/win32-x64-83.gz',
        sha256: '2f842d9757288afd4bd5dec0e7b370a4c3e89ac98050598b17abb9e8e00e3294',
      },
    },
  },
];

async function getInstalledVersion(config: Config, packageName: string) {
  const packageJSONPath = config.resolveFromRepo(
    path.join('node_modules', packageName, 'package.json')
  );
  const json = await read(packageJSONPath);
  const packageJSON = JSON.parse(json);
  return packageJSON.version;
}

async function patchModule(
  config: Config,
  log: ToolingLog,
  build: Build,
  platform: Platform,
  pkg: Package
) {
  const installedVersion = await getInstalledVersion(config, pkg.name);
  if (installedVersion !== pkg.version) {
    throw new Error(
      `Can't patch ${pkg.name}'s native module, we were expecting version ${pkg.version} and found ${installedVersion}`
    );
  }
  const platformName = platform.getNodeArch();
  const archive = pkg.archives[platformName];
  const archiveName = path.basename(archive.url);
  const downloadPath = config.resolveFromRepo(DOWNLOAD_DIRECTORY, pkg.name, archiveName);
  const extractMethod = archive.overriddenExtractMethod || pkg.extractMethod;
  const extractPath = build.resolvePathForPlatform(
    platform,
    archive.overriddenDestinationPath || pkg.destinationPath
  );
  log.debug(`Patching ${pkg.name} binaries from ${archive.url} to ${extractPath}`);

  await deleteAll([extractPath], log);
  await download({
    log,
    url: archive.url,
    destination: downloadPath,
    sha256: archive.sha256,
    retries: 3,
  });
  switch (extractMethod) {
    case 'gunzip':
      await gunzip(downloadPath, extractPath);
      break;
    case 'untar':
      await untar(downloadPath, extractPath);
      break;
    default:
      throw new Error(`Extract method of ${extractMethod} is not supported`);
  }
}

export const PatchNativeModules: Task = {
  description: 'Patching platform-specific native modules',
  async run(config, log, build) {
    for (const pkg of packages) {
      await Promise.all(
        config.getTargetPlatforms().map(async (platform) => {
          await patchModule(config, log, build, platform, pkg);
        })
      );
    }
  },
};
