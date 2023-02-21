/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClientOptions } from '@opensearch-project/opensearch-next';
import { DataSourcePluginConfigType } from '../../config';

/**
 * Parse the client options from given data source config and endpoint
 *
 * @param config The config to generate the client options from.
 * @param endpoint endpoint url of data source
 */
export function parseClientOptions(
  // TODO: will use client configs, that comes from a merge result of user config and default opensearch client config,
  config: DataSourcePluginConfigType,
  endpoint: string
): ClientOptions {
  const clientOptions: ClientOptions = {
    node: endpoint,
    ssl: {
      requestCert: true,
      rejectUnauthorized: true,
    },
  };

  return clientOptions;
}
