/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client } from '@opensearch-project/opensearch-next';
import { Client as LegacyClient } from 'elasticsearch';
import { SavedObjectsClientContract } from '../../../../../src/core/server';
import { DATA_SOURCE_SAVED_OBJECT_TYPE } from '../../common';
import {
  DataSourceAttributes,
  UsernamePasswordTypedContent,
  SigV4Content,
  AuthType,
} from '../../common/data_sources';
import { CryptographyServiceSetup } from '../cryptography_service';
import { createDataSourceError } from '../lib/error';

/**
 * Get the root client of datasource from
 * client cache. If there's a cache miss, return undefined.
 *
 * @param dataSourceAttr data source saved objects attributes
 * @param dataSourceId id of data source saved Object
 * @param addClientToPool function to get client from client pool
 * @returns cached OpenSearch client, or undefined if cache miss
 */
export const getRootClient = (
  dataSourceAttr: DataSourceAttributes,
  getClientFromPool: (endpoint: string, authType: AuthType) => Client | LegacyClient | undefined,
  dataSourceId?: string
): Client | LegacyClient | undefined => {
  const {
    auth: { type },
    lastUpdatedTime,
  } = dataSourceAttr;
  let cachedClient;
  const cacheKey = generateCacheKey(dataSourceAttr, dataSourceId);

  // return undefined when building SigV4 test client with new credentials
  if (type === AuthType.SigV4) {
    cachedClient = dataSourceId && lastUpdatedTime ? getClientFromPool(cacheKey, type) : undefined;
  } else {
    cachedClient = getClientFromPool(cacheKey, type);
  }

  return cachedClient;
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
  const { accessKey, secretKey, region, service } = dataSource.auth.credentials! as SigV4Content;

  const {
    decryptedText: accessKeyText,
    encryptionContext: accessKeyEncryptionContext,
  } = await cryptography.decodeAndDecrypt(accessKey).catch((err: any) => {
    // Re-throw as DataSourceError
    throw createDataSourceError(err);
  });

  const {
    decryptedText: secretKeyText,
    encryptionContext: secretKeyEncryptionContext,
  } = await cryptography.decodeAndDecrypt(secretKey).catch((err: any) => {
    // Re-throw as DataSourceError
    throw createDataSourceError(err);
  });

  if (
    accessKeyEncryptionContext.endpoint !== endpoint ||
    secretKeyEncryptionContext.endpoint !== endpoint
  ) {
    throw new Error(
      'Data source "endpoint" contaminated. Please delete and create another data source.'
    );
  }

  const credential = {
    region,
    accessKey: accessKeyText,
    secretKey: secretKeyText,
    service,
  };

  return credential;
};

export const generateCacheKey = (dataSourceAttr: DataSourceAttributes, dataSourceId?: string) => {
  const CACHE_KEY_DELIMITER = ',';
  const {
    auth: { type },
    endpoint,
    lastUpdatedTime,
  } = dataSourceAttr;
  // opensearch-js client doesn't support spawning child with aws sigv4 connection class,
  // we are storing/getting the actual client instead of rootClient in/from aws client pool,
  // by a key of "<endpoint>,<dataSourceId>,<lastUpdatedTime>"
  const key =
    type === AuthType.SigV4
      ? endpoint + CACHE_KEY_DELIMITER + dataSourceId + CACHE_KEY_DELIMITER + lastUpdatedTime
      : endpoint;

  return key;
};
