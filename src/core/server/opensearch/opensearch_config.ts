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

import { schema, TypeOf } from '@osd/config-schema';
import { Duration } from 'moment';
import { readFileSync } from 'fs';
import { ConfigDeprecationProvider } from 'src/core/server';
import { readPkcs12Keystore, readPkcs12Truststore } from '../utils';
import { ServiceConfigDescriptor } from '../internal_types';

const hostURISchema = schema.uri({ scheme: ['http', 'https'] });

export const DEFAULT_API_VERSION = '7.x';

export type OpenSearchConfigType = TypeOf<typeof configSchema>;
type SslConfigSchema = OpenSearchConfigType['ssl'];

/**
 * Validation schema for opensearch service config. It can be reused when plugins allow users
 * to specify a local opensearch config.
 * @public
 */
export const configSchema = schema.object({
  sniffOnStart: schema.boolean({ defaultValue: false }),
  sniffInterval: schema.oneOf([schema.duration(), schema.literal(false)], {
    defaultValue: false,
  }),
  sniffOnConnectionFault: schema.boolean({ defaultValue: false }),
  hosts: schema.oneOf([hostURISchema, schema.arrayOf(hostURISchema)], {
    defaultValue: 'http://localhost:9200',
  }),
  username: schema.maybe(
    schema.conditional(
      schema.contextRef('dist'),
      false,
      schema.string({
        validate: (rawConfig) => {
          if (rawConfig === 'elastic') {
            return (
              'value of "elastic" is forbidden. This is a superuser account that can obfuscate ' +
              'privilege-related issues. You should use the "opensearch_dashboards_system" user instead.'
            );
          }
        },
      }),
      schema.string()
    )
  ),
  password: schema.maybe(schema.string()),
  requestHeadersWhitelist: schema.oneOf([schema.string(), schema.arrayOf(schema.string())], {
    defaultValue: ['authorization'],
  }),
  memoryCircuitBreaker: schema.object({
    enabled: schema.boolean({ defaultValue: false }),
    maxPercentage: schema.number({ defaultValue: 1.0 }),
  }),
  customHeaders: schema.recordOf(schema.string(), schema.string(), { defaultValue: {} }),
  shardTimeout: schema.duration({ defaultValue: '30s' }),
  requestTimeout: schema.duration({ defaultValue: '30s' }),
  pingTimeout: schema.duration({ defaultValue: schema.siblingRef('requestTimeout') }),
  logQueries: schema.boolean({ defaultValue: false }),
  optimizedHealthcheck: schema.maybe(
    schema.object({
      id: schema.string(),
      filters: schema.maybe(
        schema.recordOf(schema.string(), schema.string(), { defaultValue: {} })
      ),
    })
  ),
  ssl: schema.object(
    {
      verificationMode: schema.oneOf(
        [schema.literal('none'), schema.literal('certificate'), schema.literal('full')],
        { defaultValue: 'full' }
      ),
      certificateAuthorities: schema.maybe(
        schema.oneOf([schema.string(), schema.arrayOf(schema.string(), { minSize: 1 })])
      ),
      certificate: schema.maybe(schema.string()),
      key: schema.maybe(schema.string()),
      keyPassphrase: schema.maybe(schema.string()),
      keystore: schema.object({
        path: schema.maybe(schema.string()),
        password: schema.maybe(schema.string()),
      }),
      truststore: schema.object({
        path: schema.maybe(schema.string()),
        password: schema.maybe(schema.string()),
      }),
      alwaysPresentCertificate: schema.boolean({ defaultValue: false }),
    },
    {
      validate: (rawConfig) => {
        if (rawConfig.key && rawConfig.keystore.path) {
          return 'cannot use [key] when [keystore.path] is specified';
        }
        if (rawConfig.certificate && rawConfig.keystore.path) {
          return 'cannot use [certificate] when [keystore.path] is specified';
        }
      },
    }
  ),
  apiVersion: schema.string({ defaultValue: DEFAULT_API_VERSION }),
  healthCheck: schema.object({ delay: schema.duration({ defaultValue: 2500 }) }),
  ignoreVersionMismatch: schema.conditional(
    schema.contextRef('dev'),
    false,
    schema.boolean({
      validate: (rawValue) => {
        if (rawValue === true) {
          return '"ignoreVersionMismatch" can only be set to true in development mode';
        }
      },
      defaultValue: false,
    }),
    schema.boolean({ defaultValue: false })
  ),
  disablePrototypePoisoningProtection: schema.maybe(schema.boolean({ defaultValue: false })),
});

const deprecations: ConfigDeprecationProvider = ({ renameFromRoot, renameFromRootWithoutMap }) => [
  renameFromRoot('elasticsearch.sniffOnStart', 'opensearch.sniffOnStart'),
  renameFromRoot('elasticsearch.sniffInterval', 'opensearch.sniffInterval'),
  renameFromRoot('elasticsearch.sniffOnConnectionFault', 'opensearch.sniffOnConnectionFault'),
  renameFromRoot('elasticsearch.hosts', 'opensearch.hosts'),
  renameFromRoot('elasticsearch.username', 'opensearch.username'),
  renameFromRoot('elasticsearch.password', 'opensearch.password'),
  renameFromRoot('elasticsearch.requestHeadersWhitelist', 'opensearch.requestHeadersWhitelist'),
  renameFromRootWithoutMap(
    'opensearch.requestHeadersWhitelist',
    'opensearch.requestHeadersAllowlist'
  ),
  renameFromRootWithoutMap(
    'opensearch.requestHeadersWhitelistConfigured',
    'opensearch.requestHeadersAllowlistConfigured'
  ),
  renameFromRoot('elasticsearch.customHeaders', 'opensearch.customHeaders'),
  renameFromRoot('elasticsearch.shardTimeout', 'opensearch.shardTimeout'),
  renameFromRoot('elasticsearch.requestTimeout', 'opensearch.requestTimeout'),
  renameFromRoot('elasticsearch.pingTimeout', 'opensearch.pingTimeout'),
  renameFromRoot('elasticsearch.logQueries', 'opensearch.logQueries'),
  renameFromRoot('elasticsearch.optimizedHealthcheckId', 'opensearch.optimizedHealthcheck.id'),
  renameFromRoot('opensearch.optimizedHealthcheckId', 'opensearch.optimizedHealthcheck.id'),
  renameFromRoot('elasticsearch.ssl', 'opensearch.ssl'),
  renameFromRoot('elasticsearch.apiVersion', 'opensearch.apiVersion'),
  renameFromRoot('elasticsearch.healthCheck', 'opensearch.healthCheck'),
  renameFromRoot('elasticsearch.ignoreVersionMismatch', 'opensearch.ignoreVersionMismatch'),
  (settings, fromPath, log) => {
    const opensearch = settings[fromPath];
    if (!opensearch) {
      return settings;
    }
    if (opensearch.username === 'elastic') {
      log(
        `Setting [${fromPath}.username] to "elastic" is deprecated. You should use the "opensearch_dashboards_system" user instead.`
      );
    } else if (opensearch.username === 'opensearchDashboards') {
      log(
        `Setting [${fromPath}.username] to "opensearchDashboards" is deprecated. You should use the "opensearch_dashboards_system" user instead.`
      );
    }
    if (opensearch.ssl?.key !== undefined && opensearch.ssl?.certificate === undefined) {
      log(
        `Setting [${fromPath}.ssl.key] without [${fromPath}.ssl.certificate] is deprecated. This has no effect, you should use both settings to enable TLS client authentication to OpenSearch.`
      );
    } else if (opensearch.ssl?.certificate !== undefined && opensearch.ssl?.key === undefined) {
      log(
        `Setting [${fromPath}.ssl.certificate] without [${fromPath}.ssl.key] is deprecated. This has no effect, you should use both settings to enable TLS client authentication to OpenSearch.`
      );
    }
    return settings;
  },
];

export const config: ServiceConfigDescriptor<OpenSearchConfigType> = {
  path: 'opensearch',
  schema: configSchema,
  deprecations,
};

/**
 * Wrapper of config schema.
 * @public
 */
export class OpenSearchConfig {
  /**
   * The interval between health check requests OpenSearch Dashboards sends to the OpenSearch.
   */
  public readonly healthCheckDelay: Duration;

  /**
   * Whether to allow opensearch-dashboards to connect to a non-compatible opensearch node.
   */
  public readonly ignoreVersionMismatch: boolean;

  /**
   * Version of the OpenSearch (1.1, 2.1 or `main`) client will be connecting to.
   */
  public readonly apiVersion: string;

  /**
   * Specifies whether all queries to the client should be logged (status code,
   * method, query etc.).
   */
  public readonly logQueries: boolean;

  /**
   * Specifies whether Dashboards should only query the local OpenSearch node when
   * all nodes in the cluster have the same node attribute value
   */
  public readonly optimizedHealthcheck?: OpenSearchConfigType['optimizedHealthcheck'];

  /**
   * Hosts that the client will connect to. If sniffing is enabled, this list will
   * be used as seeds to discover the rest of your cluster.
   */
  public readonly hosts: string[];

  /**
   * List of OpenSearch Dashboards client-side headers to send to OpenSearch when request
   * scoped cluster client is used. If this is an empty array then *no* client-side
   * will be sent.
   */
  public readonly requestHeadersWhitelist: string[];

  /**
   * Timeout after which PING HTTP request will be aborted and retried.
   */
  public readonly pingTimeout: Duration;

  /**
   * Timeout after which HTTP request will be aborted and retried.
   */
  public readonly requestTimeout: Duration;

  /**
   * Timeout for OpenSearch to wait for responses from shards. Set to 0 to disable.
   */
  public readonly shardTimeout: Duration;

  /**
   * Set of options to configure memory circuit breaker for query response.
   * The `maxPercentage` field is to determine the threshold for maximum heap size for memory circuit breaker. By default the value is `1.0`.
   * The `enabled` field specifies whether the client should protect large response that can't fit into memory.
   */
  public readonly memoryCircuitBreaker: OpenSearchConfigType['memoryCircuitBreaker'];

  /**
   * Specifies whether the client should attempt to detect the rest of the cluster
   * when it is first instantiated.
   */
  public readonly sniffOnStart: boolean;

  /**
   * Interval to perform a sniff operation and make sure the list of nodes is complete.
   * If `false` then sniffing is disabled.
   */
  public readonly sniffInterval: false | Duration;

  /**
   * Specifies whether the client should immediately sniff for a more current list
   * of nodes when a connection dies.
   */
  public readonly sniffOnConnectionFault: boolean;

  /**
   * If OpenSearch is protected with basic authentication, this setting provides
   * the username that the OpenSearch Dashboards server uses to perform its administrative functions.
   */
  public readonly username?: string;

  /**
   * If OpenSearch is protected with basic authentication, this setting provides
   * the password that the OpenSearch Dashboards server uses to perform its administrative functions.
   */
  public readonly password?: string;

  /**
   * Set of settings configure SSL connection between OpenSearch Dashboards and OpenSearch that
   * are required when `xpack.ssl.verification_mode` in OpenSearch is set to
   * either `certificate` or `full`.
   */
  public readonly ssl: Pick<
    SslConfigSchema,
    Exclude<keyof SslConfigSchema, 'certificateAuthorities' | 'keystore' | 'truststore'>
  > & { certificateAuthorities?: string[] };

  /**
   * Header names and values to send to OpenSearch with every request. These
   * headers cannot be overwritten by client-side headers and aren't affected by
   * `requestHeadersWhitelist` configuration.
   */
  public readonly customHeaders: OpenSearchConfigType['customHeaders'];

  /**
   * Specifies whether the client should attempt to protect against reserved words
   * or not.
   */
  public readonly disablePrototypePoisoningProtection?: boolean;

  constructor(rawConfig: OpenSearchConfigType) {
    this.ignoreVersionMismatch = rawConfig.ignoreVersionMismatch;
    this.apiVersion = rawConfig.apiVersion;
    this.logQueries = rawConfig.logQueries;
    this.optimizedHealthcheck = rawConfig.optimizedHealthcheck;
    this.hosts = Array.isArray(rawConfig.hosts) ? rawConfig.hosts : [rawConfig.hosts];
    this.requestHeadersWhitelist = Array.isArray(rawConfig.requestHeadersWhitelist)
      ? rawConfig.requestHeadersWhitelist
      : [rawConfig.requestHeadersWhitelist];
    this.memoryCircuitBreaker = rawConfig.memoryCircuitBreaker;
    this.pingTimeout = rawConfig.pingTimeout;
    this.requestTimeout = rawConfig.requestTimeout;
    this.shardTimeout = rawConfig.shardTimeout;
    this.sniffOnStart = rawConfig.sniffOnStart;
    this.sniffOnConnectionFault = rawConfig.sniffOnConnectionFault;
    this.sniffInterval = rawConfig.sniffInterval;
    this.healthCheckDelay = rawConfig.healthCheck.delay;
    this.username = rawConfig.username;
    this.password = rawConfig.password;
    this.customHeaders = rawConfig.customHeaders;
    this.disablePrototypePoisoningProtection = rawConfig.disablePrototypePoisoningProtection;

    const { alwaysPresentCertificate, verificationMode } = rawConfig.ssl;
    const { key, keyPassphrase, certificate, certificateAuthorities } = readKeyAndCerts(rawConfig);

    this.ssl = {
      alwaysPresentCertificate,
      key,
      keyPassphrase,
      certificate,
      certificateAuthorities,
      verificationMode,
    };
  }
}

const readKeyAndCerts = (rawConfig: OpenSearchConfigType) => {
  let key: string | undefined;
  let keyPassphrase: string | undefined;
  let certificate: string | undefined;
  let certificateAuthorities: string[] | undefined;

  const addCAs = (ca: string[] | undefined) => {
    if (ca && ca.length) {
      certificateAuthorities = [...(certificateAuthorities || []), ...ca];
    }
  };

  if (rawConfig.ssl.keystore?.path) {
    const keystore = readPkcs12Keystore(
      rawConfig.ssl.keystore.path,
      rawConfig.ssl.keystore.password
    );
    if (!keystore.key) {
      throw new Error(`Did not find key in OpenSearch keystore.`);
    } else if (!keystore.cert) {
      throw new Error(`Did not find certificate in OpenSearch keystore.`);
    }
    key = keystore.key;
    certificate = keystore.cert;
    addCAs(keystore.ca);
  } else {
    if (rawConfig.ssl.key) {
      key = readFile(rawConfig.ssl.key);
      keyPassphrase = rawConfig.ssl.keyPassphrase;
    }
    if (rawConfig.ssl.certificate) {
      certificate = readFile(rawConfig.ssl.certificate);
    }
  }

  if (rawConfig.ssl.truststore?.path) {
    const ca = readPkcs12Truststore(
      rawConfig.ssl.truststore.path,
      rawConfig.ssl.truststore.password
    );
    addCAs(ca);
  }

  const ca = rawConfig.ssl.certificateAuthorities;
  if (ca) {
    const parsed: string[] = [];
    const paths = Array.isArray(ca) ? ca : [ca];
    if (paths.length > 0) {
      for (const path of paths) {
        parsed.push(readFile(path));
      }
      addCAs(parsed);
    }
  }

  return {
    key,
    keyPassphrase,
    certificate,
    certificateAuthorities,
  };
};

const readFile = (file: string) => {
  return readFileSync(file, 'utf8');
};
