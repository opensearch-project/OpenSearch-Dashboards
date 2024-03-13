/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from '../../../../../src/core/server';
import { DATA_SOURCE_SAVED_OBJECT_TYPE } from '../../common';
import {
  DataSourceAttributes,
  UsernamePasswordTypedContent,
  SigV4Content,
} from '../../common/data_sources';
import { CryptographyServiceSetup } from '../cryptography_service';
import { createDataSourceError } from '../lib/error';

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
