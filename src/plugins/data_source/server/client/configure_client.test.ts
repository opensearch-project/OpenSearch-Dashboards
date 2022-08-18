/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from '../../../../core/server';
import { loggingSystemMock, savedObjectsClientMock } from '../../../../core/server/mocks';
import { DATA_SOURCE_SAVED_OBJECT_TYPE, CREDENTIAL_SAVED_OBJECT_TYPE } from '../../common';
import {
  CredentialMaterialsType,
  CredentialSavedObjectAttributes,
} from '../../common/credentials/types';
import { DataSourceAttributes } from '../../common/data_sources';
import { DataSourcePluginConfigType } from '../../config';
import { ClientMock, parseClientOptionsMock } from './configure_client.test.mocks';
import { OpenSearchClientPoolSetup } from './client_pool';
import { configureClient } from './configure_client';
import { ClientOptions } from '@opensearch-project/opensearch';
// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { opensearchClientMock } from '../../../../core/server/opensearch/client/mocks';

const DATA_SOURCE_ID = 'a54b76ec86771ee865a0f74a305dfff8';
const CREDENETIAL_ID = 'a54dsaadasfasfwe22d23d23d2453df3';

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
    } as DataSourceAttributes;

    clientPoolSetup = {
      getClientFromPool: jest.fn(),
      addClientToPool: jest.fn(),
    };

    const crendentialAttr = {
      title: 'cred',
      credentialMaterials: {
        credentialMaterialsType: CredentialMaterialsType.UsernamePasswordType,
        credentialMaterialsContent: {
          username: 'username',
          password: 'password',
        },
      },
    } as CredentialSavedObjectAttributes;

    savedObjectsMock.get
      .mockResolvedValueOnce({
        id: DATA_SOURCE_ID,
        type: DATA_SOURCE_SAVED_OBJECT_TYPE,
        attributes: dataSourceAttr,
        references: [{ name: 'user', type: CREDENTIAL_SAVED_OBJECT_TYPE, id: CREDENETIAL_ID }],
      })
      .mockResolvedValueOnce({
        id: CREDENETIAL_ID,
        type: CREDENTIAL_SAVED_OBJECT_TYPE,
        attributes: crendentialAttr,
        references: [],
      });

    ClientMock.mockImplementation(() => {
      return dsClient;
    });
  });

  afterEach(() => {
    ClientMock.mockReset();
  });
  // TODO: mark as skip until we fix the issue of mocking "@opensearch-project/opensearch"
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

  test('configure client with noAuth == false, will first call new Client()', async () => {
    const client = await configureClient(
      DATA_SOURCE_ID,
      savedObjectsMock,
      clientPoolSetup,
      config,
      logger
    );

    expect(ClientMock).toHaveBeenCalledTimes(1);
    expect(savedObjectsMock.get).toHaveBeenCalledTimes(2);
    expect(client).toBe(dsClient.child.mock.results[0].value);
  });
});
