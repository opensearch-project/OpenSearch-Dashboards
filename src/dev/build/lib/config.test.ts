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

import { resolve } from 'path';

import { standardize, REPO_ROOT } from '@osd/cross-platform';
import { createAbsolutePathSerializer } from '@osd/dev-utils';

import pkg from '../../../../package.json';
import { Config } from './config';

jest.mock('./version_info', () => ({
  getVersionInfo: () => ({
    buildSha: 'abc1234',
    buildVersion: '8.0.0',
    buildNumber: 1234,
  }),
}));

const versionInfo = jest.requireMock('./version_info').getVersionInfo();

expect.addSnapshotSerializer(createAbsolutePathSerializer());

const setup = async ({
  targetAllPlatforms = true,
  targetPlatforms = {
    darwin: false,
    linux: false,
    linuxArm: false,
    windows: false,
  },
}: {
  targetAllPlatforms?: boolean;
  targetPlatforms?: {
    darwin: boolean;
    linux: boolean;
    linuxArm: boolean;
    windows: boolean;
  };
} = {}) => {
  return await Config.create({
    isRelease: true,
    targetAllPlatforms,
    targetPlatforms,
  });
};

describe('#getOpenSearchDashboardsPkg()', () => {
  it('returns the parsed package.json from the OpenSearch Dashboards repo', async () => {
    const config = await setup();
    expect(config.getOpenSearchDashboardsPkg()).toEqual(pkg);
  });
});

describe('#getNodeVersion()', () => {
  it('returns the node version from the OpenSearch Dashboards package.json', async () => {
    const config = await setup();
    expect(config.getNodeVersion()).toEqual(pkg.engines.node);
  });
});

describe('#getRepoRelativePath()', () => {
  it('converts an absolute path to relative path, from the root of the repo', async () => {
    const config = await setup();
    expect(config.getRepoRelativePath(__dirname)).toMatchInlineSnapshot(
      `"${standardize('src/dev/build/lib', false, true)}"`
    );
  });
});

describe('#resolveFromRepo()', () => {
  it('resolves a relative path', async () => {
    const config = await setup();
    expect(config.resolveFromRepo('src/dev/build')).toMatchInlineSnapshot(
      `<absolute path>/src/dev/build`
    );
  });

  it('resolves a series of relative paths', async () => {
    const config = await setup();
    expect(config.resolveFromRepo('src', 'dev', 'build')).toMatchInlineSnapshot(
      `<absolute path>/src/dev/build`
    );
  });
});

describe('#hasSpecifiedPlatform', () => {
  it('return true if darwin is specified', async () => {
    const config = await setup({
      targetAllPlatforms: false,
      targetPlatforms: {
        darwin: true,
        linux: false,
        linuxArm: false,
        windows: false,
      },
    });
    expect(config.hasSpecifiedPlatform() === true);
  });

  it('return true if linux arm64 is specified', async () => {
    const config = await setup({
      targetAllPlatforms: false,
      targetPlatforms: {
        darwin: false,
        linux: false,
        linuxArm: true,
        windows: false,
      },
    });
    expect(config.hasSpecifiedPlatform() === true);
  });

  it('return true if linux is specified', async () => {
    const config = await setup({
      targetAllPlatforms: false,
      targetPlatforms: {
        darwin: false,
        linux: true,
        linuxArm: false,
        windows: false,
      },
    });
    expect(config.hasSpecifiedPlatform() === true);
  });

  it('return false if no platform is specified', async () => {
    const config = await setup({
      targetAllPlatforms: true,
    });
    expect(config.hasSpecifiedPlatform() === false);
  });
});

describe('#getPlatform()', () => {
  it('throws error when platform does not exist', async () => {
    const config = await setup();
    expect(() => {
      config.getPlatform(
        // @ts-expect-error invalid platform name
        'foo',
        'x64'
      );
    }).toThrowErrorMatchingInlineSnapshot(
      `"Unable to find platform (foo) with architecture (x64)"`
    );
  });

  it('throws error when architecture does not exist', async () => {
    const config = await setup();
    expect(() => {
      config.getPlatform(
        'linux',
        // @ts-expect-error invalid platform arch
        'foo'
      );
    }).toThrowErrorMatchingInlineSnapshot(
      `"Unable to find platform (linux) with architecture (foo)"`
    );
  });
});

describe('#getTargetPlatforms()', () => {
  it('returns an array of all platform objects if config.targetAllPlatforms is true', async () => {
    const config = await setup();
    expect(
      config
        .getTargetPlatforms()
        .map((p) => p.getNodeArch())
        .sort()
    ).toMatchInlineSnapshot(`
      Array [
        "darwin-x64",
        "linux-arm64",
        "linux-x64",
        "win32-x64",
      ]
    `);
  });

  it('returns just darwin x64 platform when darwin = true', async () => {
    const config = await setup({
      targetAllPlatforms: false,
      targetPlatforms: {
        darwin: true,
        linux: false,
        linuxArm: false,
        windows: false,
      },
    });

    expect(
      config
        .getTargetPlatforms()
        .map((p) => p.getNodeArch())
        .sort()
    ).toMatchInlineSnapshot(`
      Array [
        "darwin-x64",
      ]
    `);
  });

  it('returns just linux x64 platform when linux = true', async () => {
    const config = await setup({
      targetAllPlatforms: false,
      targetPlatforms: {
        darwin: false,
        linux: true,
        linuxArm: false,
        windows: false,
      },
    });

    expect(
      config
        .getTargetPlatforms()
        .map((p) => p.getNodeArch())
        .sort()
    ).toMatchInlineSnapshot(`
      Array [
        "linux-x64",
      ]
    `);
  });

  it('returns just linux arm64 platform when linuxArm64 = true', async () => {
    const config = await setup({
      targetAllPlatforms: false,
      targetPlatforms: {
        darwin: false,
        linux: false,
        linuxArm: true,
        windows: false,
      },
    });

    expect(
      config
        .getTargetPlatforms()
        .map((p) => p.getNodeArch())
        .sort()
    ).toMatchInlineSnapshot(`
      Array [
        "linux-arm64",
      ]
    `);
  });

  it('returns both linux arm64 and darwin x64 platforms when linuxArm64 and darwin equal to true', async () => {
    const config = await setup({
      targetAllPlatforms: false,
      targetPlatforms: {
        darwin: true,
        linux: false,
        linuxArm: true,
        windows: false,
      },
    });

    expect(
      config
        .getTargetPlatforms()
        .map((p) => p.getNodeArch())
        .sort()
    ).toMatchInlineSnapshot(`
      Array [
        "darwin-x64",
        "linux-arm64",
      ]
    `);
  });

  it('returns just this platform when targetAllPlatforms = false', async () => {
    const config = await setup({
      targetAllPlatforms: false,
    });

    expect(config.getTargetPlatforms()).toEqual([config.getPlatformForThisOs()]);
  });
});

describe('#getNodePlatforms()', () => {
  it('returns all platforms', async () => {
    const config = await setup();
    expect(
      config
        .getTargetPlatforms()
        .map((p) => p.getNodeArch())
        .sort()
    ).toEqual(['darwin-x64', 'linux-arm64', 'linux-x64', 'win32-x64']);
  });

  it('returns this platform and linux, when targetAllPlatforms = false', async () => {
    const config = await setup({
      targetAllPlatforms: false,
    });
    const platforms = config.getNodePlatforms();
    expect(platforms).toBeInstanceOf(Array);
    if (process.platform !== 'linux') {
      expect(platforms).toHaveLength(2);
      expect(platforms[0]).toBe(config.getPlatformForThisOs());
      expect(platforms[1]).toBe(config.getPlatform('linux', 'x64'));
    } else {
      expect(platforms).toHaveLength(1);
      expect(platforms[0]).toBe(config.getPlatform('linux', 'x64'));
    }
  });
});

describe('#getPlatformForThisOs()', () => {
  it('returns the platform that matches the arch of this machine', async () => {
    const config = await setup();
    const currentPlatform = config.getPlatformForThisOs();
    expect(currentPlatform.getName()).toBe(process.platform);
    expect(currentPlatform.getArchitecture()).toBe(process.arch);
  });
});

describe('#getBuildVersion()', () => {
  it('returns the version from the build info', async () => {
    const config = await setup();
    expect(config.getBuildVersion()).toBe(versionInfo.buildVersion);
  });
});

describe('#getBuildNumber()', () => {
  it('returns the number from the build info', async () => {
    const config = await setup();
    expect(config.getBuildNumber()).toBe(versionInfo.buildNumber);
  });
});

describe('#getBuildSha()', () => {
  it('returns the sha from the build info', async () => {
    const config = await setup();
    expect(config.getBuildSha()).toBe(versionInfo.buildSha);
  });
});

describe('#resolveFromTarget()', () => {
  it('resolves a relative path, from the target directory', async () => {
    const config = await setup();
    expect(config.resolveFromTarget()).toBe(resolve(REPO_ROOT, 'target'));
  });
});
