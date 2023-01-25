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

import {
  mockReadFileSync,
  mockReadPkcs12Keystore,
  mockReadPkcs12Truststore,
} from './opensearch_config.test.mocks';

import { applyDeprecations, configDeprecationFactory } from '@osd/config';
import { OpenSearchConfig, config } from './opensearch_config';

const DEFAULT_CONFIG_PATH = 'opensearch';
const LEGACY_CONFIG_PATH = 'elasticsearch';

const applyOpenSearchDeprecations = (
  settings: Record<string, any> = {},
  path = DEFAULT_CONFIG_PATH
) => {
  const deprecations = config.deprecations!(configDeprecationFactory);
  const deprecationMessages: string[] = [];
  const _config: any = {};
  _config[path] = settings;
  const migrated = applyDeprecations(
    _config,
    deprecations.map((deprecation: any) => ({
      deprecation,
      path,
    })),
    (msg: any) => deprecationMessages.push(msg)
  );
  return {
    messages: deprecationMessages,
    migrated,
  };
};

const applyLegacyDeprecations = (settings: Record<string, any> = {}) => {
  return applyOpenSearchDeprecations(settings, LEGACY_CONFIG_PATH);
};

test('set correct defaults', () => {
  const configValue = new OpenSearchConfig(config.schema.validate({}));
  expect(configValue).toMatchInlineSnapshot(`
    OpenSearchConfig {
      "apiVersion": "7.x",
      "customHeaders": Object {},
      "disablePrototypePoisoningProtection": undefined,
      "healthCheckDelay": "PT2.5S",
      "hosts": Array [
        "http://localhost:9200",
      ],
      "ignoreVersionMismatch": false,
      "logQueries": false,
      "memoryCircuitBreaker": Object {
        "enabled": false,
        "maxPercentage": 1,
      },
      "optimizedHealthcheck": undefined,
      "password": undefined,
      "pingTimeout": "PT30S",
      "requestHeadersWhitelist": Array [
        "authorization",
      ],
      "requestTimeout": "PT30S",
      "shardTimeout": "PT30S",
      "sniffInterval": false,
      "sniffOnConnectionFault": false,
      "sniffOnStart": false,
      "ssl": Object {
        "alwaysPresentCertificate": false,
        "certificate": undefined,
        "certificateAuthorities": undefined,
        "key": undefined,
        "keyPassphrase": undefined,
        "verificationMode": "full",
      },
      "username": undefined,
    }
  `);
});

test('#hosts accepts both string and array of strings', () => {
  let configValue = new OpenSearchConfig(
    config.schema.validate({ hosts: 'http://some.host:1234' })
  );
  expect(configValue.hosts).toEqual(['http://some.host:1234']);

  configValue = new OpenSearchConfig(config.schema.validate({ hosts: ['http://some.host:1234'] }));
  expect(configValue.hosts).toEqual(['http://some.host:1234']);

  configValue = new OpenSearchConfig(
    config.schema.validate({
      hosts: ['http://some.host:1234', 'https://some.another.host'],
    })
  );
  expect(configValue.hosts).toEqual(['http://some.host:1234', 'https://some.another.host']);
});

test('#requestHeadersWhitelist accepts both string and array of strings', () => {
  let configValue = new OpenSearchConfig(
    config.schema.validate({ requestHeadersWhitelist: 'token' })
  );
  expect(configValue.requestHeadersWhitelist).toEqual(['token']);

  configValue = new OpenSearchConfig(
    config.schema.validate({ requestHeadersWhitelist: ['token'] })
  );
  expect(configValue.requestHeadersWhitelist).toEqual(['token']);

  configValue = new OpenSearchConfig(
    config.schema.validate({
      requestHeadersWhitelist: ['token', 'X-Forwarded-Proto'],
    })
  );
  expect(configValue.requestHeadersWhitelist).toEqual(['token', 'X-Forwarded-Proto']);
});

describe('reads files', () => {
  beforeEach(() => {
    mockReadFileSync.mockReset();
    mockReadFileSync.mockImplementation((path: string) => `content-of-${path}`);
    mockReadPkcs12Keystore.mockReset();
    mockReadPkcs12Keystore.mockImplementation((path: string) => ({
      key: `content-of-${path}.key`,
      cert: `content-of-${path}.cert`,
      ca: [`content-of-${path}.ca`],
    }));
    mockReadPkcs12Truststore.mockReset();
    mockReadPkcs12Truststore.mockImplementation((path: string) => [`content-of-${path}`]);
  });

  it('reads certificate authorities when ssl.keystore.path is specified', () => {
    const configValue = new OpenSearchConfig(
      config.schema.validate({ ssl: { keystore: { path: 'some-path' } } })
    );
    expect(mockReadPkcs12Keystore).toHaveBeenCalledTimes(1);
    expect(configValue.ssl.certificateAuthorities).toEqual(['content-of-some-path.ca']);
  });

  it('reads certificate authorities when ssl.truststore.path is specified', () => {
    const configValue = new OpenSearchConfig(
      config.schema.validate({ ssl: { truststore: { path: 'some-path' } } })
    );
    expect(mockReadPkcs12Truststore).toHaveBeenCalledTimes(1);
    expect(configValue.ssl.certificateAuthorities).toEqual(['content-of-some-path']);
  });

  it('reads certificate authorities when ssl.certificateAuthorities is specified', () => {
    let configValue = new OpenSearchConfig(
      config.schema.validate({ ssl: { certificateAuthorities: 'some-path' } })
    );
    expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    expect(configValue.ssl.certificateAuthorities).toEqual(['content-of-some-path']);

    mockReadFileSync.mockClear();
    configValue = new OpenSearchConfig(
      config.schema.validate({ ssl: { certificateAuthorities: ['some-path'] } })
    );
    expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    expect(configValue.ssl.certificateAuthorities).toEqual(['content-of-some-path']);

    mockReadFileSync.mockClear();
    configValue = new OpenSearchConfig(
      config.schema.validate({
        ssl: { certificateAuthorities: ['some-path', 'another-path'] },
      })
    );
    expect(mockReadFileSync).toHaveBeenCalledTimes(2);
    expect(configValue.ssl.certificateAuthorities).toEqual([
      'content-of-some-path',
      'content-of-another-path',
    ]);
  });

  it('reads certificate authorities when ssl.keystore.path, ssl.truststore.path, and ssl.certificateAuthorities are specified', () => {
    const configValue = new OpenSearchConfig(
      config.schema.validate({
        ssl: {
          keystore: { path: 'some-path' },
          truststore: { path: 'another-path' },
          certificateAuthorities: 'yet-another-path',
        },
      })
    );
    expect(mockReadPkcs12Keystore).toHaveBeenCalledTimes(1);
    expect(mockReadPkcs12Truststore).toHaveBeenCalledTimes(1);
    expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    expect(configValue.ssl.certificateAuthorities).toEqual([
      'content-of-some-path.ca',
      'content-of-another-path',
      'content-of-yet-another-path',
    ]);
  });

  it('reads a private key and certificate when ssl.keystore.path is specified', () => {
    const configValue = new OpenSearchConfig(
      config.schema.validate({ ssl: { keystore: { path: 'some-path' } } })
    );
    expect(mockReadPkcs12Keystore).toHaveBeenCalledTimes(1);
    expect(configValue.ssl.key).toEqual('content-of-some-path.key');
    expect(configValue.ssl.certificate).toEqual('content-of-some-path.cert');
  });

  it('reads a private key when ssl.key is specified', () => {
    const configValue = new OpenSearchConfig(config.schema.validate({ ssl: { key: 'some-path' } }));
    expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    expect(configValue.ssl.key).toEqual('content-of-some-path');
  });

  it('reads a certificate when ssl.certificate is specified', () => {
    const configValue = new OpenSearchConfig(
      config.schema.validate({ ssl: { certificate: 'some-path' } })
    );
    expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    expect(configValue.ssl.certificate).toEqual('content-of-some-path');
  });
});

describe('throws when config is invalid', () => {
  beforeAll(() => {
    const realFs = jest.requireActual('fs');
    mockReadFileSync.mockImplementation((path: string) => realFs.readFileSync(path));
    const utils = jest.requireActual('../utils');
    mockReadPkcs12Keystore.mockImplementation((path: string, password?: string) =>
      utils.readPkcs12Keystore(path, password)
    );
    mockReadPkcs12Truststore.mockImplementation((path: string, password?: string) =>
      utils.readPkcs12Truststore(path, password)
    );
  });

  it('throws if key is invalid', () => {
    const value = { ssl: { key: '/invalid/key' } };
    expect(
      () => new OpenSearchConfig(config.schema.validate(value))
    ).toThrowErrorMatchingInlineSnapshot(
      `"ENOENT: no such file or directory, open '/invalid/key'"`
    );
  });

  it('throws if certificate is invalid', () => {
    const value = { ssl: { certificate: '/invalid/cert' } };
    expect(
      () => new OpenSearchConfig(config.schema.validate(value))
    ).toThrowErrorMatchingInlineSnapshot(
      `"ENOENT: no such file or directory, open '/invalid/cert'"`
    );
  });

  it('throws if certificateAuthorities is invalid', () => {
    const value = { ssl: { certificateAuthorities: '/invalid/ca' } };
    expect(
      () => new OpenSearchConfig(config.schema.validate(value))
    ).toThrowErrorMatchingInlineSnapshot(`"ENOENT: no such file or directory, open '/invalid/ca'"`);
  });

  it('throws if keystore path is invalid', () => {
    const value = { ssl: { keystore: { path: '/invalid/keystore' } } };
    expect(
      () => new OpenSearchConfig(config.schema.validate(value))
    ).toThrowErrorMatchingInlineSnapshot(
      `"ENOENT: no such file or directory, open '/invalid/keystore'"`
    );
  });

  it('throws if keystore does not contain a key', () => {
    mockReadPkcs12Keystore.mockReturnValueOnce({});
    const value = { ssl: { keystore: { path: 'some-path' } } };
    expect(
      () => new OpenSearchConfig(config.schema.validate(value))
    ).toThrowErrorMatchingInlineSnapshot(`"Did not find key in OpenSearch keystore."`);
  });

  it('throws if keystore does not contain a certificate', () => {
    mockReadPkcs12Keystore.mockReturnValueOnce({ key: 'foo' });
    const value = { ssl: { keystore: { path: 'some-path' } } };
    expect(
      () => new OpenSearchConfig(config.schema.validate(value))
    ).toThrowErrorMatchingInlineSnapshot(`"Did not find certificate in OpenSearch keystore."`);
  });

  it('throws if truststore path is invalid', () => {
    const value = { ssl: { keystore: { path: '/invalid/truststore' } } };
    expect(
      () => new OpenSearchConfig(config.schema.validate(value))
    ).toThrowErrorMatchingInlineSnapshot(
      `"ENOENT: no such file or directory, open '/invalid/truststore'"`
    );
  });

  it('throws if key and keystore.path are both specified', () => {
    const value = { ssl: { key: 'foo', keystore: { path: 'bar' } } };
    expect(() => config.schema.validate(value)).toThrowErrorMatchingInlineSnapshot(
      `"[ssl]: cannot use [key] when [keystore.path] is specified"`
    );
  });

  it('throws if certificate and keystore.path are both specified', () => {
    const value = { ssl: { certificate: 'foo', keystore: { path: 'bar' } } };
    expect(() => config.schema.validate(value)).toThrowErrorMatchingInlineSnapshot(
      `"[ssl]: cannot use [certificate] when [keystore.path] is specified"`
    );
  });
});

describe('deprecations', () => {
  it('logs a warning if opensearch.username is set to "elastic"', () => {
    const { messages } = applyOpenSearchDeprecations({ username: 'elastic' });
    expect(messages).toMatchInlineSnapshot(`
      Array [
        "Setting [opensearch.username] to \\"elastic\\" is deprecated. You should use the \\"opensearch_dashboards_system\\" user instead.",
      ]
    `);
  });

  it('logs a warning if opensearch.username is set to "opensearchDashboards"', () => {
    const { messages } = applyOpenSearchDeprecations({ username: 'opensearchDashboards' });
    expect(messages).toMatchInlineSnapshot(`
      Array [
        "Setting [opensearch.username] to \\"opensearchDashboards\\" is deprecated. You should use the \\"opensearch_dashboards_system\\" user instead.",
      ]
    `);
  });

  it('does not log a warning if opensearch.username is set to something besides "elastic" or "opensearchDashboards"', () => {
    const { messages } = applyOpenSearchDeprecations({ username: 'otheruser' });
    expect(messages).toHaveLength(0);
  });

  it('does not log a warning if opensearch.username is unset', () => {
    const { messages } = applyOpenSearchDeprecations({});
    expect(messages).toHaveLength(0);
  });

  it('logs a warning if ssl.key is set and ssl.certificate is not', () => {
    const { messages } = applyOpenSearchDeprecations({ ssl: { key: '' } });
    expect(messages).toMatchInlineSnapshot(`
      Array [
        "Setting [opensearch.ssl.key] without [opensearch.ssl.certificate] is deprecated. This has no effect, you should use both settings to enable TLS client authentication to OpenSearch.",
      ]
    `);
  });

  it('logs a warning if ssl.certificate is set and ssl.key is not', () => {
    const { messages } = applyOpenSearchDeprecations({ ssl: { certificate: '' } });
    expect(messages).toMatchInlineSnapshot(`
      Array [
        "Setting [opensearch.ssl.certificate] without [opensearch.ssl.key] is deprecated. This has no effect, you should use both settings to enable TLS client authentication to OpenSearch.",
      ]
    `);
  });

  it('does not log a warning if both ssl.key and ssl.certificate are set', () => {
    const { messages } = applyOpenSearchDeprecations({ ssl: { key: '', certificate: '' } });
    expect(messages).toEqual([]);
  });

  it('logs a warning if elasticsearch.sniffOnStart is set and opensearch.sniffOnStart is not', () => {
    const { messages } = applyLegacyDeprecations({ sniffOnStart: true });
    expect(messages).toMatchInlineSnapshot(`
      Array [
        "\\"elasticsearch.sniffOnStart\\" is deprecated and has been replaced by \\"opensearch.sniffOnStart\\"",
      ]
    `);
  });

  it('logs a warning if elasticsearch.sniffInterval is set and opensearch.sniffInterval is not', () => {
    const { messages } = applyLegacyDeprecations({ sniffInterval: true });
    expect(messages).toMatchInlineSnapshot(`
      Array [
        "\\"elasticsearch.sniffInterval\\" is deprecated and has been replaced by \\"opensearch.sniffInterval\\"",
      ]
    `);
  });

  it('logs a warning if elasticsearch.sniffOnConnectionFault is set and opensearch.sniffOnConnectionFault is not', () => {
    const { messages } = applyLegacyDeprecations({ sniffOnConnectionFault: true });
    expect(messages).toMatchInlineSnapshot(`
      Array [
        "\\"elasticsearch.sniffOnConnectionFault\\" is deprecated and has been replaced by \\"opensearch.sniffOnConnectionFault\\"",
      ]
    `);
  });

  it('logs a warning if elasticsearch.hosts is set and opensearch.hosts is not', () => {
    const { messages } = applyLegacyDeprecations({ hosts: [''] });
    expect(messages).toMatchInlineSnapshot(`
      Array [
        "\\"elasticsearch.hosts\\" is deprecated and has been replaced by \\"opensearch.hosts\\"",
      ]
    `);
  });

  it('logs a warning if elasticsearch.username is set and opensearch.username is not', () => {
    const { messages } = applyLegacyDeprecations({ username: '' });
    expect(messages).toMatchInlineSnapshot(`
      Array [
        "\\"elasticsearch.username\\" is deprecated and has been replaced by \\"opensearch.username\\"",
      ]
    `);
  });

  it('logs a warning if elasticsearch.password is set and opensearch.password is not', () => {
    const { messages } = applyLegacyDeprecations({ password: '' });
    expect(messages).toMatchInlineSnapshot(`
      Array [
        "\\"elasticsearch.password\\" is deprecated and has been replaced by \\"opensearch.password\\"",
      ]
    `);
  });

  it('logs a warning if elasticsearch.requestHeadersWhitelist is set and opensearch.requestHeadersWhitelist is not', () => {
    const { messages } = applyLegacyDeprecations({ requestHeadersWhitelist: [''] });
    expect(messages).toMatchInlineSnapshot(`
      Array [
        "\\"elasticsearch.requestHeadersWhitelist\\" is deprecated and has been replaced by \\"opensearch.requestHeadersWhitelist\\"",
        "\\"opensearch.requestHeadersWhitelist\\" is deprecated and has been replaced by \\"opensearch.requestHeadersAllowlist\\"",
      ]
    `);
  });

  it('logs a warning if elasticsearch.customHeaders is set and opensearch.customHeaders is not', () => {
    const { messages } = applyLegacyDeprecations({ customHeaders: [''] });
    expect(messages).toMatchInlineSnapshot(`
      Array [
        "\\"elasticsearch.customHeaders\\" is deprecated and has been replaced by \\"opensearch.customHeaders\\"",
      ]
    `);
  });

  it('logs a warning if elasticsearch.shardTimeout is set and opensearch.shardTimeout is not', () => {
    const { messages } = applyLegacyDeprecations({ shardTimeout: 100 });
    expect(messages).toMatchInlineSnapshot(`
      Array [
        "\\"elasticsearch.shardTimeout\\" is deprecated and has been replaced by \\"opensearch.shardTimeout\\"",
      ]
    `);
  });

  it('logs a warning if elasticsearch.requestTimeout is set and opensearch.requestTimeout is not', () => {
    const { messages } = applyLegacyDeprecations({ requestTimeout: 100 });
    expect(messages).toMatchInlineSnapshot(`
      Array [
        "\\"elasticsearch.requestTimeout\\" is deprecated and has been replaced by \\"opensearch.requestTimeout\\"",
      ]
    `);
  });

  it('logs a warning if elasticsearch.pingTimeout is set and opensearch.pingTimeout is not', () => {
    const { messages } = applyLegacyDeprecations({ pingTimeout: 100 });
    expect(messages).toMatchInlineSnapshot(`
      Array [
        "\\"elasticsearch.pingTimeout\\" is deprecated and has been replaced by \\"opensearch.pingTimeout\\"",
      ]
    `);
  });

  it('logs a warning if elasticsearch.logQueries is set and opensearch.logQueries is not', () => {
    const { messages } = applyLegacyDeprecations({ logQueries: true });
    expect(messages).toMatchInlineSnapshot(`
      Array [
        "\\"elasticsearch.logQueries\\" is deprecated and has been replaced by \\"opensearch.logQueries\\"",
      ]
    `);
  });

  it('logs a warning if elasticsearch.optimizedHealthcheckId is set and opensearch.optimizedHealthcheck.id is not', () => {
    const { messages } = applyLegacyDeprecations({ optimizedHealthcheckId: '' });
    expect(messages).toMatchInlineSnapshot(`
      Array [
        "\\"elasticsearch.optimizedHealthcheckId\\" is deprecated and has been replaced by \\"opensearch.optimizedHealthcheck.id\\"",
      ]
    `);
  });

  it('logs a warning if opensearch.optimizedHealthcheckId is set and opensearch.optimizedHealthcheck.id is not', () => {
    const { messages } = applyOpenSearchDeprecations({ optimizedHealthcheckId: '' });
    expect(messages).toMatchInlineSnapshot(`
      Array [
        "\\"opensearch.optimizedHealthcheckId\\" is deprecated and has been replaced by \\"opensearch.optimizedHealthcheck.id\\"",
      ]
    `);
  });

  it('logs a warning if elasticsearch.ssl is set and opensearch.ssl is not', () => {
    const { messages } = applyLegacyDeprecations({ ssl: true });
    expect(messages).toMatchInlineSnapshot(`
      Array [
        "\\"elasticsearch.ssl\\" is deprecated and has been replaced by \\"opensearch.ssl\\"",
      ]
    `);
  });

  it('logs a warning if elasticsearch.ssl.certificate is set and opensearch.ssl.certificate is not', () => {
    const { messages } = applyLegacyDeprecations({ ssl: { certificate: '' } });
    expect(messages).toMatchInlineSnapshot(`
      Array [
        "\\"elasticsearch.ssl\\" is deprecated and has been replaced by \\"opensearch.ssl\\"",
      ]
    `);
  });

  it('logs a warning if elasticsearch.apiVersion is set and opensearch.apiVersion is not', () => {
    const { messages } = applyLegacyDeprecations({ apiVersion: '' });
    expect(messages).toMatchInlineSnapshot(`
      Array [
        "\\"elasticsearch.apiVersion\\" is deprecated and has been replaced by \\"opensearch.apiVersion\\"",
      ]
    `);
  });

  it('logs a warning if elasticsearch.healthCheck is set and opensearch.healthCheck is not', () => {
    const { messages } = applyLegacyDeprecations({ healthCheck: true });
    expect(messages).toMatchInlineSnapshot(`
      Array [
        "\\"elasticsearch.healthCheck\\" is deprecated and has been replaced by \\"opensearch.healthCheck\\"",
      ]
    `);
  });

  it('logs a warning if elasticsearch.ignoreVersionMismatch is set and opensearch.ignoreVersionMismatch is not', () => {
    const { messages } = applyLegacyDeprecations({ ignoreVersionMismatch: true });
    expect(messages).toMatchInlineSnapshot(`
      Array [
        "\\"elasticsearch.ignoreVersionMismatch\\" is deprecated and has been replaced by \\"opensearch.ignoreVersionMismatch\\"",
      ]
    `);
  });
});

test('#username throws if equal to "elastic", only while running from source', () => {
  const obj = {
    username: 'elastic',
  };
  expect(() => config.schema.validate(obj, { dist: false })).toThrowErrorMatchingInlineSnapshot(
    `"[username]: value of \\"elastic\\" is forbidden. This is a superuser account that can obfuscate privilege-related issues. You should use the \\"opensearch_dashboards_system\\" user instead."`
  );
  expect(() => config.schema.validate(obj, { dist: true })).not.toThrow();
});
