/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConfigOptions } from 'elasticsearch';
import { DataSourcePluginConfigType } from '../../config';

/**
 * Parse the client options from given data source config and endpoint
 *
 * @param config The config to generate the client options from.
 * @param endpoint endpoint url of data source
 */
export function parseClientOptions(
  // TODO: will use client configs, that comes from a merge result of user config and default legacy client config,
  config: DataSourcePluginConfigType,
  endpoint: string
): ConfigOptions {
  const configOptions: ConfigOptions = {
    host: endpoint,
    ssl: {
      rejectUnauthorized: true,
    },
  };

  return configOptions;
}
