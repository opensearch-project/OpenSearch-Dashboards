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

import { ConfigOptions } from 'elasticsearch';
import { cloneDeep } from 'lodash';
import { Duration } from 'moment';
import { checkServerIdentity } from 'tls';
import url from 'url';
import { pick } from '@osd/std';
import { Logger } from '../../logging';
import { OpenSearchConfig } from '../opensearch_config';
import { DEFAULT_HEADERS } from '../default_headers';

/**
 * @privateRemarks Config that consumers can pass to the OpenSearch JS client is complex and includes
 * not only entries from standard `opensearch.*` yaml config, but also some OpenSearch JS
 * client specific options like `keepAlive` or `plugins` (that eventually will be deprecated).
 *
 * @deprecated
 * @public
 */
export type LegacyOpenSearchClientConfig = Pick<ConfigOptions, 'keepAlive' | 'log' | 'plugins'> &
  Pick<
    OpenSearchConfig,
    | 'apiVersion'
    | 'customHeaders'
    | 'logQueries'
    | 'requestHeadersWhitelist'
    | 'sniffOnStart'
    | 'sniffOnConnectionFault'
    | 'hosts'
    | 'username'
    | 'password'
  > & {
    pingTimeout?: OpenSearchConfig['pingTimeout'] | ConfigOptions['pingTimeout'];
    requestTimeout?: OpenSearchConfig['requestTimeout'] | ConfigOptions['requestTimeout'];
    sniffInterval?: OpenSearchConfig['sniffInterval'] | ConfigOptions['sniffInterval'];
    ssl?: Partial<OpenSearchConfig['ssl']>;
  };

/** @internal */
interface LegacyOpenSearchClientConfigOverrides {
  /**
   * If set to `true`, username and password from the config won't be used
   * to access OpenSearch API even if these are specified.
   */
  auth?: boolean;

  /**
   * If set to `true`, `ssl.key` and `ssl.certificate` provided through config won't
   * be used to connect to OpenSearch.
   */
  ignoreCertAndKey?: boolean;
}

// Original `ConfigOptions` defines `ssl: object` so we need something more specific.
/** @internal */
type ExtendedConfigOptions = ConfigOptions &
  Partial<{
    ssl: Partial<{
      rejectUnauthorized: boolean;
      checkServerIdentity: typeof checkServerIdentity;
      ca: string[];
      cert: string;
      key: string;
      passphrase: string;
    }>;
  }>;

/** @internal */
export function parseOpenSearchClientConfig(
  config: LegacyOpenSearchClientConfig,
  log: Logger,
  { ignoreCertAndKey = false, auth = true }: LegacyOpenSearchClientConfigOverrides = {}
) {
  const opensearchClientConfig: ExtendedConfigOptions = {
    keepAlive: true,
    ...pick(config, [
      'apiVersion',
      'sniffOnStart',
      'sniffOnConnectionFault',
      'keepAlive',
      'log',
      'plugins',
    ]),
  };

  if (opensearchClientConfig.log == null) {
    opensearchClientConfig.log = getLoggerClass(log, config.logQueries);
  }

  if (config.pingTimeout != null) {
    opensearchClientConfig.pingTimeout = getDurationAsMs(config.pingTimeout);
  }

  if (config.requestTimeout != null) {
    opensearchClientConfig.requestTimeout = getDurationAsMs(config.requestTimeout);
  }

  if (config.sniffInterval) {
    opensearchClientConfig.sniffInterval = getDurationAsMs(config.sniffInterval);
  }

  if (Array.isArray(config.hosts)) {
    const needsAuth = auth !== false && config.username && config.password;
    opensearchClientConfig.hosts = config.hosts.map((nodeUrl: string) => {
      const uri = url.parse(nodeUrl);

      const httpsURI = uri.protocol === 'https:';
      const httpURI = uri.protocol === 'http:';

      const host: Record<string, unknown> = {
        host: uri.hostname,
        port: uri.port || (httpsURI && '443') || (httpURI && '80'),
        protocol: uri.protocol,
        path: uri.pathname,
        query: uri.query,
        headers: {
          ...DEFAULT_HEADERS,
          ...config.customHeaders,
        },
      };

      if (needsAuth) {
        host.auth = `${config.username}:${config.password}`;
      }

      return host;
    });
  }

  if (config.ssl === undefined) {
    return cloneDeep(opensearchClientConfig);
  }

  opensearchClientConfig.ssl = {};

  const verificationMode = config.ssl.verificationMode;
  switch (verificationMode) {
    case 'none':
      opensearchClientConfig.ssl.rejectUnauthorized = false;
      break;
    case 'certificate':
      opensearchClientConfig.ssl.rejectUnauthorized = true;

      // by default, NodeJS is checking the server identify
      opensearchClientConfig.ssl.checkServerIdentity = () => undefined;
      break;
    case 'full':
      opensearchClientConfig.ssl.rejectUnauthorized = true;
      break;
    default:
      throw new Error(`Unknown ssl verificationMode: ${verificationMode}`);
  }

  opensearchClientConfig.ssl.ca = config.ssl.certificateAuthorities;

  // Add client certificate and key if required by opensearch
  if (!ignoreCertAndKey && config.ssl.certificate && config.ssl.key) {
    opensearchClientConfig.ssl.cert = config.ssl.certificate;
    opensearchClientConfig.ssl.key = config.ssl.key;
    opensearchClientConfig.ssl.passphrase = config.ssl.keyPassphrase;
  }

  // OpenSearch JS client mutates config object, so all properties that are
  // usually passed by reference should be cloned to avoid any side effects.
  return cloneDeep(opensearchClientConfig);
}

function getDurationAsMs(duration: number | Duration) {
  if (typeof duration === 'number') {
    return duration;
  }

  return duration.asMilliseconds();
}

function getLoggerClass(log: Logger, logQueries = false) {
  return class OpenSearchClientLogging {
    public error(err: string | Error) {
      log.error(err);
    }

    public warning(message: string) {
      log.warn(message);
    }

    public trace(
      method: string,
      options: { path: string },
      query: string,
      _: unknown,
      statusCode: string
    ) {
      if (logQueries) {
        log.debug(`${statusCode}\n${method} ${options.path}\n${query ? query.trim() : ''}`, {
          tags: ['query'],
        });
      }
    }

    // elasticsearch-js expects the following functions to exist
    public info() {
      // noop
    }

    public debug() {
      // noop
    }

    public close() {
      // noop
    }
  };
}
