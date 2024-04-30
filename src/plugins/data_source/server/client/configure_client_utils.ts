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
import { IAuthenticationMethodRegistry } from '../auth_registry';
import { AuthenticationMethod, ClientParameters } from '../types';

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
  clientParams?: ClientParameters
): Client | LegacyClient | undefined => {
  let cacheKeySuffix;
  let {
    auth: { type },
    endpoint,
  } = dataSourceAttr;

  if (clientParams !== undefined) {
    endpoint = clientParams.endpoint;
    cacheKeySuffix = clientParams.cacheKeySuffix;
    type = clientParams.authType;
  }

  const cacheKey = generateCacheKey(endpoint, cacheKeySuffix);

  return getClientFromPool(cacheKey, type);
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

export const generateCacheKey = (endpoint: string, cacheKeySuffix?: string) => {
  const CACHE_KEY_DELIMITER = ',';
  let key = endpoint;
  if (cacheKeySuffix) key += CACHE_KEY_DELIMITER + cacheKeySuffix;
  return key;
};

export const getAuthenticationMethod = (
  dataSourceAttr: DataSourceAttributes,
  authRegistry?: IAuthenticationMethodRegistry
): AuthenticationMethod => {
  return authRegistry?.getAuthenticationMethod(dataSourceAttr.auth.type) as AuthenticationMethod;
};
