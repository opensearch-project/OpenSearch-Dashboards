/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from '../../../../core/server';
import { loggingSystemMock, savedObjectsClientMock } from '../../../../core/server/mocks';
import { DATA_SOURCE_SAVED_OBJECT_TYPE } from '../../common';
import { DataSourceAttributes, CredentialsType } from '../../common/data_sources/types';
import { DataSourcePluginConfigType } from '../../config';
import { ClientMock, parseClientOptionsMock } from './configure_client.test.mocks';
import { OpenSearchClientPoolSetup } from './client_pool';
import { configureClient } from './configure_client';
import { ClientOptions } from '@opensearch-project/opensearch';
// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { opensearchClientMock } from '../../../../core/server/opensearch/client/mocks';
import { CryptographyClient } from '../cryptography';

const DATA_SOURCE_ID = 'a54b76ec86771ee865a0f74a305dfff8';
const cryptoClient = new CryptographyClient('test', 'test', new Array(32).fill(0));

// TODO: improve UT
describe('configureClient', () => {
  let logger: ReturnType<typeof loggingSystemMock.createLogger>;
  let config: DataSourcePluginConfigType;
  let savedObjectsMock: jest.Mocked<SavedObjectsClientContract>;
  let clientPoolSetup: OpenSearchClientPoolSetup;
  let clientOptions: ClientOptions;
  let dataSourceAttr: DataSourceAttributes;
  let dsClient: ReturnType<typeof opensearchClientMock.createInternalClient>;

  beforeEach(() => {
    dsClient = opensearchClientMock.createInternalClient();
    logger = loggingSystemMock.createLogger();
    savedObjectsMock = savedObjectsClientMock.create();
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
      noAuth: false,
      credentials: {
        type: CredentialsType.UsernamePasswordType,
        credentialsContent: {
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

    ClientMock.mockImplementation(() => {
      return dsClient;
    });
  });

  afterEach(() => {
    ClientMock.mockReset();
  });

  test('configure client with noAuth == true, will call new Client() to create client', async () => {
    savedObjectsMock.get.mockReset().mockResolvedValueOnce({
      id: DATA_SOURCE_ID,
      type: DATA_SOURCE_SAVED_OBJECT_TYPE,
      attributes: { ...dataSourceAttr, noAuth: true },
      references: [],
    });

    parseClientOptionsMock.mockReturnValue(clientOptions);

    const client = await configureClient(
      DATA_SOURCE_ID,
      savedObjectsMock,
      cryptoClient,
      clientPoolSetup,
      config,
      logger
    );

    expect(parseClientOptionsMock).toHaveBeenCalled();
    expect(ClientMock).toHaveBeenCalledTimes(1);
    expect(ClientMock).toHaveBeenCalledWith(clientOptions);
    expect(savedObjectsMock.get).toHaveBeenCalledTimes(1);
    expect(client).toBe(dsClient.child.mock.results[0].value);
  });

  test('configure client with noAuth == false, will first call decrypt()', async () => {
    const spy = jest.spyOn(cryptoClient, 'decodeAndDecrypt').mockResolvedValue('password');

    const client = await configureClient(
      DATA_SOURCE_ID,
      savedObjectsMock,
      cryptoClient,
      clientPoolSetup,
      config,
      logger
    );

    expect(ClientMock).toHaveBeenCalledTimes(1);
    expect(savedObjectsMock.get).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(client).toBe(dsClient.child.mock.results[0].value);
  });
});
