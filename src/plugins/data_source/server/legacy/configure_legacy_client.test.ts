/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from '../../../../core/server';
import { loggingSystemMock, savedObjectsClientMock } from '../../../../core/server/mocks';
import { DATA_SOURCE_SAVED_OBJECT_TYPE } from '../../common';
import { AuthType, DataSourceAttributes, SigV4Content } from '../../common/data_sources';
import { DataSourcePluginConfigType } from '../../config';
import { cryptographyServiceSetupMock } from '../cryptography_service.mocks';
import { CryptographyServiceSetup } from '../cryptography_service';
import { DataSourceClientParams, LegacyClientCallAPIParams } from '../types';
import { OpenSearchClientPoolSetup } from '../client';
import { ConfigOptions } from 'elasticsearch';
import { ClientMock, parseClientOptionsMock } from './configure_legacy_client.test.mocks';
import { configureLegacyClient } from './configure_legacy_client';

const DATA_SOURCE_ID = 'a54b76ec86771ee865a0f74a305dfff8';

// TODO: improve UT
describe('configureLegacyClient', () => {
  let logger: ReturnType<typeof loggingSystemMock.createLogger>;
  let config: DataSourcePluginConfigType;
  let savedObjectsMock: jest.Mocked<SavedObjectsClientContract>;
  let cryptographyMock: jest.Mocked<CryptographyServiceSetup>;
  let clientPoolSetup: OpenSearchClientPoolSetup;
  let configOptions: ConfigOptions;
  let dataSourceAttr: DataSourceAttributes;
  let sigV4AuthContent: SigV4Content;

  let mockOpenSearchClientInstance: {
    close: jest.Mock;
    ping: jest.Mock;
  };
  let dataSourceClientParams: DataSourceClientParams;
  let callApiParams: LegacyClientCallAPIParams;

  const mockResponse = { data: 'ping' };

  beforeEach(() => {
    mockOpenSearchClientInstance = {
      close: jest.fn(),
      ping: jest.fn(),
    };
    logger = loggingSystemMock.createLogger();
    savedObjectsMock = savedObjectsClientMock.create();
    cryptographyMock = cryptographyServiceSetupMock.create();
    config = {
      enabled: true,
      clientPool: {
        size: 5,
      },
    } as DataSourcePluginConfigType;

    configOptions = {
      host: 'http://localhost',
      ssl: {
        rejectUnauthorized: true,
      },
    } as ConfigOptions;

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

    sigV4AuthContent = {
      region: 'us-east-1',
      accessKey: 'accessKey',
      secretKey: 'secretKey',
    };

    clientPoolSetup = {
      getClientFromPool: jest.fn(),
      addClientToPool: jest.fn(),
    };

    callApiParams = {
      endpoint: 'ping',
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

    ClientMock.mockImplementation(() => mockOpenSearchClientInstance);

    mockOpenSearchClientInstance.ping.mockImplementation(function mockCall(this: any) {
      return Promise.resolve({
        context: this,
        response: mockResponse,
      });
    });
  });

  afterEach(() => {
    ClientMock.mockReset();
    jest.resetAllMocks();
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

    parseClientOptionsMock.mockReturnValue(configOptions);

    await configureLegacyClient(
      dataSourceClientParams,
      callApiParams,
      clientPoolSetup,
      config,
      logger
    );

    expect(parseClientOptionsMock).toHaveBeenCalled();
    expect(ClientMock).toHaveBeenCalledTimes(1);
    expect(ClientMock).toHaveBeenCalledWith(configOptions);
    expect(savedObjectsMock.get).toHaveBeenCalledTimes(1);
  });

  test('configure client with auth.type == username_password, will first call decrypt()', async () => {
    const decodeAndDecryptSpy = jest.spyOn(cryptographyMock, 'decodeAndDecrypt').mockResolvedValue({
      decryptedText: 'password',
      encryptionContext: { endpoint: 'http://localhost' },
    });

    const mockResult = await configureLegacyClient(
      dataSourceClientParams,
      callApiParams,
      clientPoolSetup,
      config,
      logger
    );

    expect(ClientMock).toHaveBeenCalledTimes(1);
    expect(savedObjectsMock.get).toHaveBeenCalledTimes(1);
    expect(decodeAndDecryptSpy).toHaveBeenCalledTimes(1);
    expect(mockResult).toBeDefined();
  });

  test('configure client with auth.type == sigv4 and service param, should call new Client() with service param', async () => {
    savedObjectsMock.get.mockReset().mockResolvedValueOnce({
      id: DATA_SOURCE_ID,
      type: DATA_SOURCE_SAVED_OBJECT_TYPE,
      attributes: {
        ...dataSourceAttr,
        auth: {
          type: AuthType.SigV4,
          credentials: { ...sigV4AuthContent, service: 'aoss' },
        },
      },
      references: [],
    });

    parseClientOptionsMock.mockReturnValue(configOptions);

    jest.spyOn(cryptographyMock, 'decodeAndDecrypt').mockResolvedValue({
      decryptedText: 'accessKey',
      encryptionContext: { endpoint: 'http://localhost' },
    });

    await configureLegacyClient(
      dataSourceClientParams,
      callApiParams,
      clientPoolSetup,
      config,
      logger
    );

    expect(parseClientOptionsMock).toHaveBeenCalled();
    expect(ClientMock).toHaveBeenCalledTimes(1);
    expect(ClientMock).toHaveBeenCalledWith(expect.objectContaining({ service: 'aoss' }));

    expect(savedObjectsMock.get).toHaveBeenCalledTimes(1);
  });

  test('configure client with auth.type == username_password and password contaminated', async () => {
    const decodeAndDecryptSpy = jest
      .spyOn(cryptographyMock, 'decodeAndDecrypt')
      .mockImplementation(() => {
        throw new Error();
      });

    await expect(
      configureLegacyClient(dataSourceClientParams, callApiParams, clientPoolSetup, config, logger)
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
      configureLegacyClient(dataSourceClientParams, callApiParams, clientPoolSetup, config, logger)
    ).rejects.toThrowError();

    expect(ClientMock).not.toHaveBeenCalled();
    expect(savedObjectsMock.get).toHaveBeenCalledTimes(1);
    expect(decodeAndDecryptSpy).toHaveBeenCalledTimes(1);
  });

  test('correctly called with endpoint and params', async () => {
    jest.spyOn(cryptographyMock, 'decodeAndDecrypt').mockResolvedValue({
      decryptedText: 'password',
      encryptionContext: { endpoint: 'http://localhost' },
    });

    const mockParams = { param: 'ping' };
    const mockResult = await configureLegacyClient(
      dataSourceClientParams,
      { ...callApiParams, clientParams: mockParams },
      clientPoolSetup,
      config,
      logger
    );

    expect(mockResult.response).toBe(mockResponse);
    expect(mockResult.context).toBe(mockOpenSearchClientInstance);
    expect(mockOpenSearchClientInstance.ping).toHaveBeenCalledTimes(1);
    expect(mockOpenSearchClientInstance.ping).toHaveBeenLastCalledWith(mockParams);
  });
});
