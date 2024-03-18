/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { DataSourcePluginConfigType } from '../../config';
import { parseClientOptions } from './client_config';

jest.mock('fs');
const mockReadFileSync: jest.Mock = jest.requireMock('fs').readFileSync;

const TEST_DATA_SOURCE_ENDPOINT = 'http://test.com/';

describe('parseClientOptions', () => {
  test('include the ssl client configs as defaults', () => {
    const config = {
      enabled: true,
      clientPool: {
        size: 5,
      },
    } as DataSourcePluginConfigType;

    expect(parseClientOptions(config, TEST_DATA_SOURCE_ENDPOINT)).toEqual(
      expect.objectContaining({
        host: TEST_DATA_SOURCE_ENDPOINT,
        ssl: {
          rejectUnauthorized: true,
        },
      })
    );
  });

  test('test ssl config with verification mode set to none', () => {
    const config = {
      enabled: true,
      ssl: {
        verificationMode: 'none',
      },
      clientPool: {
        size: 5,
      },
    } as DataSourcePluginConfigType;
    expect(parseClientOptions(config, TEST_DATA_SOURCE_ENDPOINT)).toEqual(
      expect.objectContaining({
        host: TEST_DATA_SOURCE_ENDPOINT,
        ssl: {
          rejectUnauthorized: false,
          ca: [],
        },
      })
    );
  });

  test('test ssl config with verification mode set to full', () => {
    const config = {
      enabled: true,
      ssl: {
        verificationMode: 'full',
        certificateAuthorities: ['some-path'],
      },
      clientPool: {
        size: 5,
      },
    } as DataSourcePluginConfigType;
    mockReadFileSync.mockReset();
    mockReadFileSync.mockImplementation((path: string) => `content-of-${path}`);
    const parsedConfig = parseClientOptions(config, TEST_DATA_SOURCE_ENDPOINT);
    expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    mockReadFileSync.mockClear();
    expect(parsedConfig).toEqual(
      expect.objectContaining({
        host: TEST_DATA_SOURCE_ENDPOINT,
        ssl: {
          rejectUnauthorized: true,
          ca: ['content-of-some-path'],
        },
      })
    );
  });
});
