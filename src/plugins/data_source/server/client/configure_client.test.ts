/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from '../../../../core/server';
import { loggingSystemMock, savedObjectsClientMock } from '../../../../core/server/mocks';
import { DATA_SOURCE_SAVED_OBJECT_TYPE } from '../../common';
import { DataSourceAttributes, AuthType } from '../../common/data_sources/types';
import { DataSourcePluginConfigType } from '../../config';
import { ClientMock, parseClientOptionsMock } from './configure_client.test.mocks';
import { OpenSearchClientPoolSetup } from './client_pool';
import { configureClient } from './configure_client';
import { ClientOptions } from '@opensearch-project/opensearch';
// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { opensearchClientMock } from '../../../../core/server/opensearch/client/mocks';
import { cryptographyServiceSetupMock } from '../cryptography_service.mocks';
import { CryptographyServiceSetup } from '../cryptography_service';
import { DataSourceClientParams } from '../types';

const DATA_SOURCE_ID = 'a54b76ec86771ee865a0f74a305dfff8';

// TODO: improve UT
describe('configureClient', () => {
  let logger: ReturnType<typeof loggingSystemMock.createLogger>;
  let config: DataSourcePluginConfigType;
  let savedObjectsMock: jest.Mocked<SavedObjectsClientContract>;
  let cryptographyMock: jest.Mocked<CryptographyServiceSetup>;
  let clientPoolSetup: OpenSearchClientPoolSetup;
  let clientOptions: ClientOptions;
  let dataSourceAttr: DataSourceAttributes;
  let dsClient: ReturnType<typeof opensearchClientMock.createInternalClient>;
  let dataSourceClientParams: DataSourceClientParams;

  beforeEach(() => {
    dsClient = opensearchClientMock.createInternalClient();
    logger = loggingSystemMock.createLogger();
    savedObjectsMock = savedObjectsClientMock.create();
    cryptographyMock = cryptographyServiceSetupMock.create();

    config = {
      enabled: true,
      clientPool: {
        size: 5,
      },
    } as DataSourcePluginConfigType;
    clientOptions = {
      nodes: 'http://localhost',
      ssl: {
        requestCert: true,
        rejectUnauthorized: true,
      },
    } as ClientOptions;
    dataSourceAttr = {
      title: 'title',
      endpoint: 'http://localhost',
      auth: {
        type: AuthType.UsernamePasswordType,
        credentials: {
          username: 'username',
          password: 'password',
        },
      },
    } as DataSourceAttributes;

    clientPoolSetup = {
      getClientFromPool: jest.fn(),
      addClientToPool: jest.fn(),
    };

    savedObjectsMock.get.mockResolvedValueOnce({
      id: DATA_SOURCE_ID,
      type: DATA_SOURCE_SAVED_OBJECT_TYPE,
      attributes: dataSourceAttr,
      references: [],
    });

    dataSourceClientParams = {
      dataSourceId: DATA_SOURCE_ID,
      savedObjects: savedObjectsMock,
      cryptography: cryptographyMock,
    };

    ClientMock.mockImplementation(() => dsClient);
  });

  afterEach(() => {
    ClientMock.mockReset();
  });

  test('configure client with auth.type == no_auth, will call new Client() to create client', async () => {
    savedObjectsMock.get.mockReset().mockResolvedValueOnce({
      id: DATA_SOURCE_ID,
      type: DATA_SOURCE_SAVED_OBJECT_TYPE,
      attributes: {
        ...dataSourceAttr,
        auth: {
          type: AuthType.NoAuth,
        },
      },
      references: [],
    });

    parseClientOptionsMock.mockReturnValue(clientOptions);

    const client = await configureClient(dataSourceClientParams, clientPoolSetup, config, logger);

    expect(parseClientOptionsMock).toHaveBeenCalled();
    expect(ClientMock).toHaveBeenCalledTimes(1);
    expect(ClientMock).toHaveBeenCalledWith(clientOptions);
    expect(savedObjectsMock.get).toHaveBeenCalledTimes(1);
    expect(client).toBe(dsClient.child.mock.results[0].value);
  });

  test('configure client with auth.type == username_password, will first call decodeAndDecrypt()', async () => {
    const decodeAndDecryptSpy = jest.spyOn(cryptographyMock, 'decodeAndDecrypt').mockResolvedValue({
      decryptedText: 'password',
      encryptionContext: { endpoint: 'http://localhost' },
    });

    const client = await configureClient(dataSourceClientParams, clientPoolSetup, config, logger);

    expect(ClientMock).toHaveBeenCalledTimes(1);
    expect(savedObjectsMock.get).toHaveBeenCalledTimes(1);
    expect(decodeAndDecryptSpy).toHaveBeenCalledTimes(1);
    expect(client).toBe(dsClient.child.mock.results[0].value);
  });

  test('configure client with auth.type == username_password and password contaminated', async () => {
    const decodeAndDecryptSpy = jest
      .spyOn(cryptographyMock, 'decodeAndDecrypt')
      .mockImplementation(() => {
        throw new Error();
      });

    await expect(
      configureClient(dataSourceClientParams, clientPoolSetup, config, logger)
    ).rejects.toThrowError();

    expect(ClientMock).not.toHaveBeenCalled();
    expect(savedObjectsMock.get).toHaveBeenCalledTimes(1);
    expect(decodeAndDecryptSpy).toHaveBeenCalledTimes(1);
  });

  test('configure client with auth.type == username_password and endpoint contaminated', async () => {
    const decodeAndDecryptSpy = jest.spyOn(cryptographyMock, 'decodeAndDecrypt').mockResolvedValue({
      decryptedText: 'password',
      encryptionContext: { endpoint: 'http://dummy.com' },
    });

    await expect(
      configureClient(dataSourceClientParams, clientPoolSetup, config, logger)
    ).rejects.toThrowError();

    expect(ClientMock).not.toHaveBeenCalled();
    expect(savedObjectsMock.get).toHaveBeenCalledTimes(1);
    expect(decodeAndDecryptSpy).toHaveBeenCalledTimes(1);
  });
});
