/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { ToolingLog, createAnyInstanceSerializer } from '@osd/dev-utils';

import { BuildOptions, buildDistributables } from './build_distributables';

expect.addSnapshotSerializer(createAnyInstanceSerializer(ToolingLog));
const testLog = new ToolingLog();

it('renders help if `--help` passed', () => {
  const buildOptions: BuildOptions = {
    isRelease: true,
    versionQualifier: 'v1.0.0',
    downloadFreshNode: false,
    createArchives: false,
    createRpmPackage: true,
    createRpmArmPackage: false,
    createDebPackage: false,
    createDebArmPackage: false,
    createDockerPackage: false,
    createDockerUbiPackage: false,
    targetPlatforms: {
      darwin: false,
      linux: false,
      linuxArm: false,
    },
    targetAllPlatforms: false,
  };
  expect(buildDistributables(testLog, buildOptions)).toMatchInlineSnapshot(`Promise {}`);
});
