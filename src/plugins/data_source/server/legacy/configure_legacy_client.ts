/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client } from '@opensearch-project/opensearch-next';
import { Client as LegacyClient, ConfigOptions } from 'elasticsearch';
import { Credentials, Config } from 'aws-sdk';
import { get } from 'lodash';
import HttpAmazonESConnector from 'http-aws-es';
import {
  Headers,
  LegacyAPICaller,
  LegacyCallAPIOptions,
  LegacyOpenSearchErrorHelpers,
  Logger,
} from '../../../../../src/core/server';
import {
  AuthType,
  DataSourceAttributes,
  SigV4Content,
  UsernamePasswordTypedContent,
} from '../../common/data_sources';
import { DataSourcePluginConfigType } from '../../config';
import { CryptographyServiceSetup } from '../cryptography_service';
import { DataSourceClientParams, LegacyClientCallAPIParams } from '../types';
import { OpenSearchClientPoolSetup } from '../client';
import { parseClientOptions } from './client_config';
import { createDataSourceError } from '../lib/error';
import {
  getRootClient,
  getAWSCredential,
  getCredential,
  getDataSource,
  generateCacheKey,
} from '../client/configure_client_utils';

export const configureLegacyClient = async (
  { dataSourceId, savedObjects, cryptography }: DataSourceClientParams,
  callApiParams: LegacyClientCallAPIParams,
  openSearchClientPoolSetup: OpenSearchClientPoolSetup,
  config: DataSourcePluginConfigType,
  logger: Logger
) => {
  try {
    const dataSourceAttr = await getDataSource(dataSourceId!, savedObjects);
    const rootClient = getRootClient(
      dataSourceAttr,
      openSearchClientPoolSetup.getClientFromPool,
      dataSourceId
    ) as LegacyClient;

    return await getQueryClient(
      dataSourceAttr,
      cryptography,
      callApiParams,
      openSearchClientPoolSetup.addClientToPool,
      config,
      rootClient,
      dataSourceId
    );
  } catch (error: any) {
    logger.debug(
      `Failed to get data source client for dataSourceId: [${dataSourceId}]. ${error}: ${error.stack}`
    );
    // Re-throw as DataSourceError
    throw createDataSourceError(error);
  }
};

/**
 * With given auth info, wrap the rootClient and return
 *
 * @param rootClient root client for the connection with given data source endpoint.
 * @param dataSourceAttr data source saved object attributes
 * @param cryptography cryptography service for password encryption / decryption
 * @param config data source config
 * @param addClientToPool function to add client to client pool
 * @param dataSourceId id of data source saved Object
 * @returns child client.
 */
const getQueryClient = async (
  dataSourceAttr: DataSourceAttributes,
  cryptography: CryptographyServiceSetup,
  { endpoint, clientParams, options }: LegacyClientCallAPIParams,
  addClientToPool: (endpoint: string, authType: AuthType, client: Client | LegacyClient) => void,
  config: DataSourcePluginConfigType,
  rootClient?: LegacyClient,
  dataSourceId?: string
) => {
  const {
    auth: { type },
    endpoint: nodeUrl,
  } = dataSourceAttr;
  const clientOptions = parseClientOptions(config, nodeUrl);
  const cacheKey = generateCacheKey(dataSourceAttr, dataSourceId);

  switch (type) {
    case AuthType.NoAuth:
      if (!rootClient) rootClient = new LegacyClient(clientOptions);
      addClientToPool(cacheKey, type, rootClient);

      return await (callAPI.bind(null, rootClient) as LegacyAPICaller)(
        endpoint,
        clientParams,
        options
      );

    case AuthType.UsernamePasswordType:
      const credential = await getCredential(dataSourceAttr, cryptography);

      if (!rootClient) rootClient = new LegacyClient(clientOptions);
      addClientToPool(cacheKey, type, rootClient);

      return getBasicAuthClient(rootClient, { endpoint, clientParams, options }, credential);

    case AuthType.SigV4:
      const awsCredential = await getAWSCredential(dataSourceAttr, cryptography);

      const awsClient = rootClient ? rootClient : getAWSClient(awsCredential, clientOptions);
      addClientToPool(cacheKey, type, awsClient);

      return await (callAPI.bind(null, awsClient) as LegacyAPICaller)(
        endpoint,
        clientParams,
        options
      );

    default:
      throw Error(`${type} is not a supported auth type for data source`);
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
  client: LegacyClient,
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
  rootClient: LegacyClient,
  { endpoint, clientParams = {}, options }: LegacyClientCallAPIParams,
  { username, password }: UsernamePasswordTypedContent
) => {
  const headers: Headers = {
    authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
  };
  clientParams.headers = Object.assign({}, clientParams.headers, headers);

  return await (callAPI.bind(null, rootClient) as LegacyAPICaller)(endpoint, clientParams, options);
};

const getAWSClient = (credential: SigV4Content, clientOptions: ConfigOptions): LegacyClient => {
  const { accessKey, secretKey, region, service } = credential;
  const client = new LegacyClient({
    connectionClass: HttpAmazonESConnector,
    awsConfig: new Config({
      region,
      credentials: new Credentials({ accessKeyId: accessKey, secretAccessKey: secretKey }),
    }),
    service,
    ...clientOptions,
  });
  return client;
};
