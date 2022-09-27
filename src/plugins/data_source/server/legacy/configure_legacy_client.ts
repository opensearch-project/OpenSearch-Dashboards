/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client } from 'elasticsearch';
import { get } from 'lodash';
import {
  Headers,
  LegacyAPICaller,
  LegacyCallAPIOptions,
  LegacyOpenSearchErrorHelpers,
  Logger,
  SavedObject,
} from '../../../../../src/core/server';
import {
  AuthType,
  DataSourceAttributes,
  UsernamePasswordTypedContent,
} from '../../common/data_sources';
import { DataSourcePluginConfigType } from '../../config';
import { CryptographyClient } from '../cryptography';
import { DataSourceClientParams, LegacyClientCallAPIParams } from '../types';
import { OpenSearchClientPoolSetup, getCredential, getDataSource } from '../client';
import { parseClientOptions } from './client_config';
import { DataSourceConfigError } from '../lib/error';

export const configureLegacyClient = async (
  { dataSourceId, savedObjects, cryptographyClient }: DataSourceClientParams,
  callApiParams: LegacyClientCallAPIParams,
  openSearchClientPoolSetup: OpenSearchClientPoolSetup,
  config: DataSourcePluginConfigType,
  logger: Logger
) => {
  try {
    const dataSource = await getDataSource(dataSourceId, savedObjects);
    const rootClient = getRootClient(dataSource.attributes, config, openSearchClientPoolSetup);

    return await getQueryClient(rootClient, dataSource, cryptographyClient, callApiParams);
  } catch (error: any) {
    logger.error(`Fail to get data source client for dataSourceId: [${dataSourceId}]`);
    logger.error(error);
    // Re-throw as DataSourceConfigError
    throw new DataSourceConfigError('Fail to get data source client: ', error);
  }
};

/**
 * Create a child client object with given auth info.
 *
 * @param rootClient root client for the connection with given data source endpoint.
 * @param dataSource data source saved object
 * @param cryptographyClient cryptography client for password encryption / decryption
 * @returns child client.
 */
const getQueryClient = async (
  rootClient: Client,
  dataSource: SavedObject<DataSourceAttributes>,
  cryptographyClient: CryptographyClient,
  callApiParams: LegacyClientCallAPIParams
) => {
  if (AuthType.NoAuth === dataSource.attributes.auth.type) {
    return legacyClientWrapper(rootClient, callApiParams);
  } else {
    const credential = await getCredential(dataSource, cryptographyClient);
    return legacyClientWrapper(rootClient, callApiParams, credential);
  }
};

/**
 * Gets a root client object of the OpenSearch endpoint.
 * Will attempt to get from cache, if cache miss, create a new one and load into cache.
 *
 * @param dataSourceAttr data source saved objects attributes.
 * @param config data source config
 * @returns OpenSearch client for the given data source endpoint.
 */
const getRootClient = (
  dataSourceAttr: DataSourceAttributes,
  config: DataSourcePluginConfigType,
  { getClientFromPool, addClientToPool }: OpenSearchClientPoolSetup
): Client => {
  const endpoint = dataSourceAttr.endpoint;
  const cachedClient = getClientFromPool(endpoint);
  if (cachedClient) {
    return cachedClient as Client;
  } else {
    const configOptions = parseClientOptions(config, endpoint);
    const client = new Client(configOptions);
    addClientToPool(endpoint, client);

    return client;
  }
};

/**
 * Calls the OpenSearch API endpoint with the specified parameters.
 * @param client Raw OpenSearch JS client instance to use.
 * @param endpoint Name of the API endpoint to call.
 * @param clientParams Parameters that will be directly passed to the
 * OpenSearch JS client.
 * @param options Options that affect the way we call the API and process the result.
 * make wrap401Errors default to false, because we don't want browser login pop-up
 */
const callAPI = async (
  client: Client,
  endpoint: string,
  clientParams: Record<string, any> = {},
  options: LegacyCallAPIOptions = { wrap401Errors: false }
) => {
  const clientPath = endpoint.split('.');
  const api: any = get(client, clientPath);
  if (!api) {
    throw new Error(`called with an invalid endpoint: ${endpoint}`);
  }

  const apiContext = clientPath.length === 1 ? client : get(client, clientPath.slice(0, -1));
  try {
    return await new Promise((resolve, reject) => {
      const request = api.call(apiContext, clientParams);
      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          request.abort();
          reject(new Error('Request was aborted'));
        });
      }
      return request.then(resolve, reject);
    });
  } catch (err) {
    if (!options.wrap401Errors || err.statusCode !== 401) {
      throw err;
    }

    throw LegacyOpenSearchErrorHelpers.decorateNotAuthorizedError(err);
  }
};

/**
 * Wrapper to expose API that allow calling the OpenSearch API endpoint with the specified
 * parameters, using legacy client.
 *
 * @param client Raw OpenSearch JS client instance to use.
 * @param endpoint - String descriptor of the endpoint e.g. `cluster.getSettings` or `ping`.
 * @param clientParams - A dictionary of parameters that will be passed directly to the OpenSearch JS client.
 * @param options - Options that affect the way we call the API and process the result.
 * @param credential - Decrypted credential content
 */
const legacyClientWrapper = async (
  rootClient: Client,
  { endpoint, clientParams = {}, options }: LegacyClientCallAPIParams,
  credential?: UsernamePasswordTypedContent
) => {
  if (credential) {
    const headers: Headers = {
      authorization:
        'Basic ' + Buffer.from(`${credential.username}:${credential.password}`).toString('base64'),
    };
    clientParams.headers = Object.assign({}, clientParams.headers, headers);
  }

  return await (callAPI.bind(null, rootClient) as LegacyAPICaller)(endpoint, clientParams, options);
};
