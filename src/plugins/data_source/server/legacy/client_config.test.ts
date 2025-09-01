/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { duration } from 'moment';
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
      globalOpenSearchConfig: {
        requestTimeout: duration(10, 'seconds'),
        pingTimeout: duration(20, 'seconds'),
      },
    } as DataSourcePluginConfigType;

    expect(parseClientOptions(config, TEST_DATA_SOURCE_ENDPOINT, [])).toEqual(
      expect.objectContaining({
        host: TEST_DATA_SOURCE_ENDPOINT,
        ssl: {
          rejectUnauthorized: true,
        },
        requestTimeout: 10000,
        pingTimeout: 20000,
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
      globalOpenSearchConfig: {
        requestTimeout: duration(10, 'seconds'),
        pingTimeout: duration(20, 'seconds'),
      },
    } as DataSourcePluginConfigType;
    expect(parseClientOptions(config, TEST_DATA_SOURCE_ENDPOINT, [])).toEqual(
      expect.objectContaining({
        host: TEST_DATA_SOURCE_ENDPOINT,
        ssl: {
          rejectUnauthorized: false,
          ca: undefined,
        },
        requestTimeout: 10000,
        pingTimeout: 20000,
      })
    );
  });

  test('test ssl config with verification mode set to certificate', () => {
    const config = {
      enabled: true,
      ssl: {
        verificationMode: 'certificate',
        certificateAuthorities: ['some-path'],
      },
      clientPool: {
        size: 5,
      },
      globalOpenSearchConfig: {
        requestTimeout: duration(10, 'seconds'),
        pingTimeout: duration(20, 'seconds'),
      },
    } as DataSourcePluginConfigType;
    mockReadFileSync.mockReset();
    mockReadFileSync.mockImplementation((path: string) => `content-of-${path}`);
    const parsedConfig = parseClientOptions(config, TEST_DATA_SOURCE_ENDPOINT, []);
    expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    mockReadFileSync.mockClear();
    expect(parsedConfig).toEqual(
      expect.objectContaining({
        host: TEST_DATA_SOURCE_ENDPOINT,
        ssl: {
          rejectUnauthorized: true,
          checkServerIdentity: expect.any(Function),
          ca: ['content-of-some-path'],
        },
        requestTimeout: 10000,
        pingTimeout: 20000,
      })
    );
    // @ts-expect-error TS2339 TODO(ts-error): fixme
    expect(parsedConfig.ssl?.checkServerIdentity()).toBeUndefined();
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
      globalOpenSearchConfig: {
        requestTimeout: duration(10, 'seconds'),
        pingTimeout: duration(20, 'seconds'),
      },
    } as DataSourcePluginConfigType;
    mockReadFileSync.mockReset();
    mockReadFileSync.mockImplementation((path: string) => `content-of-${path}`);
    const parsedConfig = parseClientOptions(config, TEST_DATA_SOURCE_ENDPOINT, []);
    expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    mockReadFileSync.mockClear();
    expect(parsedConfig).toEqual(
      expect.objectContaining({
        host: TEST_DATA_SOURCE_ENDPOINT,
        ssl: {
          rejectUnauthorized: true,
          ca: ['content-of-some-path'],
        },
        requestTimeout: 10000,
        pingTimeout: 20000,
      })
    );
  });

  test('test ssl config with verification mode set to full with no ca list', () => {
    const config = {
      enabled: true,
      ssl: {
        verificationMode: 'full',
      },
      clientPool: {
        size: 5,
      },
      globalOpenSearchConfig: {
        requestTimeout: duration(10, 'seconds'),
        pingTimeout: duration(20, 'seconds'),
      },
    } as DataSourcePluginConfigType;
    mockReadFileSync.mockReset();
    mockReadFileSync.mockImplementation((path: string) => `content-of-${path}`);
    const parsedConfig = parseClientOptions(config, TEST_DATA_SOURCE_ENDPOINT, []);
    expect(mockReadFileSync).toHaveBeenCalledTimes(0);
    mockReadFileSync.mockClear();
    expect(parsedConfig).toEqual(
      expect.objectContaining({
        host: TEST_DATA_SOURCE_ENDPOINT,
        ssl: {
          rejectUnauthorized: true,
          ca: undefined,
        },
        requestTimeout: 10000,
        pingTimeout: 20000,
      })
    );
  });

  test('test honor pingTimeout and requestTimeout from the global configs', () => {
    const config = {
      enabled: true,
      ssl: {
        verificationMode: 'full',
      },
      clientPool: {
        size: 5,
      },
      globalOpenSearchConfig: {
        requestTimeout: duration(15, 'seconds'),
        pingTimeout: duration(25, 'seconds'),
      },
    } as DataSourcePluginConfigType;
    mockReadFileSync.mockReset();
    mockReadFileSync.mockImplementation((path: string) => `content-of-${path}`);
    const parsedConfig = parseClientOptions(config, TEST_DATA_SOURCE_ENDPOINT, []);
    expect(mockReadFileSync).toHaveBeenCalledTimes(0);
    mockReadFileSync.mockClear();
    expect(parsedConfig).toEqual(
      expect.objectContaining({
        host: TEST_DATA_SOURCE_ENDPOINT,
        ssl: {
          rejectUnauthorized: true,
          ca: undefined,
        },
        requestTimeout: 15000,
        pingTimeout: 25000,
      })
    );
  });
});
