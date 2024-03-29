/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, ClientOptions } from '@opensearch-project/opensearch-next';
import { Client as LegacyClient } from 'elasticsearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch-next/aws';
import { Logger, OpenSearchDashboardsRequest } from '../../../../../src/core/server';
import {
  AuthType,
  DataSourceAttributes,
  SigV4Content,
  SigV4ServiceName,
  UsernamePasswordTypedContent,
} from '../../common/data_sources';
import { DataSourcePluginConfigType } from '../../config';
import { CryptographyServiceSetup } from '../cryptography_service';
import { createDataSourceError } from '../lib/error';
import { DataSourceClientParams, ClientParameters } from '../types';
import { parseClientOptions } from './client_config';
import { OpenSearchClientPoolSetup } from './client_pool';
import {
  getRootClient,
  getAWSCredential,
  getCredential,
  getDataSource,
  getAuthenticationMethod,
  generateCacheKey,
} from './configure_client_utils';
import { authRegistryCredentialProvider } from '../util/credential_provider';

export const configureClient = async (
  {
    dataSourceId,
    savedObjects,
    cryptography,
    testClientDataSourceAttr,
    customApiSchemaRegistryPromise,
    request,
    authRegistry,
  }: DataSourceClientParams,
  openSearchClientPoolSetup: OpenSearchClientPoolSetup,
  config: DataSourcePluginConfigType,
  logger: Logger
): Promise<Client> => {
  let dataSource;
  let requireDecryption = true;
  let clientParams;

  try {
    // configure test client
    if (testClientDataSourceAttr) {
      const {
        auth: { type, credentials },
      } = testClientDataSourceAttr;
      // handle test connection case when changing non-credential field of existing data source
      if (
        dataSourceId &&
        ((type === AuthType.UsernamePasswordType && !credentials?.password) ||
          (type === AuthType.SigV4 && !credentials?.accessKey && !credentials?.secretKey))
      ) {
        dataSource = await getDataSource(dataSourceId, savedObjects);
      } else {
        dataSource = testClientDataSourceAttr;
        requireDecryption = false;
      }
    } else {
      dataSource = await getDataSource(dataSourceId!, savedObjects);
    }

    const authenticationMethod = getAuthenticationMethod(dataSource, authRegistry);
    if (authenticationMethod !== undefined) {
      clientParams = await authRegistryCredentialProvider(authenticationMethod, {
        dataSourceAttr: dataSource,
        request,
        cryptography,
      });
    }
    const rootClient = getRootClient(
      dataSource,
      openSearchClientPoolSetup.getClientFromPool,
      clientParams
    ) as Client;

    const registeredSchema = (await customApiSchemaRegistryPromise).getAll();

    return await getQueryClient(
      dataSource,
      openSearchClientPoolSetup.addClientToPool,
      config,
      registeredSchema,
      cryptography,
      rootClient,
      dataSourceId,
      request,
      clientParams,
      requireDecryption
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
 * Create a child client object with given auth info.
 *
 * @param rootClient root client for the given data source.
 * @param dataSourceAttr data source saved object attributes
 * @param registeredSchema registered API schema
 * @param cryptography cryptography service for password encryption / decryption
 * @param config data source config
 * @param addClientToPool function to add client to client pool
 * @param dataSourceId id of data source saved Object
 * @param request OpenSearch Dashboards incoming request to read client parameters from header.
 * @param authRegistry registry to retrieve the credentials provider for the authentication method in order to return the client
 * @param requireDecryption false when creating test client before data source exists
 * @returns Promise of query client
 */
const getQueryClient = async (
  dataSourceAttr: DataSourceAttributes,
  addClientToPool: (endpoint: string, authType: AuthType, client: Client | LegacyClient) => void,
  config: DataSourcePluginConfigType,
  registeredSchema: any[],
  cryptography?: CryptographyServiceSetup,
  rootClient?: Client,
  dataSourceId?: string,
  request?: OpenSearchDashboardsRequest,
  clientParams?: ClientParameters,
  requireDecryption: boolean = true
): Promise<Client> => {
  let credential;
  let cacheKeySuffix;
  let {
    auth: { type },
    endpoint,
  } = dataSourceAttr;
  const clientOptions = parseClientOptions(config, endpoint, registeredSchema);

  if (clientParams !== undefined) {
    credential = clientParams.credentials;
    type = clientParams.authType;
    cacheKeySuffix = clientParams.cacheKeySuffix;
    endpoint = clientParams.endpoint;

    if (credential.service === undefined) {
      credential = { ...credential, service: dataSourceAttr.auth.credentials?.service };
    }
  }

  const cacheKey = generateCacheKey(endpoint, cacheKeySuffix);

  switch (type) {
    case AuthType.NoAuth:
      if (!rootClient) rootClient = new Client(clientOptions);
      addClientToPool(cacheKey, type, rootClient);

      return rootClient.child();

    case AuthType.UsernamePasswordType:
      credential =
        (credential as UsernamePasswordTypedContent) ??
        (requireDecryption
          ? await getCredential(dataSourceAttr, cryptography!)
          : (dataSourceAttr.auth.credentials as UsernamePasswordTypedContent));

      if (!rootClient) rootClient = new Client(clientOptions);
      addClientToPool(cacheKey, type, rootClient);

      return getBasicAuthClient(rootClient, credential);

    case AuthType.SigV4:
      credential =
        (credential as SigV4Content) ??
        (requireDecryption
          ? await getAWSCredential(dataSourceAttr, cryptography!)
          : (dataSourceAttr.auth.credentials as SigV4Content));

      if (!rootClient) {
        rootClient = getAWSClient(credential, clientOptions);
      }
      addClientToPool(cacheKey, type, rootClient);

      return getAWSChildClient(rootClient, credential);

    default:
      throw Error(`${type} is not a supported auth type for data source`);
  }
};

const getBasicAuthClient = (
  rootClient: Client,
  credential: UsernamePasswordTypedContent
): Client => {
  const { username, password } = credential;
  return rootClient.child({
    auth: {
      username,
      password,
    },
    // Child client doesn't allow auth option, adding null auth header to bypass,
    // so logic in child() can rebuild the auth header based on the auth input.
    // See https://github.com/opensearch-project/OpenSearch-Dashboards/issues/2182 for details
    headers: { authorization: null },
  });
};

const getAWSClient = (credential: SigV4Content, clientOptions: ClientOptions): Client => {
  const { region } = credential;

  return new Client({
    ...AwsSigv4Signer({
      region,
    }),
    ...clientOptions,
  });
};

const getAWSChildClient = (rootClient: Client, credential: SigV4Content): Client => {
  const { accessKey, secretKey, region, service, sessionToken } = credential;

  return rootClient.child({
    auth: {
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
        sessionToken: sessionToken ?? '',
      },
      region,
      service: service ?? SigV4ServiceName.OpenSearch,
    },
  });
};
