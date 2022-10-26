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

import { ToolingLog, createAnyInstanceSerializer } from '@osd/dev-utils';

import { readCliArgs } from './args';

expect.addSnapshotSerializer(createAnyInstanceSerializer(ToolingLog));

it('renders help if `--help` passed', () => {
  expect(readCliArgs(['node', 'scripts/build', '--help'])).toMatchInlineSnapshot(`
    Object {
      "log": <ToolingLog>,
      "showHelp": true,
      "unknownFlags": Array [],
    }
  `);
});

it('build dist for current platform, without packages, by default', () => {
  expect(readCliArgs(['node', 'scripts/build'])).toMatchInlineSnapshot(`
    Object {
      "buildOptions": Object {
        "createArchives": true,
        "createDebArmPackage": false,
        "createDebPackage": false,
        "createDockerPackage": false,
        "createDockerUbiPackage": false,
        "createRpmArmPackage": false,
        "createRpmPackage": false,
        "downloadFreshNode": true,
        "isRelease": false,
        "targetAllPlatforms": false,
        "targetPlatforms": Object {
          "darwin": false,
          "linux": false,
          "linuxArm": false,
          "windows": false,
        },
        "versionQualifier": "",
      },
      "log": <ToolingLog>,
      "showHelp": false,
      "unknownFlags": Array [],
    }
  `);
});

it('build dist for linux x64 platform, without packages, if --linux is passed', () => {
  expect(readCliArgs(['node', 'scripts/build-platform', '--linux'])).toMatchInlineSnapshot(`
    Object {
      "buildOptions": Object {
        "createArchives": true,
        "createDebArmPackage": false,
        "createDebPackage": false,
        "createDockerPackage": false,
        "createDockerUbiPackage": false,
        "createRpmArmPackage": false,
        "createRpmPackage": false,
        "downloadFreshNode": true,
        "isRelease": false,
        "targetAllPlatforms": false,
        "targetPlatforms": Object {
          "darwin": false,
          "linux": true,
          "linuxArm": false,
          "windows": false,
        },
        "versionQualifier": "",
      },
      "log": <ToolingLog>,
      "showHelp": false,
      "unknownFlags": Array [],
    }
  `);
});

it('build dist for linux arm64 platform, without packages, if --linux-arm is passed', () => {
  expect(readCliArgs(['node', 'scripts/build-platform', '--linux-arm'])).toMatchInlineSnapshot(`
    Object {
      "buildOptions": Object {
        "createArchives": true,
        "createDebArmPackage": false,
        "createDebPackage": false,
        "createDockerPackage": false,
        "createDockerUbiPackage": false,
        "createRpmArmPackage": false,
        "createRpmPackage": false,
        "downloadFreshNode": true,
        "isRelease": false,
        "targetAllPlatforms": false,
        "targetPlatforms": Object {
          "darwin": false,
          "linux": false,
          "linuxArm": true,
          "windows": false,
        },
        "versionQualifier": "",
      },
      "log": <ToolingLog>,
      "showHelp": false,
      "unknownFlags": Array [],
    }
  `);
});

it('build dist for darwin x64 platform, without packages, if --darwin is passed', () => {
  expect(readCliArgs(['node', 'scripts/build-platform', '--darwin'])).toMatchInlineSnapshot(`
    Object {
      "buildOptions": Object {
        "createArchives": true,
        "createDebArmPackage": false,
        "createDebPackage": false,
        "createDockerPackage": false,
        "createDockerUbiPackage": false,
        "createRpmArmPackage": false,
        "createRpmPackage": false,
        "downloadFreshNode": true,
        "isRelease": false,
        "targetAllPlatforms": false,
        "targetPlatforms": Object {
          "darwin": true,
          "linux": false,
          "linuxArm": false,
          "windows": false,
        },
        "versionQualifier": "",
      },
      "log": <ToolingLog>,
      "showHelp": false,
      "unknownFlags": Array [],
    }
  `);
});

it('build dist for windows x64 platform, without packages, if --windows is passed', () => {
  expect(readCliArgs(['node', 'scripts/build-platform', '--windows'])).toMatchInlineSnapshot(`
    Object {
      "buildOptions": Object {
        "createArchives": true,
        "createDebArmPackage": false,
        "createDebPackage": false,
        "createDockerPackage": false,
        "createDockerUbiPackage": false,
        "createRpmArmPackage": false,
        "createRpmPackage": false,
        "downloadFreshNode": true,
        "isRelease": false,
        "targetAllPlatforms": false,
        "targetPlatforms": Object {
          "darwin": false,
          "linux": false,
          "linuxArm": false,
          "windows": true,
        },
        "versionQualifier": "",
      },
      "log": <ToolingLog>,
      "showHelp": false,
      "unknownFlags": Array [],
    }
  `);
});

it('builds packages if --all-platforms is passed', () => {
  expect(readCliArgs(['node', 'scripts/build', '--all-platforms'])).toMatchInlineSnapshot(`
    Object {
      "buildOptions": Object {
        "createArchives": true,
        "createDebArmPackage": true,
        "createDebPackage": true,
        "createDockerPackage": true,
        "createDockerUbiPackage": true,
        "createRpmArmPackage": true,
        "createRpmPackage": true,
        "downloadFreshNode": true,
        "isRelease": false,
        "targetAllPlatforms": true,
        "targetPlatforms": Object {
          "darwin": false,
          "linux": false,
          "linuxArm": false,
          "windows": false,
        },
        "versionQualifier": "",
      },
      "log": <ToolingLog>,
      "showHelp": false,
      "unknownFlags": Array [],
    }
  `);
});

it('limits packages if --rpm passed with --all-platforms', () => {
  expect(readCliArgs(['node', 'scripts/build', '--all-platforms', '--rpm'])).toMatchInlineSnapshot(`
    Object {
      "buildOptions": Object {
        "createArchives": true,
        "createDebArmPackage": false,
        "createDebPackage": false,
        "createDockerPackage": false,
        "createDockerUbiPackage": false,
        "createRpmArmPackage": false,
        "createRpmPackage": true,
        "downloadFreshNode": true,
        "isRelease": false,
        "targetAllPlatforms": true,
        "targetPlatforms": Object {
          "darwin": false,
          "linux": false,
          "linuxArm": false,
          "windows": false,
        },
        "versionQualifier": "",
      },
      "log": <ToolingLog>,
      "showHelp": false,
      "unknownFlags": Array [],
    }
  `);
});

it('limits packages if --deb passed with --all-platforms', () => {
  expect(readCliArgs(['node', 'scripts/build', '--all-platforms', '--deb'])).toMatchInlineSnapshot(`
    Object {
      "buildOptions": Object {
        "createArchives": true,
        "createDebArmPackage": false,
        "createDebPackage": true,
        "createDockerPackage": false,
        "createDockerUbiPackage": false,
        "createRpmArmPackage": false,
        "createRpmPackage": false,
        "downloadFreshNode": true,
        "isRelease": false,
        "targetAllPlatforms": true,
        "targetPlatforms": Object {
          "darwin": false,
          "linux": false,
          "linuxArm": false,
          "windows": false,
        },
        "versionQualifier": "",
      },
      "log": <ToolingLog>,
      "showHelp": false,
      "unknownFlags": Array [],
    }
  `);
});

it('limits packages if --docker passed with --all-platforms', () => {
  expect(readCliArgs(['node', 'scripts/build', '--all-platforms', '--docker']))
    .toMatchInlineSnapshot(`
    Object {
      "buildOptions": Object {
        "createArchives": true,
        "createDebArmPackage": false,
        "createDebPackage": false,
        "createDockerPackage": true,
        "createDockerUbiPackage": true,
        "createRpmArmPackage": false,
        "createRpmPackage": false,
        "downloadFreshNode": true,
        "isRelease": false,
        "targetAllPlatforms": true,
        "targetPlatforms": Object {
          "darwin": false,
          "linux": false,
          "linuxArm": false,
          "windows": false,
        },
        "versionQualifier": "",
      },
      "log": <ToolingLog>,
      "showHelp": false,
      "unknownFlags": Array [],
    }
  `);
});

it('limits packages if --docker passed with --skip-docker-ubi and --all-platforms', () => {
  expect(readCliArgs(['node', 'scripts/build', '--all-platforms', '--docker', '--skip-docker-ubi']))
    .toMatchInlineSnapshot(`
    Object {
      "buildOptions": Object {
        "createArchives": true,
        "createDebArmPackage": false,
        "createDebPackage": false,
        "createDockerPackage": true,
        "createDockerUbiPackage": false,
        "createRpmArmPackage": false,
        "createRpmPackage": false,
        "downloadFreshNode": true,
        "isRelease": false,
        "targetAllPlatforms": true,
        "targetPlatforms": Object {
          "darwin": false,
          "linux": false,
          "linuxArm": false,
          "windows": false,
        },
        "versionQualifier": "",
      },
      "log": <ToolingLog>,
      "showHelp": false,
      "unknownFlags": Array [],
    }
  `);
});
