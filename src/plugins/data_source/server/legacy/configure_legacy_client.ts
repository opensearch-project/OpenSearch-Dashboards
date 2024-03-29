/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client } from '@opensearch-project/opensearch-next';
import { Client as LegacyClient, ConfigOptions } from 'elasticsearch';
import { Config } from 'aws-sdk';
import { get } from 'lodash';
import HttpAmazonESConnector from './http_aws_es/connector';
import {
  Headers,
  LegacyAPICaller,
  LegacyCallAPIOptions,
  LegacyOpenSearchErrorHelpers,
  Logger,
  OpenSearchDashboardsRequest,
} from '../../../../../src/core/server';
import {
  AuthType,
  DataSourceAttributes,
  SigV4Content,
  UsernamePasswordTypedContent,
  SigV4ServiceName,
} from '../../common/data_sources';
import { DataSourcePluginConfigType } from '../../config';
import { CryptographyServiceSetup } from '../cryptography_service';
import { DataSourceClientParams, LegacyClientCallAPIParams, ClientParameters } from '../types';
import { OpenSearchClientPoolSetup } from '../client';
import { parseClientOptions } from './client_config';
import { createDataSourceError } from '../lib/error';
import {
  getRootClient,
  getAWSCredential,
  getCredential,
  getDataSource,
  getAuthenticationMethod,
  generateCacheKey,
} from '../client/configure_client_utils';
import { authRegistryCredentialProvider } from '../util/credential_provider';

export const configureLegacyClient = async (
  {
    dataSourceId,
    savedObjects,
    cryptography,
    customApiSchemaRegistryPromise,
    request,
    authRegistry,
  }: DataSourceClientParams,
  callApiParams: LegacyClientCallAPIParams,
  openSearchClientPoolSetup: OpenSearchClientPoolSetup,
  config: DataSourcePluginConfigType,
  logger: Logger
) => {
  try {
    const dataSourceAttr = await getDataSource(dataSourceId!, savedObjects);
    let clientParams;

    const authenticationMethod = getAuthenticationMethod(dataSourceAttr, authRegistry);
    if (authenticationMethod !== undefined) {
      clientParams = await authRegistryCredentialProvider(authenticationMethod, {
        dataSourceAttr,
        request,
        cryptography,
      });
    }
    const rootClient = getRootClient(
      dataSourceAttr,
      openSearchClientPoolSetup.getClientFromPool,
      clientParams
    ) as LegacyClient;

    const registeredSchema = (await customApiSchemaRegistryPromise).getAll();

    return await getQueryClient(
      dataSourceAttr,
      cryptography,
      callApiParams,
      openSearchClientPoolSetup.addClientToPool,
      config,
      registeredSchema,
      rootClient,
      dataSourceId,
      request,
      clientParams
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
 * @param registeredSchema registered API schema
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
  registeredSchema: any[],
  rootClient?: LegacyClient,
  dataSourceId?: string,
  request?: OpenSearchDashboardsRequest,
  authClientParams?: ClientParameters
) => {
  let credential;
  let cacheKeySuffix;
  let {
    auth: { type },
    endpoint: nodeUrl,
  } = dataSourceAttr;
  const clientOptions = parseClientOptions(config, nodeUrl, registeredSchema);

  if (authClientParams !== undefined) {
    credential = authClientParams.credentials;
    type = authClientParams.authType;
    cacheKeySuffix = authClientParams.cacheKeySuffix;
    nodeUrl = authClientParams.endpoint;

    if (credential.service === undefined) {
      credential = { ...credential, service: dataSourceAttr.auth.credentials?.service };
    }
  }

  const cacheKey = generateCacheKey(nodeUrl, cacheKeySuffix);

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
      credential =
        (credential as UsernamePasswordTypedContent) ??
        (await getCredential(dataSourceAttr, cryptography));

      if (!rootClient) rootClient = new LegacyClient(clientOptions);
      addClientToPool(cacheKey, type, rootClient);

      return getBasicAuthClient(rootClient, { endpoint, clientParams, options }, credential);

    case AuthType.SigV4:
      credential =
        (credential as SigV4Content) ?? (await getAWSCredential(dataSourceAttr, cryptography));

      if (!rootClient) {
        rootClient = getAWSClient(credential, clientOptions);
      }
      addClientToPool(cacheKey, type, rootClient);

      return await getAWSChildClient(rootClient, { endpoint, clientParams, options }, credential);

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
  const { region } = credential;
  const client = new LegacyClient({
    connectionClass: HttpAmazonESConnector,
    awsConfig: new Config({
      region,
    }),
    ...clientOptions,
  });
  return client;
};

const getAWSChildClient = async (
  rootClient: LegacyClient,
  { endpoint, clientParams = {}, options }: LegacyClientCallAPIParams,
  credential: SigV4Content
): Promise<LegacyClient> => {
  const { accessKey, secretKey, region, service, sessionToken } = credential;
  const authHeaders = {
    auth: {
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
        sessionToken: sessionToken ?? '',
      },
      region,
      service: service ?? SigV4ServiceName.OpenSearch,
    },
  };
  clientParams.headers = Object.assign({}, clientParams.headers, authHeaders);
  return await (callAPI.bind(null, rootClient) as LegacyAPICaller)(endpoint, clientParams, options);
};
