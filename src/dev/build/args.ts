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

import getopts from 'getopts';
import { ToolingLog, pickLevelFromFlags } from '@osd/dev-utils';

import { BuildOptions } from './build_distributables';

export function readCliArgs(argv: string[]) {
  const unknownFlags: string[] = [];
  const flags = getopts(argv, {
    boolean: [
      'skip-archives',
      'skip-os-packages',
      'rpm',
      'rpm-arm',
      'deb',
      'deb-arm',
      'docker',
      'skip-docker-ubi',
      'release',
      'skip-node-download',
      'verbose',
      'debug',
      'all-platforms',
      'windows',
      'darwin',
      'linux',
      'linux-arm',
      'verbose',
      'quiet',
      'silent',
      'debug',
      'help',
    ],
    alias: {
      v: 'verbose',
      d: 'debug',
    },
    default: {
      debug: true,
      rpm: null,
      'rpm-arm': null,
      deb: null,
      'deb-arm': null,
      docker: null,
      'version-qualifier': '',
    },
    unknown: (flag) => {
      unknownFlags.push(flag);
      return false;
    },
  });

  const log = new ToolingLog({
    level: pickLevelFromFlags(flags, {
      default: flags.debug === false ? 'info' : 'debug',
    }),
    writeTo: process.stdout,
  });

  if (unknownFlags.length || flags.help) {
    return {
      log,
      showHelp: true,
      unknownFlags,
    };
  }

  // In order to build a docker image we always need
  // to generate all the platforms
  if (flags.docker) {
    flags['all-platforms'] = true;
  }

  function isOsPackageDesired(name: string) {
    if (flags['skip-os-packages'] || !flags['all-platforms']) {
      return false;
    }

    // build all if no flags specified
    if (
      flags.rpm === null &&
      flags['rpm-arm'] === null &&
      flags.deb === null &&
      flags['deb-arm'] === null &&
      flags.docker === null
    ) {
      return true;
    }

    return Boolean(flags[name]);
  }

  const buildOptions: BuildOptions = {
    isRelease: Boolean(flags.release),
    versionQualifier: flags['version-qualifier'],
    downloadFreshNode: !Boolean(flags['skip-node-download']),
    createArchives: !Boolean(flags['skip-archives']),
    createRpmPackage: isOsPackageDesired('rpm'),
    createRpmArmPackage: isOsPackageDesired('rpm-arm'),
    createDebPackage: isOsPackageDesired('deb'),
    createDebArmPackage: isOsPackageDesired('deb-arm'),
    createDockerPackage: isOsPackageDesired('docker'),
    createDockerUbiPackage: isOsPackageDesired('docker') && !Boolean(flags['skip-docker-ubi']),
    targetPlatforms: {
      windows: Boolean(flags.windows),
      darwin: Boolean(flags.darwin),
      linux: Boolean(flags.linux),
      linuxArm: Boolean(flags['linux-arm']),
    },
    targetAllPlatforms: Boolean(flags['all-platforms']),
  };

  return {
    log,
    showHelp: false,
    unknownFlags: [],
    buildOptions,
  };
}
