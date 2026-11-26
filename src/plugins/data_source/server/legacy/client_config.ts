/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConfigOptions } from 'elasticsearch';
import { checkServerIdentity } from 'tls';
import { DataSourcePluginConfigType } from '../../config';
import { readCertificateAuthorities } from '../util/tls_settings_provider';
import { createGuardedLookup } from '../util/endpoint_validator';

/** @internal */
type LegacyDataSourceSSLConfigOptions = Partial<{
  requestCert: boolean;
  rejectUnauthorized: boolean;
  checkServerIdentity: typeof checkServerIdentity;
  ca: string[];
}>;

/**
 * Parse the client options from given data source config and endpoint
 *
 * @param config The config to generate the client options from.
 * @param endpoint endpoint url of data source
 */
export function parseClientOptions(
  config: DataSourcePluginConfigType,
  endpoint: string,
  registeredSchema: any[]
): ConfigOptions {
  const sslConfig: LegacyDataSourceSSLConfigOptions = {
    rejectUnauthorized: true,
  };

  if (config.ssl) {
    const verificationMode = config.ssl.verificationMode;
    switch (verificationMode) {
      case 'none':
        sslConfig.rejectUnauthorized = false;
        break;
      case 'certificate':
        sslConfig.rejectUnauthorized = true;

        // by default, NodeJS is checking the server identify
        sslConfig.checkServerIdentity = () => undefined;
        break;
      case 'full':
        sslConfig.rejectUnauthorized = true;
        break;
      default:
        throw new Error(`Unknown ssl verificationMode: ${verificationMode}`);
    }

    const { certificateAuthorities } = readCertificateAuthorities(
      config.ssl?.certificateAuthorities
    );

    sslConfig.ca = certificateAuthorities;
  }

  // for now, we only use part of the default opensearch client configs, may onboard more in the future
  const configOptions: ConfigOptions = {
    host: endpoint,
    ssl: sslConfig,
    plugins: registeredSchema,
    requestTimeout: config.globalOpenSearchConfig.requestTimeout.asMilliseconds(),
    pingTimeout: config.globalOpenSearchConfig.pingTimeout.asMilliseconds(),
    suggestCompression: config.globalOpenSearchConfig.requestCompression,
  };

  if (config.endpointDeniedIPs?.length) {
    // Check every address the endpoint resolves to when connecting, not only when it was saved.
    const lookup = createGuardedLookup(
      config.endpointDeniedIPs,
      config.endpointAllowlistedSuffixes
    );
    // The legacy client has no agent option. It builds its own agent per connection, so set the
    // lookup on the agent it builds. The SigV4 connector sends through its own handler and reads
    // `guardedLookup` instead.
    Object.assign(configOptions, {
      guardedLookup: lookup,
      createNodeAgent: (connection: any, connectionConfig: any) => {
        const agent = connection.createAgent(connectionConfig);
        agent.options = { ...agent.options, lookup };
        return agent;
      },
    });
  }

  return configOptions;
}
