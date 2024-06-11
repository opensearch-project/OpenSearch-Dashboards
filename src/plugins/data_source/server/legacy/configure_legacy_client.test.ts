/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from '../../../../core/server';
import { loggingSystemMock, savedObjectsClientMock } from '../../../../core/server/mocks';
import { DATA_SOURCE_SAVED_OBJECT_TYPE } from '../../common';
import {
  AuthType,
  DataSourceAttributes,
  SigV4Content,
  SigV4ServiceName,
} from '../../common/data_sources';
import { DataSourcePluginConfigType } from '../../config';
import { cryptographyServiceSetupMock } from '../cryptography_service.mocks';
import { CryptographyServiceSetup } from '../cryptography_service';
import {
  DataSourceClientParams,
  LegacyClientCallAPIParams,
  AuthenticationMethod,
  ClientParameters,
} from '../types';
import { OpenSearchClientPool, OpenSearchClientPoolSetup } from '../client';
import { ConfigOptions } from 'elasticsearch';
import { ClientMock, parseClientOptionsMock } from './configure_legacy_client.test.mocks';
import { authRegistryCredentialProviderMock } from '../client/configure_client.test.mocks';
import { configureLegacyClient } from './configure_legacy_client';
import { CustomApiSchemaRegistry } from '../schema_registry';
import { IAuthenticationMethodRegistry } from '../auth_registry';
import { authenticationMethodRegistryMock } from '../auth_registry/authentication_methods_registry.mock';

const DATA_SOURCE_ID = 'a54b76ec86771ee865a0f74a305dfff8';

// TODO: improve UT
describe('configureLegacyClient', () => {
  let logger: ReturnType<typeof loggingSystemMock.createLogger>;
  let config: DataSourcePluginConfigType;
  let savedObjectsMock: jest.Mocked<SavedObjectsClientContract>;
  let cryptographyMock: jest.Mocked<CryptographyServiceSetup>;
  let configOptions: ConfigOptions;
  let dataSourceAttr: DataSourceAttributes;
  let sigV4AuthContent: SigV4Content;
  let authenticationMethodRegistry: jest.Mocked<IAuthenticationMethodRegistry>;
  let clientParameters: ClientParameters;

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

  const clientPoolSetup: OpenSearchClientPoolSetup = {
    getClientFromPool: jest.fn(),
    addClientToPool: jest.fn(),
  };

  const authMethod: AuthenticationMethod = {
    name: 'typeA',
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
    authenticationMethodRegistry = authenticationMethodRegistryMock.create();
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

    clientParameters = {
      authType: AuthType.SigV4,
      endpoint: dataSourceAttr.endpoint,
      cacheKeySuffix: '',
      credentials: sigV4AuthContent,
    };

    ClientMock.mockImplementation(() => mockOpenSearchClientInstance);

    mockOpenSearchClientInstance.ping.mockImplementation(function mockCall(this: any) {
      return Promise.resolve({
        context: this,
        response: mockResponse,
      });
    });

    authenticationMethodRegistry.getAuthenticationMethod.mockImplementation(() => authMethod);
    authRegistryCredentialProviderMock.mockReturnValue(clientParameters);
  });

  afterEach(() => {
    ClientMock.mockReset();
    authRegistryCredentialProviderMock.mockReset();
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

    expect(savedObjectsMock.get).toHaveBeenCalledTimes(1);
    expect(mockOpenSearchClientInstance.ping).toHaveBeenLastCalledWith({
      headers: {
        auth: {
          credentials: {
            accessKeyId: 'accessKey',
            secretAccessKey: 'accessKey',
            sessionToken: '',
          },
          region: sigV4AuthContent.region,
          service: 'aoss',
        },
      },
    });
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

    await configureLegacyClient(
      { ...dataSourceClientParams, authRegistry: authenticationMethodRegistry },
      callApiParams,
      clientPoolSetup,
      config,
      logger
    );
    expect(authRegistryCredentialProviderMock).toHaveBeenCalled();
    expect(authenticationMethodRegistry.getAuthenticationMethod).toHaveBeenCalledTimes(1);
    expect(ClientMock).toHaveBeenCalledTimes(1);
    expect(savedObjectsMock.get).toHaveBeenCalledTimes(1);
    expect(mockOpenSearchClientInstance.ping).toHaveBeenCalledTimes(1);
    expect(mockOpenSearchClientInstance.ping).toHaveBeenLastCalledWith({
      headers: {
        auth: {
          credentials: {
            accessKeyId: sigV4AuthContent.accessKey,
            secretAccessKey: sigV4AuthContent.secretKey,
            sessionToken: '',
          },
          region: sigV4AuthContent.region,
          service: SigV4ServiceName.OpenSearch,
        },
      },
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
      ...clientParameters,
      credentials: mockCredentials,
    });

    await configureLegacyClient(
      { ...dataSourceClientParams, authRegistry: authenticationMethodRegistry },
      callApiParams,
      clientPoolSetup,
      config,
      logger
    );
    expect(authRegistryCredentialProviderMock).toHaveBeenCalled();
    expect(authenticationMethodRegistry.getAuthenticationMethod).toHaveBeenCalledTimes(1);
    expect(ClientMock).toHaveBeenCalledTimes(1);
    expect(savedObjectsMock.get).toHaveBeenCalledTimes(1);
    expect(mockOpenSearchClientInstance.ping).toHaveBeenCalledTimes(1);
    expect(mockOpenSearchClientInstance.ping).toHaveBeenLastCalledWith({
      headers: {
        auth: {
          credentials: {
            accessKeyId: mockCredentials.accessKey,
            secretAccessKey: mockCredentials.secretKey,
            sessionToken: mockCredentials.sessionToken,
          },
          region: mockCredentials.region,
          service: SigV4ServiceName.OpenSearch,
        },
      },
    });
  });
  test('configureLegacyClient with auth method from registry, service == aoss, should successfully call new Client()', async () => {
    savedObjectsMock.get.mockReset().mockResolvedValueOnce({
      id: DATA_SOURCE_ID,
      type: DATA_SOURCE_SAVED_OBJECT_TYPE,
      attributes: {
        ...dataSourceAttr,
        auth: {
          type: AuthType.SigV4,
          credentials: { ...customAuthContent, service: 'aoss' },
        },
      },
      references: [],
    });

    await configureLegacyClient(
      { ...dataSourceClientParams, authRegistry: authenticationMethodRegistry },
      callApiParams,
      clientPoolSetup,
      config,
      logger
    );
    expect(authRegistryCredentialProviderMock).toHaveBeenCalled();
    expect(authenticationMethodRegistry.getAuthenticationMethod).toHaveBeenCalledTimes(1);
    expect(ClientMock).toHaveBeenCalledTimes(1);
    expect(savedObjectsMock.get).toHaveBeenCalledTimes(1);
    expect(mockOpenSearchClientInstance.ping).toHaveBeenCalledTimes(1);
    expect(mockOpenSearchClientInstance.ping).toHaveBeenLastCalledWith({
      headers: {
        auth: {
          credentials: {
            accessKeyId: sigV4AuthContent.accessKey,
            secretAccessKey: sigV4AuthContent.secretKey,
            sessionToken: '',
          },
          region: sigV4AuthContent.region,
          service: 'aoss',
        },
      },
    });
  });

  describe('Client Pool', () => {
    let opensearchClientPoolSetup: OpenSearchClientPoolSetup;
    let openSearchClientPool: OpenSearchClientPool;
    beforeEach(() => {
      openSearchClientPool = new OpenSearchClientPool(logger);
      opensearchClientPoolSetup = openSearchClientPool.setup(config);
    });

    describe('NoAuth', () => {
      beforeEach(() => {
        savedObjectsMock.get.mockReset().mockResolvedValue({
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
      });

      test('For same endpoint only one client object should be created', async () => {
        await configureLegacyClient(
          dataSourceClientParams,
          callApiParams,
          opensearchClientPoolSetup,
          config,
          logger
        );
        await configureLegacyClient(
          dataSourceClientParams,
          callApiParams,
          opensearchClientPoolSetup,
          config,
          logger
        );

        expect(ClientMock).toHaveBeenCalledTimes(1);
      });

      test('For different endpoints multiple client objects should be created', async () => {
        await configureLegacyClient(
          dataSourceClientParams,
          callApiParams,
          opensearchClientPoolSetup,
          config,
          logger
        );

        const mockDataSourceAttr = { ...dataSourceAttr, endpoint: 'http://test.com' };

        savedObjectsMock.get.mockReset().mockResolvedValueOnce({
          id: DATA_SOURCE_ID,
          type: DATA_SOURCE_SAVED_OBJECT_TYPE,
          attributes: {
            ...mockDataSourceAttr,
            auth: {
              type: AuthType.NoAuth,
            },
          },
          references: [],
        });

        await configureLegacyClient(
          dataSourceClientParams,
          callApiParams,
          opensearchClientPoolSetup,
          config,
          logger
        );

        expect(ClientMock).toHaveBeenCalledTimes(2);
      });
    });

    describe('UserNamePassword', () => {
      beforeEach(() => {
        savedObjectsMock.get.mockReset().mockResolvedValue({
          id: DATA_SOURCE_ID,
          type: DATA_SOURCE_SAVED_OBJECT_TYPE,
          attributes: dataSourceAttr,
          references: [],
        });
        jest.spyOn(cryptographyMock, 'decodeAndDecrypt').mockResolvedValue({
          decryptedText: 'password',
          encryptionContext: { endpoint: 'http://localhost' },
        });
      });

      test('For same endpoint only one client object should be created', async () => {
        await configureLegacyClient(
          dataSourceClientParams,
          callApiParams,
          opensearchClientPoolSetup,
          config,
          logger
        );
        await configureLegacyClient(
          dataSourceClientParams,
          callApiParams,
          opensearchClientPoolSetup,
          config,
          logger
        );

        expect(ClientMock).toHaveBeenCalledTimes(1);
      });

      test('For different endpoints multiple client objects should be created', async () => {
        await configureLegacyClient(
          dataSourceClientParams,
          callApiParams,
          opensearchClientPoolSetup,
          config,
          logger
        );

        const mockDataSourceAttr = { ...dataSourceAttr, endpoint: 'http://test.com' };
        savedObjectsMock.get.mockReset().mockResolvedValue({
          id: DATA_SOURCE_ID,
          type: DATA_SOURCE_SAVED_OBJECT_TYPE,
          attributes: mockDataSourceAttr,
          references: [],
        });
        jest.spyOn(cryptographyMock, 'decodeAndDecrypt').mockResolvedValue({
          decryptedText: 'password',
          encryptionContext: { endpoint: 'http://test.com' },
        });

        await configureLegacyClient(
          dataSourceClientParams,
          callApiParams,
          opensearchClientPoolSetup,
          config,
          logger
        );

        expect(ClientMock).toHaveBeenCalledTimes(2);
      });
    });

    describe('AWSSigV4', () => {
      beforeEach(() => {
        savedObjectsMock.get.mockReset().mockResolvedValue({
          id: DATA_SOURCE_ID,
          type: DATA_SOURCE_SAVED_OBJECT_TYPE,
          attributes: {
            ...dataSourceAttr,
            auth: {
              type: AuthType.SigV4,
              credentials: sigV4AuthContent,
            },
          },
          references: [],
        });

        jest.spyOn(cryptographyMock, 'decodeAndDecrypt').mockResolvedValue({
          decryptedText: 'accessKey',
          encryptionContext: { endpoint: 'http://localhost' },
        });
      });
      test('For same endpoint only one client object should be created', async () => {
        await configureLegacyClient(
          dataSourceClientParams,
          callApiParams,
          opensearchClientPoolSetup,
          config,
          logger
        );
        await configureLegacyClient(
          dataSourceClientParams,
          callApiParams,
          opensearchClientPoolSetup,
          config,
          logger
        );

        expect(ClientMock).toHaveBeenCalledTimes(1);
      });

      test('For different endpoints multiple client objects should be created', async () => {
        await configureLegacyClient(
          dataSourceClientParams,
          callApiParams,
          opensearchClientPoolSetup,
          config,
          logger
        );
        const mockDataSourceAttr = { ...dataSourceAttr, endpoint: 'http://test.com' };
        savedObjectsMock.get.mockReset().mockResolvedValue({
          id: DATA_SOURCE_ID,
          type: DATA_SOURCE_SAVED_OBJECT_TYPE,
          attributes: {
            ...mockDataSourceAttr,
            auth: {
              type: AuthType.SigV4,
              credentials: sigV4AuthContent,
            },
          },
          references: [],
        });

        jest.spyOn(cryptographyMock, 'decodeAndDecrypt').mockResolvedValue({
          decryptedText: 'accessKey',
          encryptionContext: { endpoint: 'http://test.com' },
        });
        await configureLegacyClient(
          dataSourceClientParams,
          callApiParams,
          opensearchClientPoolSetup,
          config,
          logger
        );

        expect(ClientMock).toHaveBeenCalledTimes(2);
      });
    });

    describe('Auth Method from Registry', () => {
      beforeEach(() => {
        const authMethodWithClientPool: AuthenticationMethod = {
          name: 'clientPoolTest',
          credentialProvider: jest.fn(),
        };
        authenticationMethodRegistry.getAuthenticationMethod
          .mockReset()
          .mockImplementation(() => authMethodWithClientPool);
        const mockDataSourceAttr = { ...dataSourceAttr, name: 'custom_auth' };
        savedObjectsMock.get.mockReset().mockResolvedValue({
          id: DATA_SOURCE_ID,
          type: DATA_SOURCE_SAVED_OBJECT_TYPE,
          attributes: {
            ...mockDataSourceAttr,
            auth: {
              type: AuthType.SigV4,
              credentials: customAuthContent,
            },
          },
          references: [],
        });
      });
      test(' If endpoint is same for multiple requests client pool size should be 1', async () => {
        await configureLegacyClient(
          { ...dataSourceClientParams, authRegistry: authenticationMethodRegistry },
          callApiParams,
          opensearchClientPoolSetup,
          config,
          logger
        );

        await configureLegacyClient(
          { ...dataSourceClientParams, authRegistry: authenticationMethodRegistry },
          callApiParams,
          opensearchClientPoolSetup,
          config,
          logger
        );

        expect(ClientMock).toHaveBeenCalledTimes(1);
      });

      test('If endpoint is different for two requests client pool size should be 2', async () => {
        await configureLegacyClient(
          { ...dataSourceClientParams, authRegistry: authenticationMethodRegistry },
          callApiParams,
          opensearchClientPoolSetup,
          config,
          logger
        );

        const mockDataSourceAttr = {
          ...dataSourceAttr,
          endpoint: 'http://test.com',
          name: 'custom_auth',
        };
        savedObjectsMock.get.mockReset().mockResolvedValue({
          id: DATA_SOURCE_ID,
          type: DATA_SOURCE_SAVED_OBJECT_TYPE,
          attributes: {
            ...mockDataSourceAttr,
            auth: {
              type: AuthType.SigV4,
              credentials: customAuthContent,
            },
          },
          references: [],
        });
        authRegistryCredentialProviderMock.mockReturnValue({
          ...clientParameters,
          endpoint: 'http://test.com',
          cacheKeySuffix: 'test',
        });

        await configureLegacyClient(
          { ...dataSourceClientParams, authRegistry: authenticationMethodRegistry },
          callApiParams,
          opensearchClientPoolSetup,
          config,
          logger
        );

        expect(ClientMock).toHaveBeenCalledTimes(2);
      });
    });
  });
});
