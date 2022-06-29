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

import { duration } from 'moment';
import { loggingSystemMock } from '../../logging/logging_system.mock';
import {
  LegacyOpenSearchClientConfig,
  parseOpenSearchClientConfig,
} from './opensearch_client_config';
import { DEFAULT_HEADERS } from '../default_headers';
const logger = loggingSystemMock.create();
afterEach(() => jest.clearAllMocks());

test('parses minimally specified config', () => {
  expect(
    parseOpenSearchClientConfig(
      {
        apiVersion: 'main',
        customHeaders: { xsrf: 'something' },
        logQueries: false,
        sniffOnStart: false,
        sniffOnConnectionFault: false,
        hosts: ['http://localhost/opensearch'],
        requestHeadersWhitelist: [],
      },

      logger.get()
    )
  ).toMatchInlineSnapshot(`
    Object {
      "apiVersion": "main",
      "hosts": Array [
        Object {
          "headers": Object {
            "x-opensearch-product-origin": "opensearch-dashboards",
            "xsrf": "something",
          },
          "host": "localhost",
          "path": "/opensearch",
          "port": "80",
          "protocol": "http:",
          "query": null,
        },
      ],
      "keepAlive": true,
      "log": [Function],
      "sniffOnConnectionFault": false,
      "sniffOnStart": false,
    }
  `);
});

test('parses fully specified config', () => {
  const opensearchConfig: LegacyOpenSearchClientConfig = {
    apiVersion: 'v7.0.0',
    customHeaders: { xsrf: 'something' },
    logQueries: true,
    sniffOnStart: true,
    sniffOnConnectionFault: true,
    hosts: [
      'http://localhost/opensearch',
      'http://domain.com:1234/opensearch',
      'https://opensearch.local',
    ],
    requestHeadersWhitelist: [],
    username: 'opensearch',
    password: 'changeme',
    pingTimeout: 12345,
    requestTimeout: 54321,
    sniffInterval: 11223344,
    ssl: {
      verificationMode: 'certificate',
      certificateAuthorities: ['content-of-ca-path-1', 'content-of-ca-path-2'],
      certificate: 'content-of-certificate-path',
      key: 'content-of-key-path',
      keyPassphrase: 'key-pass',
      alwaysPresentCertificate: true,
    },
  };

  const opensearchClientConfig = parseOpenSearchClientConfig(opensearchConfig, logger.get());

  // Check that original references aren't used.
  for (const host of opensearchClientConfig.hosts) {
    expect(opensearchConfig.customHeaders).not.toBe(host.headers);
  }

  expect(opensearchConfig.ssl).not.toBe(opensearchClientConfig.ssl);

  expect(opensearchClientConfig).toMatchInlineSnapshot(`
    Object {
      "apiVersion": "v7.0.0",
      "hosts": Array [
        Object {
          "auth": "opensearch:changeme",
          "headers": Object {
            "x-opensearch-product-origin": "opensearch-dashboards",
            "xsrf": "something",
          },
          "host": "localhost",
          "path": "/opensearch",
          "port": "80",
          "protocol": "http:",
          "query": null,
        },
        Object {
          "auth": "opensearch:changeme",
          "headers": Object {
            "x-opensearch-product-origin": "opensearch-dashboards",
            "xsrf": "something",
          },
          "host": "domain.com",
          "path": "/opensearch",
          "port": "1234",
          "protocol": "http:",
          "query": null,
        },
        Object {
          "auth": "opensearch:changeme",
          "headers": Object {
            "x-opensearch-product-origin": "opensearch-dashboards",
            "xsrf": "something",
          },
          "host": "opensearch.local",
          "path": "/",
          "port": "443",
          "protocol": "https:",
          "query": null,
        },
      ],
      "keepAlive": true,
      "log": [Function],
      "pingTimeout": 12345,
      "requestTimeout": 54321,
      "sniffInterval": 11223344,
      "sniffOnConnectionFault": true,
      "sniffOnStart": true,
      "ssl": Object {
        "ca": Array [
          "content-of-ca-path-1",
          "content-of-ca-path-2",
        ],
        "cert": "content-of-certificate-path",
        "checkServerIdentity": [Function],
        "key": "content-of-key-path",
        "passphrase": "key-pass",
        "rejectUnauthorized": true,
      },
    }
  `);
});

test('parses config timeouts of moment.Duration type', () => {
  expect(
    parseOpenSearchClientConfig(
      {
        apiVersion: 'main',
        customHeaders: { xsrf: 'something' },
        logQueries: false,
        sniffOnStart: false,
        sniffOnConnectionFault: false,
        pingTimeout: duration(100, 'ms'),
        requestTimeout: duration(30, 's'),
        sniffInterval: duration(1, 'minute'),
        hosts: ['http://localhost:9200/opensearch'],
        requestHeadersWhitelist: [],
      },

      logger.get()
    )
  ).toMatchInlineSnapshot(`
    Object {
      "apiVersion": "main",
      "hosts": Array [
        Object {
          "headers": Object {
            "x-opensearch-product-origin": "opensearch-dashboards",
            "xsrf": "something",
          },
          "host": "localhost",
          "path": "/opensearch",
          "port": "9200",
          "protocol": "http:",
          "query": null,
        },
      ],
      "keepAlive": true,
      "log": [Function],
      "pingTimeout": 100,
      "requestTimeout": 30000,
      "sniffInterval": 60000,
      "sniffOnConnectionFault": false,
      "sniffOnStart": false,
    }
  `);
});

describe('#auth', () => {
  test('is not set if #auth = false even if username and password are provided', () => {
    expect(
      parseOpenSearchClientConfig(
        {
          apiVersion: 'v7.0.0',
          customHeaders: { xsrf: 'something' },
          logQueries: true,
          sniffOnStart: true,
          sniffOnConnectionFault: true,
          hosts: ['http://user:password@localhost/opensearch', 'https://opensearch.local'],
          username: 'opensearch',
          password: 'changeme',
          requestHeadersWhitelist: [],
        },
        logger.get(),
        { auth: false }
      )
    ).toMatchInlineSnapshot(`
      Object {
        "apiVersion": "v7.0.0",
        "hosts": Array [
          Object {
            "headers": Object {
              "x-opensearch-product-origin": "opensearch-dashboards",
              "xsrf": "something",
            },
            "host": "localhost",
            "path": "/opensearch",
            "port": "80",
            "protocol": "http:",
            "query": null,
          },
          Object {
            "headers": Object {
              "x-opensearch-product-origin": "opensearch-dashboards",
              "xsrf": "something",
            },
            "host": "opensearch.local",
            "path": "/",
            "port": "443",
            "protocol": "https:",
            "query": null,
          },
        ],
        "keepAlive": true,
        "log": [Function],
        "sniffOnConnectionFault": true,
        "sniffOnStart": true,
      }
    `);
  });

  test('is not set if username is not specified', () => {
    expect(
      parseOpenSearchClientConfig(
        {
          apiVersion: 'v7.0.0',
          customHeaders: { xsrf: 'something' },
          logQueries: true,
          sniffOnStart: true,
          sniffOnConnectionFault: true,
          hosts: ['https://opensearch.local'],
          requestHeadersWhitelist: [],
          password: 'changeme',
        },
        logger.get(),
        { auth: true }
      )
    ).toMatchInlineSnapshot(`
      Object {
        "apiVersion": "v7.0.0",
        "hosts": Array [
          Object {
            "headers": Object {
              "x-opensearch-product-origin": "opensearch-dashboards",
              "xsrf": "something",
            },
            "host": "opensearch.local",
            "path": "/",
            "port": "443",
            "protocol": "https:",
            "query": null,
          },
        ],
        "keepAlive": true,
        "log": [Function],
        "sniffOnConnectionFault": true,
        "sniffOnStart": true,
      }
    `);
  });

  test('is not set if password is not specified', () => {
    expect(
      parseOpenSearchClientConfig(
        {
          apiVersion: 'v7.0.0',
          customHeaders: { xsrf: 'something' },
          logQueries: true,
          sniffOnStart: true,
          sniffOnConnectionFault: true,
          hosts: ['https://opensearch.local'],
          requestHeadersWhitelist: [],
          username: 'opensearch',
        },
        logger.get(),
        { auth: true }
      )
    ).toMatchInlineSnapshot(`
      Object {
        "apiVersion": "v7.0.0",
        "hosts": Array [
          Object {
            "headers": Object {
              "x-opensearch-product-origin": "opensearch-dashboards",
              "xsrf": "something",
            },
            "host": "opensearch.local",
            "path": "/",
            "port": "443",
            "protocol": "https:",
            "query": null,
          },
        ],
        "keepAlive": true,
        "log": [Function],
        "sniffOnConnectionFault": true,
        "sniffOnStart": true,
      }
    `);
  });
});

describe('#customHeaders', () => {
  test('override the default headers', () => {
    const headerKey = Object.keys(DEFAULT_HEADERS)[0];
    const parsedConfig = parseOpenSearchClientConfig(
      {
        apiVersion: 'main',
        customHeaders: { [headerKey]: 'foo' },
        logQueries: false,
        sniffOnStart: false,
        sniffOnConnectionFault: false,
        hosts: ['http://localhost/opensearch'],
        requestHeadersWhitelist: [],
      },
      logger.get()
    );
    expect(parsedConfig.hosts[0].headers).toEqual({
      [headerKey]: 'foo',
    });
  });
});

describe('#log', () => {
  test('default logger with #logQueries = false', () => {
    const parsedConfig = parseOpenSearchClientConfig(
      {
        apiVersion: 'main',
        customHeaders: { xsrf: 'something' },
        logQueries: false,
        sniffOnStart: false,
        sniffOnConnectionFault: false,
        hosts: ['http://localhost/opensearch'],
        requestHeadersWhitelist: [],
      },
      logger.get()
    );

    const Logger = new parsedConfig.log();
    Logger.error('some-error');
    Logger.warning('some-warning');
    Logger.trace('some-trace');
    Logger.info('some-info');
    Logger.debug('some-debug');

    expect(typeof Logger.close).toBe('function');

    expect(loggingSystemMock.collect(logger)).toMatchInlineSnapshot(`
      Object {
        "debug": Array [],
        "error": Array [
          Array [
            "some-error",
          ],
        ],
        "fatal": Array [],
        "info": Array [],
        "log": Array [],
        "trace": Array [],
        "warn": Array [
          Array [
            "some-warning",
          ],
        ],
      }
    `);
  });

  test('default logger with #logQueries = true', () => {
    const parsedConfig = parseOpenSearchClientConfig(
      {
        apiVersion: 'main',
        customHeaders: { xsrf: 'something' },
        logQueries: true,
        sniffOnStart: false,
        sniffOnConnectionFault: false,
        hosts: ['http://localhost/opensearch'],
        requestHeadersWhitelist: [],
      },
      logger.get()
    );

    const Logger = new parsedConfig.log();
    Logger.error('some-error');
    Logger.warning('some-warning');

    Logger.trace('METHOD', { path: '/some-path' }, '?query=2', 'unknown', '304');

    Logger.info('some-info');
    Logger.debug('some-debug');

    expect(typeof Logger.close).toBe('function');

    expect(loggingSystemMock.collect(logger)).toMatchInlineSnapshot(`
      Object {
        "debug": Array [
          Array [
            "304
      METHOD /some-path
      ?query=2",
            Object {
              "tags": Array [
                "query",
              ],
            },
          ],
        ],
        "error": Array [
          Array [
            "some-error",
          ],
        ],
        "fatal": Array [],
        "info": Array [],
        "log": Array [],
        "trace": Array [],
        "warn": Array [
          Array [
            "some-warning",
          ],
        ],
      }
    `);
  });

  test('custom logger', () => {
    const customLogger = jest.fn();

    const parsedConfig = parseOpenSearchClientConfig(
      {
        apiVersion: 'main',
        customHeaders: { xsrf: 'something' },
        logQueries: true,
        sniffOnStart: false,
        sniffOnConnectionFault: false,
        hosts: ['http://localhost/opensearch'],
        requestHeadersWhitelist: [],
        log: customLogger,
      },
      logger.get()
    );

    expect(parsedConfig.log).toBe(customLogger);
  });
});

describe('#ssl', () => {
  test('#verificationMode = none', () => {
    expect(
      parseOpenSearchClientConfig(
        {
          apiVersion: 'v7.0.0',
          customHeaders: {},
          logQueries: true,
          sniffOnStart: true,
          sniffOnConnectionFault: true,
          hosts: ['https://opensearch.local'],
          requestHeadersWhitelist: [],
          ssl: { verificationMode: 'none' },
        },
        logger.get()
      )
    ).toMatchInlineSnapshot(`
      Object {
        "apiVersion": "v7.0.0",
        "hosts": Array [
          Object {
            "headers": Object {
              "x-opensearch-product-origin": "opensearch-dashboards",
            },
            "host": "opensearch.local",
            "path": "/",
            "port": "443",
            "protocol": "https:",
            "query": null,
          },
        ],
        "keepAlive": true,
        "log": [Function],
        "sniffOnConnectionFault": true,
        "sniffOnStart": true,
        "ssl": Object {
          "ca": undefined,
          "rejectUnauthorized": false,
        },
      }
    `);
  });

  test('#verificationMode = certificate', () => {
    const clientConfig = parseOpenSearchClientConfig(
      {
        apiVersion: 'v7.0.0',
        customHeaders: {},
        logQueries: true,
        sniffOnStart: true,
        sniffOnConnectionFault: true,
        hosts: ['https://opensearch.local'],
        requestHeadersWhitelist: [],
        ssl: { verificationMode: 'certificate' },
      },
      logger.get()
    );

    // `checkServerIdentity` shouldn't check hostname when verificationMode is certificate.
    expect(
      clientConfig.ssl!.checkServerIdentity!('right.com', { subject: { CN: 'wrong.com' } } as any)
    ).toBeUndefined();

    expect(clientConfig).toMatchInlineSnapshot(`
      Object {
        "apiVersion": "v7.0.0",
        "hosts": Array [
          Object {
            "headers": Object {
              "x-opensearch-product-origin": "opensearch-dashboards",
            },
            "host": "opensearch.local",
            "path": "/",
            "port": "443",
            "protocol": "https:",
            "query": null,
          },
        ],
        "keepAlive": true,
        "log": [Function],
        "sniffOnConnectionFault": true,
        "sniffOnStart": true,
        "ssl": Object {
          "ca": undefined,
          "checkServerIdentity": [Function],
          "rejectUnauthorized": true,
        },
      }
    `);
  });

  test('#verificationMode = full', () => {
    expect(
      parseOpenSearchClientConfig(
        {
          apiVersion: 'v7.0.0',
          customHeaders: {},
          logQueries: true,
          sniffOnStart: true,
          sniffOnConnectionFault: true,
          hosts: ['https://opensearch.local'],
          requestHeadersWhitelist: [],
          ssl: { verificationMode: 'full' },
        },
        logger.get()
      )
    ).toMatchInlineSnapshot(`
      Object {
        "apiVersion": "v7.0.0",
        "hosts": Array [
          Object {
            "headers": Object {
              "x-opensearch-product-origin": "opensearch-dashboards",
            },
            "host": "opensearch.local",
            "path": "/",
            "port": "443",
            "protocol": "https:",
            "query": null,
          },
        ],
        "keepAlive": true,
        "log": [Function],
        "sniffOnConnectionFault": true,
        "sniffOnStart": true,
        "ssl": Object {
          "ca": undefined,
          "rejectUnauthorized": true,
        },
      }
    `);
  });

  test('#verificationMode is unknown', () => {
    expect(() =>
      parseOpenSearchClientConfig(
        {
          apiVersion: 'v7.0.0',
          customHeaders: {},
          logQueries: true,
          sniffOnStart: true,
          sniffOnConnectionFault: true,
          hosts: ['https://opensearch.local'],
          requestHeadersWhitelist: [],
          ssl: { verificationMode: 'misspelled' as any },
        },
        logger.get()
      )
    ).toThrowErrorMatchingInlineSnapshot(`"Unknown ssl verificationMode: misspelled"`);
  });

  test('#ignoreCertAndKey = true', () => {
    expect(
      parseOpenSearchClientConfig(
        {
          apiVersion: 'v7.0.0',
          customHeaders: {},
          logQueries: true,
          sniffOnStart: true,
          sniffOnConnectionFault: true,
          hosts: ['https://opensearch.local'],
          requestHeadersWhitelist: [],
          ssl: {
            verificationMode: 'certificate',
            certificateAuthorities: ['content-of-ca-path'],
            certificate: 'content-of-certificate-path',
            key: 'content-of-key-path',
            keyPassphrase: 'key-pass',
            alwaysPresentCertificate: true,
          },
        },
        logger.get(),
        { ignoreCertAndKey: true }
      )
    ).toMatchInlineSnapshot(`
      Object {
        "apiVersion": "v7.0.0",
        "hosts": Array [
          Object {
            "headers": Object {
              "x-opensearch-product-origin": "opensearch-dashboards",
            },
            "host": "opensearch.local",
            "path": "/",
            "port": "443",
            "protocol": "https:",
            "query": null,
          },
        ],
        "keepAlive": true,
        "log": [Function],
        "sniffOnConnectionFault": true,
        "sniffOnStart": true,
        "ssl": Object {
          "ca": Array [
            "content-of-ca-path",
          ],
          "checkServerIdentity": [Function],
          "rejectUnauthorized": true,
        },
      }
    `);
  });
});
