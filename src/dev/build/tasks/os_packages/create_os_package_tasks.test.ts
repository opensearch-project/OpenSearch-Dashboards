/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ToolingLog,
  ToolingLogCollectingWriter,
  createAnyInstanceSerializer,
} from '@osd/dev-utils';
import { CreateDebArmPackage, CreateDebPackage, CreateRpmPackage, CreateRpmArmPackage } from '.';

import { Build, Config } from '../../lib';

jest.mock('./run_fpm');
jest.mock('./docker_generator');

const { runFpm } = jest.requireMock('./run_fpm');

const log = new ToolingLog();
const testWriter = new ToolingLogCollectingWriter();
log.setWriters([testWriter]);

expect.addSnapshotSerializer(createAnyInstanceSerializer(Config));
expect.addSnapshotSerializer(createAnyInstanceSerializer(ToolingLog));

async function setup() {
  const config = await Config.create({
    isRelease: true,
    targetAllPlatforms: true,
    targetPlatforms: {
      linux: false,
      linuxArm: false,
      darwin: false,
    },
  });

  const build = new Build(config);

  runFpm.mockImplementation(
    (
      _: Config,
      __: ToolingLog,
      ___: Build,
      type: string,
      arch: string,
      pkgSpecificFlags: string[]
    ) => {
      return {
        package: `${type}:${arch}:${pkgSpecificFlags}`,
      };
    }
  );

  return { config, build };
}

beforeEach(() => {
  testWriter.messages.length = 0;
  jest.clearAllMocks();
});

it('runs task with the expected values for DEB x64', async () => {
  const { config, build } = await setup();

  await CreateDebPackage.run(config, log, build);

  expect(runFpm).toMatchInlineSnapshot(`
    [MockFunction] {
      "calls": Array [
        Array [
          <Config>,
          <ToolingLog>,
          Build {
            "config": <Config>,
            "name": "opensearch-dashboards",
          },
          "deb",
          "x64",
          Array [
            "--architecture",
            "amd64",
            "--deb-priority",
            "optional",
          ],
        ],
      ],
      "results": Array [
        Object {
          "type": "return",
          "value": Object {
            "package": "deb:x64:--architecture,amd64,--deb-priority,optional",
          },
        },
      ],
    }
  `);
});

it('runs task with the expected values for DEB ARM64', async () => {
  const { config, build } = await setup();

  await CreateDebArmPackage.run(config, log, build);

  expect(runFpm).toMatchInlineSnapshot(`
    [MockFunction] {
      "calls": Array [
        Array [
          <Config>,
          <ToolingLog>,
          Build {
            "config": <Config>,
            "name": "opensearch-dashboards",
          },
          "deb",
          "arm64",
          Array [
            "--architecture",
            "arm64",
            "--deb-priority",
            "optional",
          ],
        ],
      ],
      "results": Array [
        Object {
          "type": "return",
          "value": Object {
            "package": "deb:arm64:--architecture,arm64,--deb-priority,optional",
          },
        },
      ],
    }
  `);
});

it('runs task with the expected values for RPM x64', async () => {
  const { config, build } = await setup();

  await CreateRpmPackage.run(config, log, build);

  expect(runFpm).toMatchInlineSnapshot(`
    [MockFunction] {
      "calls": Array [
        Array [
          <Config>,
          <ToolingLog>,
          Build {
            "config": <Config>,
            "name": "opensearch-dashboards",
          },
          "rpm",
          "x64",
          Array [
            "--architecture",
            "x64",
            "--rpm-os",
            "linux",
          ],
        ],
      ],
      "results": Array [
        Object {
          "type": "return",
          "value": Object {
            "package": "rpm:x64:--architecture,x64,--rpm-os,linux",
          },
        },
      ],
    }
  `);
});

it('runs task with the expected values for RPM ARM64', async () => {
  const { config, build } = await setup();

  await CreateRpmArmPackage.run(config, log, build);

  expect(runFpm).toMatchInlineSnapshot(`
    [MockFunction] {
      "calls": Array [
        Array [
          <Config>,
          <ToolingLog>,
          Build {
            "config": <Config>,
            "name": "opensearch-dashboards",
          },
          "rpm",
          "arm64",
          Array [
            "--architecture",
            "arm64",
            "--rpm-os",
            "linux",
          ],
        ],
      ],
      "results": Array [
        Object {
          "type": "return",
          "value": Object {
            "package": "rpm:arm64:--architecture,arm64,--rpm-os,linux",
          },
        },
      ],
    }
  `);
});
