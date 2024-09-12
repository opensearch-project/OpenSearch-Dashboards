/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import uuid from 'uuid';
import {
  httpServerMock,
  savedObjectsClientMock,
  coreMock,
  loggingSystemMock,
} from '../../../../core/server/mocks';
import { DATA_SOURCE_SAVED_OBJECT_TYPE } from '../../common';
import { AuthType } from '../../common/data_sources';
import { cryptographyServiceSetupMock } from '../cryptography_service.mocks';
import { DataSourceSavedObjectsClientWrapper } from './data_source_saved_objects_client_wrapper';
import { SavedObject } from 'opensearch-dashboards/public';
import { DATA_SOURCE_TITLE_LENGTH_LIMIT } from '../util/constants';

describe('DataSourceSavedObjectsClientWrapper', () => {
  const customAuthName = 'role_based_auth';
  const customAuthMethod = {
    name: customAuthName,
    authType: AuthType.SigV4,
    credentialProvider: jest.fn(),
  };
  jest.mock('../auth_registry');
  const { AuthenticationMethodRegistry: authenticationMethodRegistry } = jest.requireActual(
    '../auth_registry'
  );
  const authRegistry = new authenticationMethodRegistry();
  authRegistry.registerAuthenticationMethod(customAuthMethod);

  const requestHandlerContext = coreMock.createRequestHandlerContext();
  const cryptographyMock = cryptographyServiceSetupMock.create();
  const logger = loggingSystemMock.createLogger();
  const authRegistryPromise = Promise.resolve(authRegistry);
  const wrapperInstance = new DataSourceSavedObjectsClientWrapper(
    cryptographyMock,
    logger,
    authRegistryPromise
  );
  const mockedClient = savedObjectsClientMock.create();
  const wrapperClient = wrapperInstance.wrapperFactory({
    client: mockedClient,
    typeRegistry: requestHandlerContext.savedObjects.typeRegistry,
    request: httpServerMock.createOpenSearchDashboardsRequest(),
  });

  const getSavedObject = (savedObject: Partial<SavedObject>) => {
    const payload: SavedObject = {
      references: [],
      id: '',
      type: DATA_SOURCE_SAVED_OBJECT_TYPE,
      attributes: {},
      ...savedObject,
    };

    return payload;
  };

  const attributes = (attribute?: any) => {
    return {
      title: 'create-test-ds123',
      description: 'jest testing',
      endpoint: 'https://test.com',
      ...attribute,
    };
  };

  describe('createWithCredentialsEncryption', () => {
    beforeEach(() => {
      mockedClient.create.mockClear();
    });
    it('should create data source when auth type is NO_AUTH', async () => {
      const mockDataSourceAttributesWithNoAuth = attributes({
        auth: {
          type: AuthType.NoAuth,
        },
      });
      await wrapperClient.create(
        DATA_SOURCE_SAVED_OBJECT_TYPE,
        mockDataSourceAttributesWithNoAuth,
        {}
      );
      expect(mockedClient.create).toBeCalledWith(
        expect.stringMatching(DATA_SOURCE_SAVED_OBJECT_TYPE),
        expect.objectContaining(mockDataSourceAttributesWithNoAuth),
        expect.anything()
      );
    });

    it('should create data source when auth type is UsernamePasswordType', async () => {
      const password = 'test123';
      const encryptedPassword = 'XXXXYYY';
      const mockDataSourceAttributesWithAuth = attributes({
        auth: {
          type: AuthType.UsernamePasswordType,
          credentials: {
            username: 'test123',
            password,
          },
        },
      });
      cryptographyMock.encryptAndEncode.mockResolvedValueOnce(Promise.resolve(encryptedPassword));
      await wrapperClient.create(
        DATA_SOURCE_SAVED_OBJECT_TYPE,
        mockDataSourceAttributesWithAuth,
        {}
      );
      expect(mockedClient.create).toBeCalledWith(
        expect.stringMatching(DATA_SOURCE_SAVED_OBJECT_TYPE),
        expect.objectContaining({
          ...mockDataSourceAttributesWithAuth,
          auth: {
            ...mockDataSourceAttributesWithAuth.auth,
            credentials: {
              username: 'test123',
              password: encryptedPassword,
            },
          },
        }),
        expect.anything()
      );
    });

    it('should create data source when auth type is SigV4', async () => {
      const accessKey = uuid();
      const secretKey = uuid();
      const region = 'us-east-1';
      const service = 'es';
      const encryptedAccessKey = `encrypted_${accessKey}`;
      const encryptedSecretKey = `encrypted_${secretKey}`;
      const mockDataSourceAttributesWithSigV4 = attributes({
        auth: {
          type: AuthType.SigV4,
          credentials: {
            accessKey,
            secretKey,
            region,
            service,
          },
        },
      });
      cryptographyMock.encryptAndEncode.mockResolvedValueOnce(Promise.resolve(encryptedAccessKey));
      cryptographyMock.encryptAndEncode.mockResolvedValueOnce(Promise.resolve(encryptedSecretKey));
      await wrapperClient.create(
        DATA_SOURCE_SAVED_OBJECT_TYPE,
        mockDataSourceAttributesWithSigV4,
        {}
      );
      expect(mockedClient.create).toBeCalledWith(
        expect.stringMatching(DATA_SOURCE_SAVED_OBJECT_TYPE),
        expect.objectContaining({
          ...mockDataSourceAttributesWithSigV4,
          auth: {
            ...mockDataSourceAttributesWithSigV4.auth,
            credentials: {
              ...mockDataSourceAttributesWithSigV4.auth.credentials,
              accessKey: encryptedAccessKey,
              secretKey: encryptedSecretKey,
            },
          },
        }),
        expect.anything()
      );
    });

    it('should create data source when auth type is present in auth registry', async () => {
      const mockDataSourceAttributes = attributes({
        auth: {
          type: customAuthName,
        },
      });
      await wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, mockDataSourceAttributes, {});
      expect(mockedClient.create).toBeCalledWith(
        expect.stringMatching(DATA_SOURCE_SAVED_OBJECT_TYPE),
        expect.objectContaining(mockDataSourceAttributes),
        expect.anything()
      );
    });

    it('should throw error when auth type is neigther supported by default nor present in auth registry', async () => {
      const type = 'not_in_registry';
      const mockDataSourceAttributes = attributes({
        auth: {
          type,
        },
      });
      await expect(
        wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, mockDataSourceAttributes, {})
      ).rejects.toThrowError(`Invalid auth type: 'not_in_registry': Bad Request`);
    });

    describe('createWithCredentialsEncryption: Error handling', () => {
      it('should throw error when title is empty', async () => {
        const mockDataSourceAttributes = attributes({
          title: '',
        });
        await expect(
          wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, mockDataSourceAttributes, {})
        ).rejects.toThrowError(`"title" attribute must be a non-empty string`);
      });

      it(`should throw error when title is longer than ${DATA_SOURCE_TITLE_LENGTH_LIMIT} characters`, async () => {
        const mockDataSourceAttributes = attributes({
          title: 'a'.repeat(33),
        });
        await expect(
          wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, mockDataSourceAttributes, {})
        ).rejects.toThrowError(
          `"title" attribute is limited to ${DATA_SOURCE_TITLE_LENGTH_LIMIT} characters`
        );
      });

      it('should throw error when endpoint is not valid', async () => {
        const mockDataSourceAttributes = attributes({
          endpoint: 'asasasasas',
        });
        await expect(
          wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, mockDataSourceAttributes, {})
        ).rejects.toThrowError(`"endpoint" attribute is not valid or allowed`);
      });

      it('should throw error when auth is not present', async () => {
        await expect(
          wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, attributes(), {})
        ).rejects.toThrowError(`"auth" attribute is required`);
      });

      it('should throw error when type field is not present in auth', async () => {
        const mockDataSourceAttributes = attributes({
          auth: {},
        });
        await expect(
          wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, mockDataSourceAttributes, {})
        ).rejects.toThrowError(`"auth.type" attribute is required`);
      });

      it('should throw error when credentials are not present in auth when auth type is UsernamePasswordType', async () => {
        const mockDataSourceAttributesWithAuth = attributes({
          auth: {
            type: AuthType.UsernamePasswordType,
          },
        });
        await expect(
          wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, mockDataSourceAttributesWithAuth, {})
        ).rejects.toThrowError(`"auth.credentials" attribute is required`);
      });

      it('should throw error when username is not present in auth when auth type is UsernamePasswordType', async () => {
        const mockDataSourceAttributesWithAuth = attributes({
          auth: {
            type: AuthType.UsernamePasswordType,
            credentials: {},
          },
        });
        await expect(
          wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, mockDataSourceAttributesWithAuth, {})
        ).rejects.toThrowError(`"auth.credentials.username" attribute is required`);
      });

      it('should throw error when password is not present in auth when auth type is UsernamePasswordType', async () => {
        const mockDataSourceAttributesWithAuth = attributes({
          auth: {
            type: AuthType.UsernamePasswordType,
            credentials: {
              username: 'test',
            },
          },
        });
        await expect(
          wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, mockDataSourceAttributesWithAuth, {})
        ).rejects.toThrowError(`"auth.credentials.password" attribute is required`);
      });

      it('should throw error when credentials are not present in auth when auth type is SigV4', async () => {
        const mockDataSourceAttributesWithAuth = attributes({
          auth: {
            type: AuthType.SigV4,
          },
        });
        await expect(
          wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, mockDataSourceAttributesWithAuth, {})
        ).rejects.toThrowError(`"auth.credentials" attribute is required`);
      });

      it('should throw error when accessKey is not present in auth when auth type is SigV4', async () => {
        const mockDataSourceAttributesWithAuth = attributes({
          auth: {
            type: AuthType.SigV4,
            credentials: {},
          },
        });
        await expect(
          wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, mockDataSourceAttributesWithAuth, {})
        ).rejects.toThrowError(`"auth.credentials.accessKey" attribute is required`);
      });

      it('should throw error when secretKey is not present in auth when auth type is SigV4', async () => {
        const mockDataSourceAttributesWithAuth = attributes({
          auth: {
            type: AuthType.SigV4,
            credentials: {
              accessKey: 'test',
            },
          },
        });
        await expect(
          wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, mockDataSourceAttributesWithAuth, {})
        ).rejects.toThrowError(`"auth.credentials.secretKey" attribute is required`);
      });

      it('should throw error when region is not present in auth when auth type is SigV4', async () => {
        const mockDataSourceAttributesWithAuth = attributes({
          auth: {
            type: AuthType.SigV4,
            credentials: {
              accessKey: 'test',
              secretKey: 'test',
            },
          },
        });
        await expect(
          wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, mockDataSourceAttributesWithAuth, {})
        ).rejects.toThrowError(`"auth.credentials.region" attribute is required`);
      });

      it('should throw error when service is not present in auth when auth type is SigV4', async () => {
        const mockDataSourceAttributesWithAuth = attributes({
          auth: {
            type: AuthType.SigV4,
            credentials: {
              accessKey: 'test',
              secretKey: 'test',
              region: 'us-east-1',
            },
          },
        });
        await expect(
          wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, mockDataSourceAttributesWithAuth, {})
        ).rejects.toThrowError(`"auth.credentials.service" attribute is required`);
      });
    });
  });

  describe('bulkCreateWithCredentialsEncryption', () => {
    beforeEach(() => {
      mockedClient.bulkCreate.mockClear();
    });

    it('should create data sources when auth type is UsernamePasswordType', async () => {
      const password = 'test123';
      const encryptedPassword = 'XXXXYYY';
      const mockDataSourceAttributesWithAuth = attributes({
        type: DATA_SOURCE_SAVED_OBJECT_TYPE,
        auth: {
          type: AuthType.UsernamePasswordType,
          credentials: {
            username: 'test123',
            password,
          },
        },
      });
      cryptographyMock.encryptAndEncode.mockResolvedValueOnce(Promise.resolve(encryptedPassword));
      await wrapperClient.bulkCreate(
        [
          getSavedObject({
            id: 'test1',
            attributes: mockDataSourceAttributesWithAuth,
          }),
        ],
        {}
      );
      expect(mockedClient.bulkCreate).toBeCalledWith(
        [
          {
            attributes: {
              ...mockDataSourceAttributesWithAuth,
              auth: {
                ...mockDataSourceAttributesWithAuth.auth,
                credentials: {
                  username: 'test123',
                  password: encryptedPassword,
                },
              },
            },
            id: 'test1',
            references: [],
            type: DATA_SOURCE_SAVED_OBJECT_TYPE,
          },
        ],
        {}
      );
    });

    it('should create data sources when auth type is present in auth registry', async () => {
      const mockDataSourceAttributes = attributes({
        auth: {
          type: customAuthName,
        },
      });
      await wrapperClient.bulkCreate(
        [
          getSavedObject({
            id: 'test1',
            attributes: mockDataSourceAttributes,
          }),
        ],
        {}
      );
      expect(mockedClient.bulkCreate).toBeCalledWith(
        [
          {
            attributes: mockDataSourceAttributes,
            id: 'test1',
            references: [],
            type: DATA_SOURCE_SAVED_OBJECT_TYPE,
          },
        ],
        {}
      );
    });
  });

  describe('updateWithCredentialsEncryption', () => {
    beforeEach(() => {
      mockedClient.update.mockClear();
    });

    it('should throw error when pass endpoint to update', async () => {
      const id = 'test1';
      await expect(
        wrapperClient.update(DATA_SOURCE_SAVED_OBJECT_TYPE, id, attributes())
      ).rejects.toThrowError(`Updating a dataSource endpoint is not supported`);
    });

    it('should update data source when auth type is present in auth registry', async () => {
      const id = 'test1';
      const mockDataSourceAttributes = attributes({
        auth: {
          type: customAuthName,
        },
      });
      const { endpoint, ...newObject1 } = mockDataSourceAttributes;
      mockedClient.get.mockResolvedValue(
        getSavedObject({
          id: 'test1',
          attributes: mockDataSourceAttributes,
        })
      );
      await wrapperClient.update(DATA_SOURCE_SAVED_OBJECT_TYPE, id, newObject1);
      expect(mockedClient.update).toBeCalledWith(
        expect.stringMatching(DATA_SOURCE_SAVED_OBJECT_TYPE),
        expect.stringMatching(id),
        expect.objectContaining(newObject1),
        expect.anything()
      );
      expect(mockedClient.update).not.toBeCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ endpoint }),
        expect.anything()
      );
    });

    it('should update throw error when auth type is not present in auth registry', async () => {
      const id = 'test1';
      const mockDataSourceAttributes = attributes({
        auth: {
          type: 'not_in_registry',
        },
      });
      const { endpoint, ...newObject1 } = mockDataSourceAttributes;
      mockedClient.get.mockResolvedValue(
        getSavedObject({
          id: 'test1',
          attributes: mockDataSourceAttributes,
        })
      );
      await expect(
        wrapperClient.update(DATA_SOURCE_SAVED_OBJECT_TYPE, id, newObject1)
      ).rejects.toThrowError(`Invalid auth type: 'not_in_registry': Bad Request`);
    });
  });

  describe('bulkUpdateWithCredentialsEncryption', () => {
    beforeEach(() => {
      mockedClient.bulkUpdate.mockClear();
    });

    it('should update data sources when auth type is present in auth registry', async () => {
      const mockDataSourceAttributes = attributes({
        auth: {
          type: customAuthName,
        },
      });
      const { endpoint, ...bulkUpdateObject } = mockDataSourceAttributes;
      mockedClient.get.mockResolvedValue(
        getSavedObject({
          id: 'test1',
          attributes: mockDataSourceAttributes,
        })
      );
      await wrapperClient.bulkUpdate(
        [
          {
            id: 'test1',
            type: DATA_SOURCE_SAVED_OBJECT_TYPE,
            attributes: bulkUpdateObject,
          },
        ],
        {}
      );
      expect(mockedClient.bulkUpdate).toBeCalledWith(
        [
          {
            attributes: bulkUpdateObject,
            id: 'test1',
            type: DATA_SOURCE_SAVED_OBJECT_TYPE,
          },
        ],
        {}
      );
    });

    it('should bulk update throw error when auth type is not present in auth registry', async () => {
      const mockDataSourceAttributes = attributes({
        auth: {
          type: 'not_in_registry',
        },
      });
      const { endpoint, ...bulkUpdateObject } = mockDataSourceAttributes;
      mockedClient.get.mockResolvedValue(
        getSavedObject({
          id: 'test1',
          attributes: mockDataSourceAttributes,
        })
      );
      await expect(
        wrapperClient.bulkUpdate(
          [
            {
              id: 'test1',
              type: DATA_SOURCE_SAVED_OBJECT_TYPE,
              attributes: bulkUpdateObject,
            },
          ],
          {}
        )
      ).rejects.toThrowError(`Invalid auth type: 'not_in_registry': Bad Request`);
    });
  });
});
