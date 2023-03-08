/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
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

/* Process for updating URLs and checksums after bumping the version of `re2` or NodeJS:
 *   1. Match the `version` with the version in the yarn.lock file.
 *   2. Match the module version, the digits at the end of the filename, with the output of
 *      `node -p process.versions.modules`.
 *   3. Confirm that the URLs exist for each platform-architecture combo on
 *      https://github.com/uhop/node-re2/releases/tag/[VERSION]; reach out to maintainers for ARM
 *      releases of `re2` as they currently don't have an official ARM release.
 *   4. Generate new checksums for each artifact by downloading each one and calling
 *      `shasum -a 256` or `sha256sum` on the downloaded file.
 */
const packages: Package[] = [
  {
    name: 're2',
    version: '1.15.4',
    destinationPath: 'node_modules/re2/build/Release/re2.node',
    extractMethod: 'gunzip',
    archives: {
      'darwin-x64': {
        url: 'https://github.com/uhop/node-re2/releases/download/1.15.4/darwin-x64-64.gz',
        sha256: '595c6653d796493ddb288fc0732a0d1df8560099796f55a1dd242357d96bb8d6',
      },
      'linux-x64': {
        url: 'https://github.com/uhop/node-re2/releases/download/1.15.4/linux-x64-64.gz',
        sha256: 'e743587bc96314edf10c3e659c03168bc374a5cd9a6623ee99d989251e331f28',
      },
      'linux-arm64': {
        url:
          'https://d1v1sj258etie.cloudfront.net/node-re2/releases/download/1.15.4/linux-arm64-64.tar.gz',
        sha256: '24edcdf45a09e69b6329385ab3ece24b424602a2656c8a297111d7aac174723b',
        overriddenExtractMethod: 'untar',
        overriddenDestinationPath: 'node_modules/re2/build/Release',
      },
      'win32-x64': {
        url: 'https://github.com/uhop/node-re2/releases/download/1.15.4/win32-x64-64.gz',
        sha256: 'b33de62cda24fb02dc80a19fb79977d686468ac746e97cd211059d2d4c75d529',
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
