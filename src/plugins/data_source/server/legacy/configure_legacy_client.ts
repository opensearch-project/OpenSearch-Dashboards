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
import { CryptographyServiceSetup } from '../cryptography_service';
import { DataSourceClientParams, LegacyClientCallAPIParams } from '../types';
import { OpenSearchClientPoolSetup, getCredential, getDataSource } from '../client';
import { parseClientOptions } from './client_config';
import { createDataSourceError, DataSourceError } from '../lib/error';

export const configureLegacyClient = async (
  { dataSourceId, savedObjects, cryptography }: DataSourceClientParams,
  callApiParams: LegacyClientCallAPIParams,
  openSearchClientPoolSetup: OpenSearchClientPoolSetup,
  config: DataSourcePluginConfigType,
  logger: Logger
) => {
  try {
    const dataSource = await getDataSource(dataSourceId, savedObjects);
    const rootClient = getRootClient(dataSource.attributes, config, openSearchClientPoolSetup);

    return await getQueryClient(rootClient, dataSource, cryptography, callApiParams);
  } catch (error: any) {
    logger.error(`Failed to get data source client for dataSourceId: [${dataSourceId}]`);
    logger.error(error);
    // Re-throw as DataSourceError
    throw createDataSourceError(error);
  }
};

/**
 * With given auth info, wrap the rootClient and return
 *
 * @param rootClient root client for the connection with given data source endpoint.
 * @param dataSource data source saved object
 * @param cryptography cryptography service for password encryption / decryption
 * @returns child client.
 */
const getQueryClient = async (
  rootClient: Client,
  dataSource: SavedObject<DataSourceAttributes>,
  cryptography: CryptographyServiceSetup,
  { endpoint, clientParams, options }: LegacyClientCallAPIParams
) => {
  const authType = dataSource.attributes.auth.type;

  switch (authType) {
    case AuthType.NoAuth:
      return await (callAPI.bind(null, rootClient) as LegacyAPICaller)(
        endpoint,
        clientParams,
        options
      );
    case AuthType.UsernamePasswordType:
      const credential = await getCredential(dataSource, cryptography);
      return getBasicAuthClient(rootClient, { endpoint, clientParams, options }, credential);

    default:
      throw Error(`${authType} is not a supported auth type for data source`);
  }
};

/**
 * Gets a root client object of the OpenSearch endpoint.
 * Will attempt to get from cache, if cache miss, create a new one and load into cache.
 *
 * @param dataSourceAttr data source saved objects attributes.
 * @param config data source config
 * @returns Legacy client for the given data source endpoint.
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
 * @param client Raw legacy JS client instance to use.
 * @param endpoint Name of the API endpoint to call.
 * @param clientParams Parameters that will be directly passed to the
 * legacy JS client.
 * @param options Options that affect the way we call the API and process the result.
 * make wrap401Errors default to false, because we don't want login pop-up from browser
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
 * Get a legacy client that configured with basic auth
 *
 * @param rootClient Raw legacy client instance to use.
 * @param endpoint - String descriptor of the endpoint e.g. `cluster.getSettings` or `ping`.
 * @param clientParams - A dictionary of parameters that will be passed directly to the legacy JS client.
 * @param options - Options that affect the way we call the API and process the result.
 */
const getBasicAuthClient = async (
  rootClient: Client,
  { endpoint, clientParams = {}, options }: LegacyClientCallAPIParams,
  { username, password }: UsernamePasswordTypedContent
) => {
  const headers: Headers = {
    authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
  };
  clientParams.headers = Object.assign({}, clientParams.headers, headers);

  return await (callAPI.bind(null, rootClient) as LegacyAPICaller)(endpoint, clientParams, options);
};
