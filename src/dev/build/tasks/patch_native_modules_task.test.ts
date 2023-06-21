/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ToolingLog,
  ToolingLogCollectingWriter,
  createAnyInstanceSerializer,
  createAbsolutePathSerializer,
} from '@osd/dev-utils';
import { Build, Config, read, download, untar, gunzip } from '../lib';
import { createPatchNativeModulesTask } from './patch_native_modules_task';

const log = new ToolingLog();
const testWriter = new ToolingLogCollectingWriter();
log.setWriters([testWriter]);
expect.addSnapshotSerializer(createAnyInstanceSerializer(Config));
expect.addSnapshotSerializer(createAnyInstanceSerializer(ToolingLog));
expect.addSnapshotSerializer(createAbsolutePathSerializer());

jest.mock('../lib', () => {
  const originalModule = jest.requireActual('../lib');
  return {
    ...originalModule,
    download: jest.fn(),
    gunzip: jest.fn(),
    untar: jest.fn(),
    read: jest.fn(),
  };
});

async function setup() {
  const config = await Config.create({
    isRelease: true,
    targetAllPlatforms: false,
    targetPlatforms: {
      linux: false,
      linuxArm: false,
      darwin: false,
      windows: false,
    },
  });

  const build = new Build(config);

  (read as jest.MockedFunction<typeof read>).mockImplementation(async () => {
    return JSON.stringify({ version: mockPackage.version });
  });

  return { config, build };
}

beforeEach(() => {
  testWriter.messages.length = 0;
  jest.clearAllMocks();
});

const mockPackage = {
  name: 'mock-native-module',
  version: '1.0.0',
  destinationPath: 'path/to/destination',
  extractMethod: 'untar',
  archives: {
    'linux-arm64': {
      url: 'https://example.com/mock-native-module/linux-arm64.tar.gz',
      sha256: 'mock-sha256',
    },
    'linux-x64': {
      url: 'https://example.com/mock-native-module/linux-x64.gz',
      sha256: 'mock-sha256',
    },
  },
};

describe('patch native modules task', () => {
  it('patch native modules task downloads the correct platform package', async () => {
    const { config, build } = await setup();
    config.targetPlatforms.linuxArm = true;
    const PatchNativeModulesWithMock = createPatchNativeModulesTask([mockPackage]);
    await PatchNativeModulesWithMock.run(config, log, build);
    expect((download as jest.MockedFunction<typeof download>).mock.calls.length).toBe(1);
    expect((download as jest.MockedFunction<typeof download>).mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "destination": <absolute path>/.native_modules/mock-native-module/linux-arm64.tar.gz,
          "log": <ToolingLog>,
          "retries": 3,
          "sha256": "mock-sha256",
          "url": "https://example.com/mock-native-module/linux-arm64.tar.gz",
        },
      ],
    ]
  `);
  });

  it('for .tar.gz artifact, patch native modules task unzip it via untar', async () => {
    const { config, build } = await setup();
    config.targetPlatforms.linuxArm = true;
    const PatchNativeModulesWithMock = createPatchNativeModulesTask([mockPackage]);
    await PatchNativeModulesWithMock.run(config, log, build);
    expect(untar).toHaveBeenCalled();
    expect(gunzip).not.toHaveBeenCalled();
  });

  it('for .gz artifact, patch native modules task unzip it via gunzip', async () => {
    const mockPackageGZ = {
      ...mockPackage,
      extractMethod: 'gunzip',
    };
    const { config, build } = await setup();
    config.targetPlatforms.linux = true;
    const PatchNativeModulesWithMock = createPatchNativeModulesTask([mockPackageGZ]);
    await PatchNativeModulesWithMock.run(config, log, build);
    expect(gunzip).toHaveBeenCalled();
    expect(untar).not.toHaveBeenCalled();
  });

  it('throws error for unsupported extract methods', async () => {
    const mockPackageUnsupported = {
      ...mockPackage,
      extractMethod: 'unsupported',
    };
    const { config, build } = await setup();
    config.targetPlatforms.linux = true;
    const PatchNativeModulesWithMock = createPatchNativeModulesTask([mockPackageUnsupported]);
    await expect(PatchNativeModulesWithMock.run(config, log, build)).rejects.toThrow(
      'Extract method of unsupported is not supported'
    );
  });
});
