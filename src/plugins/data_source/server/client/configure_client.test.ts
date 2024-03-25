/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from '../../../../core/server';
import { loggingSystemMock, savedObjectsClientMock } from '../../../../core/server/mocks';
import { DATA_SOURCE_SAVED_OBJECT_TYPE } from '../../common';
import {
  DataSourceAttributes,
  AuthType,
  UsernamePasswordTypedContent,
  SigV4Content,
  SigV4ServiceName,
} from '../../common/data_sources/types';
import { DataSourcePluginConfigType } from '../../config';
import {
  ClientMock,
  parseClientOptionsMock,
  authRegistryCredentialProviderMock,
} from './configure_client.test.mocks';
import { OpenSearchClientPool, OpenSearchClientPoolSetup } from './client_pool';
import { configureClient } from './configure_client';
import { ClientOptions } from '@opensearch-project/opensearch-next';
// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { opensearchClientMock } from '../../../../core/server/opensearch/client/mocks';
import { cryptographyServiceSetupMock } from '../cryptography_service.mocks';
import { CryptographyServiceSetup } from '../cryptography_service';
import { DataSourceClientParams, AuthenticationMethod, ClientParameters } from '../types';
import { CustomApiSchemaRegistry } from '../schema_registry';
import { IAuthenticationMethodRegistry } from '../auth_registry';
import { authenticationMethodRegistryMock } from '../auth_registry/authentication_methods_registry.mock';

const DATA_SOURCE_ID = 'a54b76ec86771ee865a0f74a305dfff8';

// TODO: improve UT
describe('configureClient', () => {
  let logger: ReturnType<typeof loggingSystemMock.createLogger>;
  let config: DataSourcePluginConfigType;
  let savedObjectsMock: jest.Mocked<SavedObjectsClientContract>;
  let cryptographyMock: jest.Mocked<CryptographyServiceSetup>;
  let clientOptions: ClientOptions;
  let dataSourceAttr: DataSourceAttributes;
  let dsClient: ReturnType<typeof opensearchClientMock.createInternalClient>;
  let dataSourceClientParams: DataSourceClientParams;
  let usernamePasswordAuthContent: UsernamePasswordTypedContent;
  let sigV4AuthContent: SigV4Content;
  let customApiSchemaRegistry: CustomApiSchemaRegistry;
  let authenticationMethodRegistry: jest.Mocked<IAuthenticationMethodRegistry>;
  let clientParameters: ClientParameters;

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
    dsClient = opensearchClientMock.createInternalClient();
    logger = loggingSystemMock.createLogger();
    savedObjectsMock = savedObjectsClientMock.create();
    cryptographyMock = cryptographyServiceSetupMock.create();
    customApiSchemaRegistry = new CustomApiSchemaRegistry();
    authenticationMethodRegistry = authenticationMethodRegistryMock.create();

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

    usernamePasswordAuthContent = {
      username: 'username',
      password: 'password',
    };

    sigV4AuthContent = {
      region: 'us-east-1',
      accessKey: 'accessKey',
      secretKey: 'secretKey',
    };

    dataSourceAttr = {
      title: 'title',
      endpoint: 'http://localhost',
      auth: {
        type: AuthType.UsernamePasswordType,
        credentials: usernamePasswordAuthContent,
      },
    } as DataSourceAttributes;

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

    ClientMock.mockImplementation(() => dsClient);
    authenticationMethodRegistry.getAuthenticationMethod.mockImplementation(() => authMethod);
    authRegistryCredentialProviderMock.mockReturnValue(clientParameters);
  });

  afterEach(() => {
    ClientMock.mockReset();
    authRegistryCredentialProviderMock.mockReset();
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

  test('configure client with auth.type == sigv4, will first call decodeAndDecrypt()', async () => {
    savedObjectsMock.get.mockReset().mockResolvedValueOnce({
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

    const decodeAndDecryptSpy = jest.spyOn(cryptographyMock, 'decodeAndDecrypt').mockResolvedValue({
      decryptedText: 'accessKey',
      encryptionContext: { endpoint: 'http://localhost' },
    });
    await configureClient(dataSourceClientParams, clientPoolSetup, config, logger);

    expect(ClientMock).toHaveBeenCalledTimes(1);
    expect(savedObjectsMock.get).toHaveBeenCalledTimes(1);
    expect(decodeAndDecryptSpy).toHaveBeenCalledTimes(2);
  });

  test('configure client with auth.type == sigv4, service == aoss, should successfully call new Client()', async () => {
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

    jest.spyOn(cryptographyMock, 'decodeAndDecrypt').mockResolvedValue({
      decryptedText: 'accessKey',
      encryptionContext: { endpoint: 'http://localhost' },
    });

    const client = await configureClient(dataSourceClientParams, clientPoolSetup, config, logger);

    expect(ClientMock).toHaveBeenCalledTimes(1);
    expect(client).toBe(dsClient.child.mock.results[0].value);
    expect(dsClient.child).toBeCalledWith({
      auth: {
        credentials: {
          accessKeyId: 'accessKey',
          secretAccessKey: 'accessKey',
          sessionToken: '',
        },
        region: sigV4AuthContent.region,
        service: 'aoss',
      },
    });
  });

  test('configure test client for non-exist datasource should not call saved object api, nor decode any credential', async () => {
    const decodeAndDecryptSpy = jest.spyOn(cryptographyMock, 'decodeAndDecrypt').mockResolvedValue({
      decryptedText: 'password',
      encryptionContext: { endpoint: 'http://localhost' },
    });
    const testClientParams: DataSourceClientParams = {
      ...dataSourceClientParams,
      testClientDataSourceAttr: dataSourceAttr,
      dataSourceId: undefined,
    };
    await configureClient(testClientParams, clientPoolSetup, config, logger);

    expect(ClientMock).toHaveBeenCalledTimes(1);
    expect(savedObjectsMock.get).not.toHaveBeenCalled();
    expect(decodeAndDecryptSpy).not.toHaveBeenCalled();
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

  test('configureClient should return client if authentication method from registry provides credentials', async () => {
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

    const client = await configureClient(
      { ...dataSourceClientParams, authRegistry: authenticationMethodRegistry },
      clientPoolSetup,
      config,
      logger
    );
    expect(authRegistryCredentialProviderMock).toHaveBeenCalled();
    expect(authenticationMethodRegistry.getAuthenticationMethod).toHaveBeenCalledTimes(1);
    expect(ClientMock).toHaveBeenCalledTimes(1);
    expect(savedObjectsMock.get).toHaveBeenCalledTimes(1);
    expect(client).toBe(dsClient.child.mock.results[0].value);
    expect(dsClient.child).toBeCalledWith({
      auth: {
        credentials: {
          accessKeyId: sigV4AuthContent.accessKey,
          secretAccessKey: sigV4AuthContent.secretKey,
          sessionToken: '',
        },
        region: sigV4AuthContent.region,
        service: SigV4ServiceName.OpenSearch,
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

    const client = await configureClient(
      { ...dataSourceClientParams, authRegistry: authenticationMethodRegistry },
      clientPoolSetup,
      config,
      logger
    );

    expect(ClientMock).toHaveBeenCalledTimes(1);
    expect(client).toBe(dsClient.child.mock.results[0].value);
    expect(dsClient.child).toBeCalledWith({
      auth: {
        credentials: {
          accessKeyId: mockCredentials.accessKey,
          secretAccessKey: mockCredentials.secretKey,
          sessionToken: mockCredentials.sessionToken,
        },
        region: mockCredentials.region,
        service: SigV4ServiceName.OpenSearch,
      },
    });
  });

  test('configure client with auth method from registry, service == aoss, should successfully call new Client()', async () => {
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

    const client = await configureClient(
      { ...dataSourceClientParams, authRegistry: authenticationMethodRegistry },
      clientPoolSetup,
      config,
      logger
    );

    expect(ClientMock).toHaveBeenCalledTimes(1);
    expect(client).toBe(dsClient.child.mock.results[0].value);
    expect(dsClient.child).toBeCalledWith({
      auth: {
        credentials: {
          accessKeyId: sigV4AuthContent.accessKey,
          secretAccessKey: sigV4AuthContent.secretKey,
          sessionToken: '',
        },
        region: sigV4AuthContent.region,
        service: 'aoss',
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
        await configureClient(dataSourceClientParams, opensearchClientPoolSetup, config, logger);
        await configureClient(dataSourceClientParams, opensearchClientPoolSetup, config, logger);

        expect(ClientMock).toHaveBeenCalledTimes(1);
      });

      test('For different endpoints multiple client objects should be created', async () => {
        await configureClient(dataSourceClientParams, opensearchClientPoolSetup, config, logger);

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

        await configureClient(dataSourceClientParams, opensearchClientPoolSetup, config, logger);

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
        await configureClient(dataSourceClientParams, opensearchClientPoolSetup, config, logger);
        await configureClient(dataSourceClientParams, opensearchClientPoolSetup, config, logger);

        expect(ClientMock).toHaveBeenCalledTimes(1);
      });

      test('For different endpoints multiple client objects should be created', async () => {
        await configureClient(dataSourceClientParams, opensearchClientPoolSetup, config, logger);

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

        await configureClient(dataSourceClientParams, opensearchClientPoolSetup, config, logger);

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
        await configureClient(dataSourceClientParams, opensearchClientPoolSetup, config, logger);
        await configureClient(dataSourceClientParams, opensearchClientPoolSetup, config, logger);

        expect(ClientMock).toHaveBeenCalledTimes(1);
      });

      test('For different endpoints multiple client objects should be created', async () => {
        await configureClient(dataSourceClientParams, opensearchClientPoolSetup, config, logger);

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
        await configureClient(dataSourceClientParams, opensearchClientPoolSetup, config, logger);

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
      test('If endpoint is same for multiple requests client pool size should be 1', async () => {
        await configureClient(
          { ...dataSourceClientParams, authRegistry: authenticationMethodRegistry },
          opensearchClientPoolSetup,
          config,
          logger
        );

        await configureClient(
          { ...dataSourceClientParams, authRegistry: authenticationMethodRegistry },
          opensearchClientPoolSetup,
          config,
          logger
        );

        expect(ClientMock).toHaveBeenCalledTimes(1);
      });

      test('If endpoint is different for two requests client pool size should be 2', async () => {
        await configureClient(
          { ...dataSourceClientParams, authRegistry: authenticationMethodRegistry },
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

        await configureClient(
          { ...dataSourceClientParams, authRegistry: authenticationMethodRegistry },
          opensearchClientPoolSetup,
          config,
          logger
        );

        expect(ClientMock).toHaveBeenCalledTimes(2);
      });
    });
  });
});
