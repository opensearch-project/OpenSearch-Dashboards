/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client } from '@opensearch-project/opensearch';
import { Logger, SavedObject, SavedObjectsClientContract } from '../../../../../src/core/server';
import { DATA_SOURCE_SAVED_OBJECT_TYPE } from '../../common';
import {
  AuthType,
  DataSourceAttributes,
  UsernamePasswordTypedContent,
} from '../../common/data_sources';
import { DataSourcePluginConfigType } from '../../config';
import { CryptographyServiceSetup } from '../cryptography_service';
import { createDataSourceError, DataSourceError } from '../lib/error';
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
    const dataSource = await getDataSource(dataSourceId, savedObjects);
    const rootClient = getRootClient(dataSource.attributes, config, openSearchClientPoolSetup);

    return await getQueryClient(rootClient, dataSource, cryptography);
  } catch (error: any) {
    logger.error(`Failed to get data source client for dataSourceId: [${dataSourceId}]`);
    logger.error(error);
    // Re-throw as DataSourceError
    throw createDataSourceError(error);
  }
};

export const getDataSource = async (
  dataSourceId: string,
  savedObjects: SavedObjectsClientContract
): Promise<SavedObject<DataSourceAttributes>> => {
  const dataSource = await savedObjects.get<DataSourceAttributes>(
    DATA_SOURCE_SAVED_OBJECT_TYPE,
    dataSourceId
  );
  return dataSource;
};

export const getCredential = async (
  dataSource: SavedObject<DataSourceAttributes>,
  cryptography: CryptographyServiceSetup
): Promise<UsernamePasswordTypedContent> => {
  const { endpoint } = dataSource.attributes!;

  const { username, password } = dataSource.attributes.auth.credentials!;

  const { decryptedText, encryptionContext } = await cryptography
    .decodeAndDecrypt(password)
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
    username,
    password: decryptedText,
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
  rootClient: Client,
  dataSource: SavedObject<DataSourceAttributes>,
  cryptography: CryptographyServiceSetup
): Promise<Client> => {
  const authType = dataSource.attributes.auth.type;

  switch (authType) {
    case AuthType.NoAuth:
      return rootClient.child();

    case AuthType.UsernamePasswordType:
      const credential = await getCredential(dataSource, cryptography);
      return getBasicAuthClient(rootClient, credential);

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
    const clientOptions = parseClientOptions(config, endpoint);

    const client = new Client(clientOptions);
    addClientToPool(endpoint, client);

    return client;
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
