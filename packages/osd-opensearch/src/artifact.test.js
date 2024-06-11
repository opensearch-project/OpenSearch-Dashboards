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

import { ToolingLog } from '@osd/dev-utils';
jest.mock('node-fetch');
import fetch from 'node-fetch';
const { Response } = jest.requireActual('node-fetch');

import { Artifact } from './artifact';

const log = new ToolingLog();
let MOCKS;

const DAILY_SNAPSHOT_BASE_URL = 'https://artifacts.opensearch.org/snapshots/core/opensearch';

const ORIGINAL_PLATFORM = process.platform;
const ORIGINAL_ARCHITECTURE = process.arch;
const PLATFORM = process.platform === 'win32' ? 'windows' : process.platform;
const ARCHITECTURE = process.arch === 'arm64' ? 'arm64' : 'x64';
const MOCK_VERSION = 'test-version';
const MOCK_RC_VERSION = `test-version-rc4`;
const MOCK_FILENAME = `opensearch-test-version-SNAPSHOT-linux-${ARCHITECTURE}-latest.tar.gz`;
const MOCK_RC_FILENAME = `opensearch-test-version-rc4-SNAPSHOT-linux-${ARCHITECTURE}-latest.tar.gz`;
const MOCK_URL = `${DAILY_SNAPSHOT_BASE_URL}/${MOCK_VERSION}/${MOCK_FILENAME}`;
const MOCK_RC_URL = `${DAILY_SNAPSHOT_BASE_URL}/${MOCK_RC_VERSION}/${MOCK_RC_FILENAME}`;

const itif = process.platform === 'linux' ? it : it.skip;

const createArchive = (params = {}) => {
  const architecture = params.architecture || ARCHITECTURE;
  const useRCVersion = params.useRCVersion || false;

  return {
    license: 'oss',
    architecture,
    version: !useRCVersion ? MOCK_VERSION : MOCK_RC_VERSION,
    url: !useRCVersion ? MOCK_URL : MOCK_RC_URL,
    platform: PLATFORM,
    filename: !useRCVersion ? MOCK_FILENAME : MOCK_RC_FILENAME,
    ...params,
  };
};

const mockFetch = (mock) =>
  fetch.mockReturnValue(Promise.resolve(new Response(JSON.stringify(mock))));

const previousEnvVars = {};
const ENV_VARS_TO_RESET = [
  'OPENSEARCH_SNAPSHOT_MANIFEST',
  'OSD_OPENSEARCH_SNAPSHOT_USE_UNVERIFIED',
  'OSD_SNAPSHOT_SKIP_VERIFY_CHECKSUM',
];

beforeAll(() => {
  ENV_VARS_TO_RESET.forEach((key) => {
    if (key in process.env) {
      previousEnvVars[key] = process.env[key];
      delete process.env[key];
    }
  });
});

afterAll(() => {
  Object.keys(previousEnvVars).forEach((key) => {
    process.env[key] = previousEnvVars[key];
  });
});

beforeEach(() => {
  jest.resetAllMocks();

  MOCKS = {
    GA: {
      archives: [createArchive({ useRCVersion: false })],
    },
    RC: {
      archives: [createArchive({ useRCVersion: true })],
    },
    multipleArch: {
      archives: [
        createArchive({ architecture: 'arm64', useRCVersion: false }),
        createArchive({ architecture: 'fake_arch', useRCVersion: false }),
        createArchive({ architecture: ARCHITECTURE, useRCVersion: false }),
      ],
    },
  };
});

const artifactTest = (fetchTimesCalled = 1) => {
  return async () => {
    const artifact = await Artifact.getSnapshot('oss', MOCK_VERSION, log);
    const expectedUrl = fetchTimesCalled === 1 ? MOCK_URL : MOCK_RC_URL;
    const expectedFilename = fetchTimesCalled === 1 ? MOCK_FILENAME : MOCK_RC_FILENAME;
    expect(fetch).toHaveBeenCalledTimes(fetchTimesCalled);
    expect(fetch.mock.calls[0][0]).toEqual(MOCK_URL);
    if (fetchTimesCalled !== 1) {
      expect(fetch.mock.calls[fetchTimesCalled - 1][0]).toEqual(MOCK_RC_URL);
    }
    expect(artifact.getUrl()).toEqual(expectedUrl);
    expect(artifact.getChecksumUrl()).toEqual(expectedUrl + '.sha512');
    expect(artifact.getChecksumType()).toEqual('sha512');
    expect(artifact.getFilename()).toEqual(expectedFilename);
  };
};

describe('Artifact', () => {
  describe('getSnapshot()', () => {
    itif('should return artifact metadata for a daily GA artifact', () => {
      mockFetch(MOCKS.GA);
      artifactTest();
    });

    itif('should return artifact metadata for a RC artifact', () => {
      fetch.mockReturnValueOnce(Promise.resolve(new Response('', { status: 404 })));
      fetch.mockReturnValueOnce(Promise.resolve(new Response('', { status: 404 })));
      mockFetch(MOCKS.RC);
      artifactTest(3);
    });

    itif('should throw when an artifact cannot be found for the specified parameters', async () => {
      fetch.mockReturnValue(Promise.resolve(new Response('', { status: 404 })));
      await expect(Artifact.getSnapshot('default', 'INVALID_VERSION', log)).rejects.toThrow(
        'Snapshots for INVALID_VERSION are not available'
      );
    });

    describe('with snapshots for multiple architectures', () => {
      afterAll(() => {
        Object.defineProperties(process, {
          platform: {
            value: ORIGINAL_PLATFORM,
          },
          arch: {
            value: ORIGINAL_ARCHITECTURE,
          },
        });
      });

      it('should throw when on a non-Linux, non-Windows, non-Darwin platform', async () => {
        Object.defineProperties(process, {
          platform: {
            value: 'android',
          },
          arch: {
            value: ORIGINAL_ARCHITECTURE,
          },
        });
        await expect(Artifact.getSnapshot('default', 'INVALID_PLATFORM', log)).rejects.toThrow(
          'Snapshots are only available for Linux, Windows, and Darwin'
        );
      });

      it('should not throw when on a non-x64 arch', async () => {
        Object.defineProperties(process, {
          platform: {
            value: ORIGINAL_PLATFORM,
          },
          arch: {
            value: 'arm64',
          },
        });
        mockFetch(MOCKS.multipleArch[0]);
        artifactTest();
      });

      it('should not throw when on a Linux platform', async () => {
        Object.defineProperties(process, {
          platform: {
            value: 'linux',
          },
          arch: {
            value: 'x64',
          },
        });
        artifactTest();
      });

      it('should not throw when on a Windows platform', async () => {
        Object.defineProperties(process, {
          platform: {
            value: 'win32',
          },
          arch: {
            value: 'x64',
          },
        });
        artifactTest();
      });

      it('should not throw when on a Darwin platform', async () => {
        Object.defineProperties(process, {
          platform: {
            value: 'darwin',
          },
          arch: {
            value: 'x64',
          },
        });
        artifactTest();
      });
    });

    describe('with custom snapshot manifest URL', () => {
      const CUSTOM_URL = 'http://www.creedthoughts.gov.www/creedthoughts';

      beforeEach(() => {
        process.env.OPENSEARCH_SNAPSHOT_MANIFEST = CUSTOM_URL;
        mockFetch(MOCKS.GA);
      });

      it('should use the custom URL when looking for a snapshot', async () => {
        await Artifact.getSnapshot('oss', MOCK_VERSION, log);
        expect(fetch.mock.calls[0][0]).toEqual(CUSTOM_URL);
      });

      afterEach(() => {
        delete process.env.OPENSEARCH_SNAPSHOT_MANIFEST;
      });
    });
  });
});
