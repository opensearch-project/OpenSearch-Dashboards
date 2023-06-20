/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, ClientOptions } from '@opensearch-project/opensearch-next';
import { Client as LegacyClient } from 'elasticsearch';
import { Credentials } from 'aws-sdk';
import { AwsSigv4Signer } from '@opensearch-project/opensearch-next/aws';
import { Logger } from '../../../../../src/core/server';
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
import {
  getRootClient,
  getAWSCredential,
  getCredential,
  getDataSource,
  generateCacheKey,
} from './configure_client_utils';

export const configureClient = async (
  { dataSourceId, savedObjects, cryptography, testClientDataSourceAttr }: DataSourceClientParams,
  openSearchClientPoolSetup: OpenSearchClientPoolSetup,
  config: DataSourcePluginConfigType,
  logger: Logger
): Promise<Client> => {
  let dataSource;
  let requireDecryption = true;

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

    const rootClient = getRootClient(
      dataSource,
      openSearchClientPoolSetup.getClientFromPool,
      dataSourceId
    ) as Client;

    return await getQueryClient(
      dataSource,
      openSearchClientPoolSetup.addClientToPool,
      config,
      cryptography,
      rootClient,
      dataSourceId,
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
 * @param cryptography cryptography service for password encryption / decryption
 * @param config data source config
 * @param addClientToPool function to add client to client pool
 * @param dataSourceId id of data source saved Object
 * @param requireDecryption false when creating test client before data source exists
 * @returns Promise of query client
 */
const getQueryClient = async (
  dataSourceAttr: DataSourceAttributes,
  addClientToPool: (endpoint: string, authType: AuthType, client: Client | LegacyClient) => void,
  config: DataSourcePluginConfigType,
  cryptography?: CryptographyServiceSetup,
  rootClient?: Client,
  dataSourceId?: string,
  requireDecryption: boolean = true
): Promise<Client> => {
  const {
    auth: { type },
    endpoint,
  } = dataSourceAttr;
  const clientOptions = parseClientOptions(config, endpoint);
  const cacheKey = generateCacheKey(dataSourceAttr, dataSourceId);

  switch (type) {
    case AuthType.NoAuth:
      if (!rootClient) rootClient = new Client(clientOptions);
      addClientToPool(cacheKey, type, rootClient);

      return rootClient.child();

    case AuthType.UsernamePasswordType:
      const credential = requireDecryption
        ? await getCredential(dataSourceAttr, cryptography!)
        : (dataSourceAttr.auth.credentials as UsernamePasswordTypedContent);

      if (!rootClient) rootClient = new Client(clientOptions);
      addClientToPool(cacheKey, type, rootClient);

      return getBasicAuthClient(rootClient, credential);

    case AuthType.SigV4:
      const awsCredential = requireDecryption
        ? await getAWSCredential(dataSourceAttr, cryptography!)
        : (dataSourceAttr.auth.credentials as SigV4Content);

      const awsClient = rootClient ? rootClient : getAWSClient(awsCredential, clientOptions);
      addClientToPool(cacheKey, type, awsClient);

      return awsClient;

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
  const { accessKey, secretKey, region, service } = credential;

  const credentialProvider = (): Promise<Credentials> => {
    return new Promise((resolve) => {
      resolve(new Credentials({ accessKeyId: accessKey, secretAccessKey: secretKey }));
    });
  };

  return new Client({
    ...AwsSigv4Signer({
      region,
      getCredentials: credentialProvider,
      service,
    }),
    ...clientOptions,
  });
};
