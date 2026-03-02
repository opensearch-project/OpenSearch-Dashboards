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

import { dirname, resolve, relative } from 'path';
import os from 'os';
import loadJsonFile from 'load-json-file';
import { readFile } from 'fs/promises';

import { getVersionInfo, VersionInfo } from './version_info';
import {
  PlatformName,
  PlatformArchitecture,
  ALL_PLATFORMS,
  Platform,
  TargetPlatforms,
} from './platform';

interface Options {
  isRelease: boolean;
  targetAllPlatforms: boolean;
  targetPlatforms: TargetPlatforms;
  versionQualifier?: string;
}

interface Package {
  version: string;
  engines: { node: string };
  workspaces: {
    packages: string[];
  };
  wazuh: { version: string; revision: string };
  [key: string]: unknown;
}

export class Config {
  static async create({
    isRelease,
    targetAllPlatforms,
    targetPlatforms,
    versionQualifier,
  }: Options) {
    const pkgPath = resolve(__dirname, '../../../../package.json');
    const pkg: Package = loadJsonFile.sync(pkgPath);

    const nvmrcPath = resolve(__dirname, '../../../../.nvmrc');
    const nvmrcContent = (await readFile(nvmrcPath, 'utf8'))?.trim?.();

    return new Config(
      targetAllPlatforms,
      targetPlatforms,
      pkg,
      pkg.engines.node,
      nvmrcContent,
      dirname(pkgPath),
      await getVersionInfo({
        isRelease,
        versionQualifier,
        pkg,
      }),
      isRelease
    );
  }

  constructor(
    private readonly targetAllPlatforms: boolean,
    private readonly targetPlatforms: TargetPlatforms,
    private readonly pkg: Package,
    private readonly nodeRange: string,
    private readonly nodeVersion: string,
    private readonly repoRoot: string,
    private readonly versionInfo: VersionInfo,
    public readonly isRelease: boolean
  ) {}

  /**
   * Get OpenSearch Dashboards's parsed package.json file
   */
  getOpenSearchDashboardsPkg() {
    return this.pkg;
  }

  /**
   * Get the node version range compatible with OpenSearch Dashboards
   */
  getNodeRange() {
    return this.nodeRange;
  }

  /**
   * Get the node version required by OpenSearch Dashboards
   */
  getNodeVersion() {
    return this.nodeVersion;
  }

  /**
   * Convert an absolute path to a relative path, based from the repo
   */
  getRepoRelativePath(absolutePath: string) {
    return relative(this.repoRoot, absolutePath);
  }

  /**
   * Resolve a set of relative paths based from the directory of the OpenSearch Dashboards repo
   */
  resolveFromRepo(...subPaths: string[]) {
    return resolve(this.repoRoot, ...subPaths);
  }

  /**
   * Return true if a supported Platform is specified
   */
  hasSpecifiedPlatform() {
    for (const platform in this.targetPlatforms) {
      if (platform) return true;
    }
    return false;
  }

  /**
   * Return the list of supported Platforms, if --all-platform flag is specified.
   * Return the targeted Platforms, if --target-platform flags are specified.
   * Return the platform of local OS. If it is not a supported Platform, raise an error.
   */
  getTargetPlatforms() {
    if (this.targetAllPlatforms) {
      return ALL_PLATFORMS;
    }

    const platforms: Platform[] = [];
    if (this.targetPlatforms.darwin) platforms.push(this.getPlatform('darwin', 'x64'));
    if (this.targetPlatforms.darwinArm) platforms.push(this.getPlatform('darwin', 'arm64'));
    if (this.targetPlatforms.linux) platforms.push(this.getPlatform('linux', 'x64'));
    if (this.targetPlatforms.linuxArm) platforms.push(this.getPlatform('linux', 'arm64'));
    if (this.targetPlatforms.windows) platforms.push(this.getPlatform('win32', 'x64'));

    if (platforms.length > 0) return platforms;

    return [this.getPlatformForThisOs()];
  }

  /**
   * Return the list of Platforms we need/have node downloads for. We always
   * include the linux platform even if we aren't targeting linux so we can
   * reliably get the LICENSE file.
   */
  getNodePlatforms() {
    if (this.targetAllPlatforms) {
      return ALL_PLATFORMS;
    }

    if (process.platform === 'linux') {
      return [this.getPlatform('linux', 'x64')];
    }

    // ToDo: All node dists, including Windows, contain a LICENSE file; do we still need to do this?
    return [this.getPlatformForThisOs(), this.getPlatform('linux', 'x64')];
  }

  getPlatform(name: PlatformName, arch: PlatformArchitecture) {
    const selected = ALL_PLATFORMS.find((p) => {
      return name === p.getName() && arch === p.getArchitecture();
    });

    if (!selected) {
      throw new Error(`Unable to find platform (${name}) with architecture (${arch})`);
    }

    return selected;
  }

  /**
   * Get the platform object representing the OS on this machine
   */
  getPlatformForThisOs() {
    return this.getPlatform(os.platform() as PlatformName, os.arch() as PlatformArchitecture);
  }

  /**
   * Get the version to use for this build
   */
  getBuildVersion() {
    return this.versionInfo.buildVersion;
  }

  /**
   * Get the build number of this build
   */
  getBuildNumber() {
    return this.versionInfo.buildNumber;
  }

  /**
   * Get the git sha for this build
   */
  getBuildSha() {
    return this.versionInfo.buildSha;
  }

  /**
   * Resolve a set of paths based from the target directory for this build.
   */
  resolveFromTarget(...subPaths: string[]) {
    return resolve(this.repoRoot, 'target', ...subPaths);
  }
}
