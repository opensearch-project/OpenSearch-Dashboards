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
        requestTimeout: duration(1, 'seconds'),
        pingTimeout: duration(2, 'seconds'),
      },
    } as DataSourcePluginConfigType;

    expect(parseClientOptions(config, TEST_DATA_SOURCE_ENDPOINT, [])).toEqual(
      expect.objectContaining({
        node: TEST_DATA_SOURCE_ENDPOINT,
        ssl: {
          requestCert: true,
          rejectUnauthorized: true,
        },
        requestTimeout: 1000,
        pingTimeout: 2000,
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
        requestTimeout: duration(1, 'seconds'),
        pingTimeout: duration(2, 'seconds'),
      },
    } as DataSourcePluginConfigType;
    expect(parseClientOptions(config, TEST_DATA_SOURCE_ENDPOINT, [])).toEqual(
      expect.objectContaining({
        node: TEST_DATA_SOURCE_ENDPOINT,
        ssl: {
          requestCert: true,
          rejectUnauthorized: false,
          ca: undefined,
        },
        requestTimeout: 1000,
        pingTimeout: 2000,
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
        requestTimeout: duration(1, 'seconds'),
        pingTimeout: duration(2, 'seconds'),
      },
    } as DataSourcePluginConfigType;
    mockReadFileSync.mockReset();
    mockReadFileSync.mockImplementation((path: string) => `content-of-${path}`);
    const parsedConfig = parseClientOptions(config, TEST_DATA_SOURCE_ENDPOINT, []);
    expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    mockReadFileSync.mockClear();
    expect(parsedConfig).toEqual(
      expect.objectContaining({
        node: TEST_DATA_SOURCE_ENDPOINT,
        ssl: {
          requestCert: true,
          rejectUnauthorized: true,
          checkServerIdentity: expect.any(Function),
          ca: ['content-of-some-path'],
        },
        requestTimeout: 1000,
        pingTimeout: 2000,
      })
    );
    // @ts-expect-error TS2722, TS2554 TODO(ts-error): fixme
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
        requestTimeout: duration(1, 'seconds'),
        pingTimeout: duration(2, 'seconds'),
      },
    } as DataSourcePluginConfigType;
    mockReadFileSync.mockReset();
    mockReadFileSync.mockImplementation((path: string) => `content-of-${path}`);
    const parsedConfig = parseClientOptions(config, TEST_DATA_SOURCE_ENDPOINT, []);
    expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    mockReadFileSync.mockClear();
    expect(parsedConfig).toEqual(
      expect.objectContaining({
        node: TEST_DATA_SOURCE_ENDPOINT,
        ssl: {
          requestCert: true,
          rejectUnauthorized: true,
          ca: ['content-of-some-path'],
        },
        requestTimeout: 1000,
        pingTimeout: 2000,
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
        requestTimeout: duration(1, 'seconds'),
        pingTimeout: duration(2, 'seconds'),
      },
    } as DataSourcePluginConfigType;
    mockReadFileSync.mockReset();
    mockReadFileSync.mockImplementation((path: string) => `content-of-${path}`);
    const parsedConfig = parseClientOptions(config, TEST_DATA_SOURCE_ENDPOINT, []);
    expect(mockReadFileSync).toHaveBeenCalledTimes(0);
    mockReadFileSync.mockClear();
    expect(parsedConfig).toEqual(
      expect.objectContaining({
        node: TEST_DATA_SOURCE_ENDPOINT,
        ssl: {
          requestCert: true,
          rejectUnauthorized: true,
          ca: undefined,
        },
        requestTimeout: 1000,
        pingTimeout: 2000,
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
        requestTimeout: duration(1, 'seconds'),
        pingTimeout: duration(2, 'seconds'),
      },
    } as DataSourcePluginConfigType;
    mockReadFileSync.mockReset();
    mockReadFileSync.mockImplementation((path: string) => `content-of-${path}`);
    const parsedConfig = parseClientOptions(config, TEST_DATA_SOURCE_ENDPOINT, []);
    expect(mockReadFileSync).toHaveBeenCalledTimes(0);
    mockReadFileSync.mockClear();
    expect(parsedConfig).toEqual(
      expect.objectContaining({
        node: TEST_DATA_SOURCE_ENDPOINT,
        ssl: {
          requestCert: true,
          rejectUnauthorized: true,
          ca: undefined,
        },
        requestTimeout: 1000,
        pingTimeout: 2000,
      })
    );
  });
});
