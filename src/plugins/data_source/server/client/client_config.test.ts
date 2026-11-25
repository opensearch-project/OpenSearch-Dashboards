/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { duration } from 'moment';
import { DataSourcePluginConfigType } from '../../config';
import { parseClientOptions } from './client_config';
import http from 'http';
import { AddressInfo } from 'net';
import { Client } from '@opensearch-project/opensearch';
import { Client as LegacyClient } from 'elasticsearch';
import { HttpRequest } from '@smithy/protocol-http';
import Host from 'elasticsearch/src/lib/host';
import { parseClientOptions as parseLegacyClientOptions } from '../legacy/client_config';
import HttpAmazonESConnector from '../legacy/http_aws_es/connector';

// Keep the real fs module, because importing the endpoint validator loads @osd/utils, which reads
// the file system at import time. readFileSync calls the real one until a test resets the mock.
jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return { ...actual, readFileSync: jest.fn(actual.readFileSync) };
});
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

  test('includes accept-encoding header when requestCompression is true', () => {
    const config = {
      enabled: true,
      clientPool: {
        size: 5,
      },
      globalOpenSearchConfig: {
        requestTimeout: duration(1, 'seconds'),
        pingTimeout: duration(2, 'seconds'),
        requestCompression: true,
      },
    } as DataSourcePluginConfigType;

    const parsedConfig = parseClientOptions(config, TEST_DATA_SOURCE_ENDPOINT, []);
    expect(parsedConfig.headers).toEqual({ 'accept-encoding': 'gzip, deflate' });
  });
});

/**
 * These tests open a real socket to a server on this machine. The host name `localhost` resolves
 * to a loopback address, which the connect-time guard must refuse before any connection is made.
 */
describe('connect-time guard on data source clients', () => {
  let server: http.Server;
  let port: number;
  let connections: number;

  const config = (endpointDeniedIPs?: string[]) =>
    ({
      enabled: true,
      endpointDeniedIPs,
      globalOpenSearchConfig: {
        requestTimeout: duration(5, 'seconds'),
        pingTimeout: duration(5, 'seconds'),
      },
    }) as DataSourcePluginConfigType;

  beforeAll(async () => {
    server = http.createServer((_req, res) => {
      res.setHeader('content-type', 'application/json');
      res.end('{}');
    });
    server.on('connection', () => {
      connections++;
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    port = (server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(() => {
    connections = 0;
  });

  describe('modern client', () => {
    it('refuses a host name that resolves to a denied address, with no connection', async () => {
      const client = new Client(
        parseClientOptions(config(['127.0.0.0/8', '::1/128']), `http://localhost:${port}`, [])
      );
      await expect(client.ping()).rejects.toThrow();
      expect(connections).toBe(0);
      await client.close();
    });

    it('connects when no denylist is configured', async () => {
      const client = new Client(parseClientOptions(config(), `http://localhost:${port}`, []));
      await client.ping();
      expect(connections).toBeGreaterThan(0);
      await client.close();
    });
  });

  describe('legacy client', () => {
    it('refuses a host name that resolves to a denied address, with no connection', async () => {
      const client = new LegacyClient(
        parseLegacyClientOptions(config(['127.0.0.0/8', '::1/128']), `http://localhost:${port}`, [])
      );
      await expect(client.ping({ requestTimeout: 2000 })).rejects.toBeDefined();
      expect(connections).toBe(0);
      client.close();
    });

    it('connects when no denylist is configured', async () => {
      const client = new LegacyClient(
        parseLegacyClientOptions(config(), `http://localhost:${port}`, [])
      );
      await client.ping({ requestTimeout: 2000 });
      expect(connections).toBeGreaterThan(0);
      client.close();
    });
  });

  describe('legacy SigV4 connector', () => {
    const send = (connector: any) =>
      connector.httpClient.handle(
        new HttpRequest({
          protocol: 'http:',
          hostname: 'localhost',
          port,
          method: 'GET',
          path: '/',
          headers: { host: `localhost:${port}` },
        })
      );

    const makeConnector = (endpointDeniedIPs?: string[]) => {
      const options: any = parseLegacyClientOptions(
        config(endpointDeniedIPs),
        `http://localhost:${port}`,
        []
      );
      return new (HttpAmazonESConnector as any)(
        new Host({ protocol: 'http', host: 'localhost', port }),
        { ...options, awsConfig: { region: 'us-west-2' } }
      );
    };

    it('refuses a host name that resolves to a denied address, with no connection', async () => {
      await expect(send(makeConnector(['127.0.0.0/8', '::1/128']))).rejects.toThrow();
      expect(connections).toBe(0);
    });

    it('connects when no denylist is configured', async () => {
      await send(makeConnector());
      expect(connections).toBeGreaterThan(0);
    });
  });
});
