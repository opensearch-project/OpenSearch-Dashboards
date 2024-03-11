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
import { DataSourceClientParams, LegacyClientCallAPIParams, AuthenticationMethod } from '../types';
import { OpenSearchClientPoolSetup } from '../client';
import { ConfigOptions } from 'elasticsearch';
import { ClientMock, parseClientOptionsMock } from './configure_legacy_client.test.mocks';
import {
  authRegistryCredentialProviderMock,
  CredentialsMock,
} from '../client/./configure_client.test.mocks';
import { configureLegacyClient } from './configure_legacy_client';
import { CustomApiSchemaRegistry } from '../schema_registry';
import { IAuthenticationMethodRegistery } from '../auth_registry';
import { authenticationMethodRegisteryMock } from '../auth_registry/authentication_methods_registry.mock';

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
  let authenticationMethodRegistery: jest.Mocked<IAuthenticationMethodRegistery>;

  let mockOpenSearchClientInstance: {
    close: jest.Mock;
    ping: jest.Mock;
  };
  let dataSourceClientParams: DataSourceClientParams;
  let callApiParams: LegacyClientCallAPIParams;
  const customApiSchemaRegistry = new CustomApiSchemaRegistry();

  const mockResponse = { data: 'ping' };

  const customAuthContent = {
    region: 'us-east-1',
    roleARN: 'test-role',
  };

  const authMethod: AuthenticationMethod = {
    name: 'typeA',
    authType: AuthType.SigV4,
    credentialProvider: jest.fn(),
  };

  beforeEach(() => {
    mockOpenSearchClientInstance = {
      close: jest.fn(),
      ping: jest.fn(),
    };
    logger = loggingSystemMock.createLogger();
    savedObjectsMock = savedObjectsClientMock.create();
    cryptographyMock = cryptographyServiceSetupMock.create();
    authenticationMethodRegistery = authenticationMethodRegisteryMock.create();
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
      customApiSchemaRegistryPromise: Promise.resolve(customApiSchemaRegistry),
    };

    ClientMock.mockImplementation(() => mockOpenSearchClientInstance);

    mockOpenSearchClientInstance.ping.mockImplementation(function mockCall(this: any) {
      return Promise.resolve({
        context: this,
        response: mockResponse,
      });
    });

    authenticationMethodRegistery.getAuthenticationMethod.mockImplementation(() => authMethod);
  });

  afterEach(() => {
    ClientMock.mockReset();
    CredentialsMock.mockReset();
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

  test('configureLegacyClient should return client if authentication method from registry provides credentials', async () => {
    savedObjectsMock.get.mockReset().mockResolvedValueOnce({
      id: DATA_SOURCE_ID,
      type: DATA_SOURCE_SAVED_OBJECT_TYPE,
      attributes: {
        ...dataSourceAttr,
        auth: {
          type: AuthType.SigV4,
          credentials: customAuthContent,
        },
      },
      references: [],
    });

    authRegistryCredentialProviderMock.mockReturnValue({
      credential: sigV4AuthContent,
      type: AuthType.SigV4,
    });

    await configureLegacyClient(
      { ...dataSourceClientParams, authRegistry: authenticationMethodRegistery },
      callApiParams,
      clientPoolSetup,
      config,
      logger
    );
    expect(authRegistryCredentialProviderMock).toHaveBeenCalled();
    expect(authenticationMethodRegistery.getAuthenticationMethod).toHaveBeenCalledTimes(1);
    expect(ClientMock).toHaveBeenCalledTimes(1);
    expect(savedObjectsMock.get).toHaveBeenCalledTimes(1);
    expect(CredentialsMock).toHaveBeenCalledTimes(1);
    expect(CredentialsMock).toBeCalledWith({
      accessKeyId: sigV4AuthContent.accessKey,
      secretAccessKey: sigV4AuthContent.secretKey,
    });
  });

  test('When credential provider from auth registry returns session token, credentials should contains session token', async () => {
    const mockCredentials = { ...sigV4AuthContent, sessionToken: 'sessionToken' };
    savedObjectsMock.get.mockReset().mockResolvedValueOnce({
      id: DATA_SOURCE_ID,
      type: DATA_SOURCE_SAVED_OBJECT_TYPE,
      attributes: {
        ...dataSourceAttr,
        auth: {
          type: AuthType.SigV4,
          credentials: customAuthContent,
        },
      },
      references: [],
    });

    authRegistryCredentialProviderMock.mockReturnValue({
      credential: mockCredentials,
      type: AuthType.SigV4,
    });

    await configureLegacyClient(
      { ...dataSourceClientParams, authRegistry: authenticationMethodRegistery },
      callApiParams,
      clientPoolSetup,
      config,
      logger
    );
    expect(authRegistryCredentialProviderMock).toHaveBeenCalled();
    expect(authenticationMethodRegistery.getAuthenticationMethod).toHaveBeenCalledTimes(1);
    expect(ClientMock).toHaveBeenCalledTimes(1);
    expect(savedObjectsMock.get).toHaveBeenCalledTimes(1);
    expect(CredentialsMock).toHaveBeenCalledTimes(1);
    expect(CredentialsMock).toBeCalledWith({
      accessKeyId: mockCredentials.accessKey,
      secretAccessKey: mockCredentials.secretKey,
      sessionToken: mockCredentials.sessionToken,
    });
  });
});
