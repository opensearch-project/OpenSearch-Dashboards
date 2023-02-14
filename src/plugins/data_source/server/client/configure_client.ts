/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client } from '@opensearch-project/opensearch';
import { Client as LegacyClient } from 'elasticsearch';
import { Credentials } from 'aws-sdk';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';
import { Logger, SavedObjectsClientContract } from '../../../../../src/core/server';
import { DATA_SOURCE_SAVED_OBJECT_TYPE } from '../../common';
import {
  AuthType,
  DataSourceAttributes,
  SigV4Content,
  UsernamePasswordTypedContent,
} from '../../common/data_sources';
import { DataSourcePluginConfigType } from '../../config';
import { CryptographyServiceSetup } from '../cryptography_service';
import { createDataSourceError } from '../lib/error';
import { DataSourceClientParams } from '../types';
import { parseClientOptions } from './client_config';
import { OpenSearchClientPoolSetup } from './client_pool';

export const configureClient = async (
  { dataSourceId, savedObjects, cryptography }: DataSourceClientParams,
  openSearchClientPoolSetup: OpenSearchClientPoolSetup,
  config: DataSourcePluginConfigType,
  logger: Logger
): Promise<Client> => {
  try {
    const dataSource = await getDataSource(dataSourceId!, savedObjects);
    const rootClient = getRootClient(
      dataSource,
      config,
      openSearchClientPoolSetup.getClientFromPool
    );

    return await getQueryClient(
      dataSource,
      openSearchClientPoolSetup.addClientToPool,
      cryptography,
      rootClient
    );
  } catch (error: any) {
    logger.error(`Failed to get data source client for dataSourceId: [${dataSourceId}]`);
    logger.error(error);
    // Re-throw as DataSourceError
    throw createDataSourceError(error);
  }
};

export const configureTestClient = async (
  { savedObjects, cryptography, dataSourceId }: DataSourceClientParams,
  dataSourceAttr: DataSourceAttributes,
  openSearchClientPoolSetup: OpenSearchClientPoolSetup,
  config: DataSourcePluginConfigType,
  logger: Logger
): Promise<Client> => {
  try {
    const {
      auth: { type, credentials },
    } = dataSourceAttr;
    let requireDecryption = false;

    const rootClient = getRootClient(
      dataSourceAttr,
      config,
      openSearchClientPoolSetup.getClientFromPool
    );

    if (type === AuthType.UsernamePasswordType && !credentials?.password && dataSourceId) {
      dataSourceAttr = await getDataSource(dataSourceId, savedObjects);
      requireDecryption = true;
    }

    return getQueryClient(
      dataSourceAttr,
      openSearchClientPoolSetup.addClientToPool,
      cryptography,
      rootClient,
      requireDecryption
    );
  } catch (error: any) {
    logger.error(`Failed to get test client`);
    logger.error(error);
    // Re-throw as DataSourceError
    throw createDataSourceError(error);
  }
};

export const getDataSource = async (
  dataSourceId: string,
  savedObjects: SavedObjectsClientContract
): Promise<DataSourceAttributes> => {
  const dataSourceSavedObject = await savedObjects.get<DataSourceAttributes>(
    DATA_SOURCE_SAVED_OBJECT_TYPE,
    dataSourceId
  );

  const dataSourceAttr = {
    ...dataSourceSavedObject.attributes,
    lastUpdatedTime: dataSourceSavedObject.updated_at,
  };

  return dataSourceAttr;
};

export const getCredential = async (
  dataSource: DataSourceAttributes,
  cryptography: CryptographyServiceSetup
): Promise<UsernamePasswordTypedContent> => {
  const { endpoint } = dataSource;

  const { username, password } = dataSource.auth.credentials as UsernamePasswordTypedContent;

  const { decryptedText, encryptionContext } = await cryptography.decodeAndDecrypt(password);

  if (encryptionContext!.endpoint !== endpoint) {
    throw new Error(
      'Data source "endpoint" contaminated. Please delete and create another data source.'
    );
  }

  const credential = {
    username,
    password: decryptedText,
  };

  return credential;
};

export const getAWSCredential = async (
  dataSource: DataSourceAttributes,
  cryptography: CryptographyServiceSetup
): Promise<SigV4Content> => {
  const { endpoint } = dataSource;
  const { accessKey, secretKey, region } = dataSource.auth.credentials! as SigV4Content;

  const { decryptedText: accessKeyText, encryptionContext } = await cryptography
    .decodeAndDecrypt(accessKey)
    .catch((err: any) => {
      // Re-throw as DataSourceError
      throw createDataSourceError(err);
    });

  const { decryptedText: secretKeyText } = await cryptography
    .decodeAndDecrypt(secretKey)
    .catch((err: any) => {
      // Re-throw as DataSourceError
      throw createDataSourceError(err);
    });

  if (encryptionContext!.endpoint !== endpoint) {
    throw new Error(
      'Data source "endpoint" contaminated. Please delete and create another data source.'
    );
  }

  const credential = {
    region,
    accessKey: accessKeyText,
    secretKey: secretKeyText,
  };

  return credential;
};

/**
 * Create a child client object with given auth info.
 *
 * @param rootClient root client for the connection with given data source endpoint.
 * @param dataSource data source saved object
 * @param cryptography cryptography service for password encryption / decryption
 * @returns child client.
 */
const getQueryClient = async (
  dataSourceAttr: DataSourceAttributes,
  addClientToPool: (endpoint: string, authType: AuthType, client: Client | LegacyClient) => void,
  cryptography?: CryptographyServiceSetup,
  rootClient?: Client,
  requireDecryption: boolean = true
): Promise<Client> => {
  const {
    auth: { type },
    endpoint,
    lastUpdatedTime,
  } = dataSourceAttr;

  switch (type) {
    case AuthType.NoAuth:
      addClientToPool(endpoint, type, rootClient!);
      return rootClient!.child();

    case AuthType.UsernamePasswordType:
      addClientToPool(endpoint, type, rootClient!);
      const credential = requireDecryption
        ? await getCredential(dataSourceAttr, cryptography!)
        : (dataSourceAttr.auth.credentials as UsernamePasswordTypedContent);
      return getBasicAuthClient(rootClient!, credential);

    case AuthType.SigV4:
      const awsCredential = requireDecryption
        ? await getAWSCredential(dataSourceAttr, cryptography!)
        : (dataSourceAttr.auth.credentials as SigV4Content);

      const awsClient = rootClient ? rootClient : getAWSClient(awsCredential, endpoint);
      addClientToPool(endpoint + lastUpdatedTime, type, awsClient);
      return awsClient;

    default:
      throw Error(`${type} is not a supported auth type for data source`);
  }
};

/**
 * Gets a root client object of the OpenSearch endpoint.
 * Will attempt to get from cache, if cache miss, create a new one and load into cache.
 *
 * @param dataSourceAttr data source saved objects attributes
 * @param config data source config
 * @returns OpenSearch client for the given data source endpoint.
 */
export const getRootClient = (
  dataSourceAttr: DataSourceAttributes,
  config: DataSourcePluginConfigType,
  getClientFromPool: (endpoint: string, authType: AuthType) => Client | LegacyClient | undefined
): Client | undefined => {
  const {
    auth: { type },
    endpoint,
    lastUpdatedTime,
  } = dataSourceAttr;

  const clientOptions = parseClientOptions(config, endpoint);
  let cachedClient;

  if (type === AuthType.SigV4) {
    // opensearch-js client doesn't support spawning child with aws sigv4 connection class,
    // we are storing/getting the actual client instead of rootClient in/from aws client pool,
    // by a key of endpoint + lastUpdatedTime
    cachedClient = getClientFromPool(endpoint + lastUpdatedTime, type);
    return cachedClient ? (cachedClient as Client) : undefined;
  } else {
    cachedClient = getClientFromPool(endpoint, type);
    return cachedClient ? (cachedClient as Client) : new Client(clientOptions);
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

const getAWSClient = (credential: SigV4Content, endpoint: string): Client => {
  const { accessKey, secretKey, region } = credential;

  const credentialProvider = (): Promise<Credentials> => {
    return new Promise((resolve) => {
      resolve(new Credentials({ accessKeyId: accessKey, secretAccessKey: secretKey }));
    });
  };

  return new Client({
    ...AwsSigv4Signer({
      region,
      getCredentials: credentialProvider,
    }),
    node: endpoint,
  });
};
