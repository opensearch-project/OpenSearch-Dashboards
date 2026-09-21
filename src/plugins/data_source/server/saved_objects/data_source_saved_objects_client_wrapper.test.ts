/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { v4 as uuidv4 } from 'uuid';
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

// Mock dns module to avoid real DNS lookups in tests
jest.mock('dns', () => ({
  promises: {
    lookup: jest.fn(async (hostname: string) => {
      if (hostname === '127.0.0.1') {
        return { address: '127.0.0.1', family: 4 };
      }
      // Default mock IP for any other hostname (e.g., test.com)
      return { address: '1.2.3.4', family: 4 };
    }),
  },
}));

describe('DataSourceSavedObjectsClientWrapper', () => {
  const customAuthName = 'role_based_auth';
  const customAuthMethod = {
    name: customAuthName,
    authType: AuthType.SigV4,
    credentialProvider: jest.fn(),
  };
  jest.mock('../auth_registry');
  const { AuthenticationMethodRegistry: authenticationMethodRegistry } =
    jest.requireActual('../auth_registry');
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
      expect(mockedClient.create).toHaveBeenCalledWith(
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
      expect(mockedClient.create).toHaveBeenCalledWith(
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
      const accessKey = uuidv4();
      const secretKey = uuidv4();
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
      expect(mockedClient.create).toHaveBeenCalledWith(
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

    it('should encrypt only the client secret when auth type is OAuth2', async () => {
      const clientSecret = uuidv4();
      const encryptedClientSecret = `encrypted_${clientSecret}`;
      const mockDataSourceAttributesWithOAuth2 = attributes({
        auth: {
          type: AuthType.OAuth2,
          credentials: {
            clientId: 'test-client-id',
            clientSecret,
            tokenUrl: 'https://auth.test.com/oauth/token',
            scopes: 'read write',
            audience: 'https://api.test.com',
            grantType: 'client_credentials',
          },
        },
      });
      cryptographyMock.encryptAndEncode.mockResolvedValueOnce(
        Promise.resolve(encryptedClientSecret)
      );

      await wrapperClient.create(
        DATA_SOURCE_SAVED_OBJECT_TYPE,
        mockDataSourceAttributesWithOAuth2,
        {}
      );

      // The secret is signed with the endpoint so it cannot be replayed against another one.
      expect(cryptographyMock.encryptAndEncode).toHaveBeenCalledWith(clientSecret, {
        endpoint: 'https://test.com',
      });
      // Only the secret is encrypted: the remaining fields stay usable without a decrypt.
      expect(mockedClient.create).toHaveBeenCalledWith(
        expect.stringMatching(DATA_SOURCE_SAVED_OBJECT_TYPE),
        expect.objectContaining({
          ...mockDataSourceAttributesWithOAuth2,
          auth: {
            ...mockDataSourceAttributesWithOAuth2.auth,
            credentials: {
              ...mockDataSourceAttributesWithOAuth2.auth.credentials,
              clientSecret: encryptedClientSecret,
            },
          },
        }),
        expect.anything()
      );
    });
    it('should not persist an OAuth2 access token supplied alongside the credentials', async () => {
      const mockDataSourceAttributesWithToken = attributes({
        auth: {
          type: AuthType.OAuth2,
          credentials: {
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            tokenUrl: 'https://auth.test.com/oauth/token',
            // A live bearer token is at least as sensitive as the secret and is never read
            // back from the saved object, so it must not be written at all.
            token: 'live-access-token',
          },
        },
      });
      cryptographyMock.encryptAndEncode.mockResolvedValueOnce(Promise.resolve('encrypted'));

      await wrapperClient.create(
        DATA_SOURCE_SAVED_OBJECT_TYPE,
        mockDataSourceAttributesWithToken,
        {}
      );

      const persisted = (mockedClient.create.mock.calls[0][1] as any).auth.credentials;
      expect(persisted).not.toHaveProperty('token');
      expect(persisted.clientId).toBe('test-client-id');
    });

    it('should create data source when auth type is present in auth registry', async () => {
      const mockDataSourceAttributes = attributes({
        auth: {
          type: customAuthName,
        },
      });
      await wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, mockDataSourceAttributes, {});
      expect(mockedClient.create).toHaveBeenCalledWith(
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
      ).rejects.toThrow(`Invalid auth type: 'not_in_registry': Bad Request`);
    });

    describe('createWithCredentialsEncryption: Error handling', () => {
      it('should throw error when title is empty', async () => {
        const mockDataSourceAttributes = attributes({
          title: '',
        });
        await expect(
          wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, mockDataSourceAttributes, {})
        ).rejects.toThrow(`"title" attribute must be a non-empty string`);
      });

      it(`should throw error when title is longer than ${DATA_SOURCE_TITLE_LENGTH_LIMIT} characters`, async () => {
        const mockDataSourceAttributes = attributes({
          title: 'a'.repeat(65),
        });
        await expect(
          wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, mockDataSourceAttributes, {})
        ).rejects.toThrow(
          `"title" attribute is limited to ${DATA_SOURCE_TITLE_LENGTH_LIMIT} characters`
        );
      });

      it('should throw error when endpoint is not valid', async () => {
        const mockDataSourceAttributes = attributes({
          endpoint: 'asasasasas',
        });
        await expect(
          wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, mockDataSourceAttributes, {})
        ).rejects.toThrow(`Invalid URL format`);
      });

      it('should throw error when endpoint is blocked by IP restrictions', async () => {
        const wrapperInstanceWithBlockedIPs = new DataSourceSavedObjectsClientWrapper(
          cryptographyMock,
          logger,
          authRegistryPromise,
          ['127.0.0.0/8', '192.168.1.0/24'] // blocked IPs
        );
        const wrapperClientWithBlockedIPs = wrapperInstanceWithBlockedIPs.wrapperFactory({
          client: mockedClient,
          typeRegistry: requestHandlerContext.savedObjects.typeRegistry,
          request: httpServerMock.createOpenSearchDashboardsRequest(),
        });

        const mockDataSourceAttributes = attributes({
          endpoint: 'http://127.0.0.1:9200',
        });
        await expect(
          wrapperClientWithBlockedIPs.create(
            DATA_SOURCE_SAVED_OBJECT_TYPE,
            mockDataSourceAttributes,
            {}
          )
        ).rejects.toThrow(`Endpoint IP address is not allowed`);
      });

      it('should throw error when auth is not present', async () => {
        await expect(
          wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, attributes(), {})
        ).rejects.toThrow(`"auth" attribute is required`);
      });

      it('should throw error when type field is not present in auth', async () => {
        const mockDataSourceAttributes = attributes({
          auth: {},
        });
        await expect(
          wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, mockDataSourceAttributes, {})
        ).rejects.toThrow(`"auth.type" attribute is required`);
      });

      it('should throw error when credentials are not present in auth when auth type is UsernamePasswordType', async () => {
        const mockDataSourceAttributesWithAuth = attributes({
          auth: {
            type: AuthType.UsernamePasswordType,
          },
        });
        await expect(
          wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, mockDataSourceAttributesWithAuth, {})
        ).rejects.toThrow(`"auth.credentials" attribute is required`);
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
        ).rejects.toThrow(`"auth.credentials.username" attribute is required`);
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
        ).rejects.toThrow(`"auth.credentials.password" attribute is required`);
      });

      it('should throw error when credentials are not present in auth when auth type is SigV4', async () => {
        const mockDataSourceAttributesWithAuth = attributes({
          auth: {
            type: AuthType.SigV4,
          },
        });
        await expect(
          wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, mockDataSourceAttributesWithAuth, {})
        ).rejects.toThrow(`"auth.credentials" attribute is required`);
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
        ).rejects.toThrow(`"auth.credentials.accessKey" attribute is required`);
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
        ).rejects.toThrow(`"auth.credentials.secretKey" attribute is required`);
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
        ).rejects.toThrow(`"auth.credentials.region" attribute is required`);
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
        ).rejects.toThrow(`"auth.credentials.service" attribute is required`);
      });

      it('should throw error when credentials are not present in auth when auth type is OAuth2', async () => {
        const mockDataSourceAttributesWithAuth = attributes({
          auth: {
            type: AuthType.OAuth2,
          },
        });
        await expect(
          wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, mockDataSourceAttributesWithAuth, {})
        ).rejects.toThrow(`"auth.credentials" attribute is required`);
      });

      it('should throw error when clientId is not present in auth when auth type is OAuth2', async () => {
        const mockDataSourceAttributesWithAuth = attributes({
          auth: {
            type: AuthType.OAuth2,
            credentials: {
              clientSecret: 'test',
              tokenUrl: 'https://auth.test.com/oauth/token',
            },
          },
        });
        await expect(
          wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, mockDataSourceAttributesWithAuth, {})
        ).rejects.toThrow(`"auth.credentials.clientId" attribute is required`);
      });

      it('should throw error when clientSecret is not present in auth when auth type is OAuth2', async () => {
        const mockDataSourceAttributesWithAuth = attributes({
          auth: {
            type: AuthType.OAuth2,
            credentials: {
              clientId: 'test',
              tokenUrl: 'https://auth.test.com/oauth/token',
            },
          },
        });
        await expect(
          wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, mockDataSourceAttributesWithAuth, {})
        ).rejects.toThrow(`"auth.credentials.clientSecret" attribute is required`);
      });

      it('should throw error when tokenUrl is not present in auth when auth type is OAuth2', async () => {
        const mockDataSourceAttributesWithAuth = attributes({
          auth: {
            type: AuthType.OAuth2,
            credentials: {
              clientId: 'test',
              clientSecret: 'test',
            },
          },
        });
        await expect(
          wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, mockDataSourceAttributesWithAuth, {})
        ).rejects.toThrow(`"auth.credentials.tokenUrl" attribute is required`);
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
      expect(mockedClient.bulkCreate).toHaveBeenCalledWith(
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
      expect(mockedClient.bulkCreate).toHaveBeenCalledWith(
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
      ).rejects.toThrow(`Updating a dataSource endpoint is not supported`);
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
      expect(mockedClient.update).toHaveBeenCalledWith(
        expect.stringMatching(DATA_SOURCE_SAVED_OBJECT_TYPE),
        expect.stringMatching(id),
        expect.objectContaining(newObject1),
        expect.anything()
      );
      expect(mockedClient.update).not.toHaveBeenCalledWith(
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
      ).rejects.toThrow(`Invalid auth type: 'not_in_registry': Bad Request`);
    });

    const oauth2Credentials = (clientSecret: string) => ({
      clientId: 'test-client-id',
      clientSecret,
      tokenUrl: 'https://auth.test.com/oauth/token',
    });

    it('should encrypt the new client secret when auth type is OAuth2', async () => {
      const id = 'test-oauth2';
      const newClientSecret = 'new-client-secret';
      const newEncryptedSecret = `encrypted_${newClientSecret}`;
      mockedClient.get.mockResolvedValue(
        getSavedObject({
          id,
          attributes: attributes({
            auth: {
              type: AuthType.OAuth2,
              credentials: oauth2Credentials('existing_encrypted_secret'),
            },
          }),
        })
      );
      // The encryption context is recovered from the stored cipher, as for basicauth/sigv4.
      cryptographyMock.decodeAndDecrypt.mockResolvedValueOnce(
        Promise.resolve({
          decryptedText: 'old-client-secret',
          encryptionContext: { endpoint: 'https://test.com' },
        })
      );
      cryptographyMock.encryptAndEncode.mockResolvedValueOnce(Promise.resolve(newEncryptedSecret));

      const { endpoint, ...updateAttributes } = attributes({
        auth: {
          type: AuthType.OAuth2,
          credentials: oauth2Credentials(newClientSecret),
        },
      });
      await wrapperClient.update(DATA_SOURCE_SAVED_OBJECT_TYPE, id, updateAttributes);

      expect(cryptographyMock.encryptAndEncode).toHaveBeenCalledWith(newClientSecret, {
        endpoint: 'https://test.com',
      });
      expect(mockedClient.update).toHaveBeenCalledWith(
        expect.stringMatching(DATA_SOURCE_SAVED_OBJECT_TYPE),
        expect.stringMatching(id),
        expect.objectContaining({
          auth: {
            type: AuthType.OAuth2,
            credentials: oauth2Credentials(newEncryptedSecret),
          },
        }),
        expect.anything()
      );
    });

    it('should not re-encrypt when no client secret is supplied on an OAuth2 update', async () => {
      const id = 'test-oauth2-no-secret';
      mockedClient.get.mockResolvedValue(
        getSavedObject({
          id,
          attributes: attributes({
            auth: {
              type: AuthType.OAuth2,
              credentials: oauth2Credentials('existing_encrypted_secret'),
            },
          }),
        })
      );
      cryptographyMock.decodeAndDecrypt.mockResolvedValueOnce(
        Promise.resolve({
          decryptedText: 'old-client-secret',
          encryptionContext: { endpoint: 'https://test.com' },
        })
      );
      cryptographyMock.encryptAndEncode.mockClear();

      const { endpoint, ...updateAttributes } = attributes({
        auth: {
          type: AuthType.OAuth2,
          credentials: {
            clientId: 'updated-client-id',
            tokenUrl: 'https://auth.test.com/oauth/token',
          },
        },
      });
      await wrapperClient.update(DATA_SOURCE_SAVED_OBJECT_TYPE, id, updateAttributes);

      expect(cryptographyMock.encryptAndEncode).not.toHaveBeenCalled();
      expect(mockedClient.update).toHaveBeenCalledWith(
        expect.stringMatching(DATA_SOURCE_SAVED_OBJECT_TYPE),
        expect.stringMatching(id),
        expect.objectContaining(updateAttributes),
        expect.anything()
      );
    });

    it('should drop a blank client secret so the stored one is not overwritten', async () => {
      const id = 'test-oauth2-blank-secret';
      mockedClient.get.mockResolvedValue(
        getSavedObject({
          id,
          attributes: attributes({
            auth: {
              type: AuthType.OAuth2,
              credentials: oauth2Credentials('existing_encrypted_secret'),
            },
          }),
        })
      );
      cryptographyMock.decodeAndDecrypt.mockResolvedValueOnce(
        Promise.resolve({
          decryptedText: 'old-client-secret',
          encryptionContext: { endpoint: 'https://test.com' },
        })
      );
      cryptographyMock.encryptAndEncode.mockClear();

      // What an edit form round trip submits: credentials are stripped on read, so the form
      // state holds empty strings rather than omitting the field.
      const { endpoint, ...updateAttributes } = attributes({
        auth: {
          type: AuthType.OAuth2,
          credentials: {
            clientId: 'updated-client-id',
            clientSecret: '',
            tokenUrl: 'https://auth.test.com/oauth/token',
          },
        },
      });
      await wrapperClient.update(DATA_SOURCE_SAVED_OBJECT_TYPE, id, updateAttributes);

      expect(cryptographyMock.encryptAndEncode).not.toHaveBeenCalled();

      const written = mockedClient.update.mock.calls[0][2] as any;
      // Writing '' through would replace the stored ciphertext, and the next update would then
      // fail reading its encryption context out of it - leaving no way back but recreating the
      // data source. Omitting the key lets the saved object merge keep the stored value.
      expect(written.auth.credentials).not.toHaveProperty('clientSecret');
      expect(written.auth.credentials).toEqual({
        clientId: 'updated-client-id',
        tokenUrl: 'https://auth.test.com/oauth/token',
      });
    });

    it('should reject switching an existing data source to OAuth2 without a client secret', async () => {
      const id = 'test-oauth2-type-switch';
      // The stored data source is NOT OAuth2 yet, so there is no secret to fall back on.
      mockedClient.get.mockResolvedValue(
        getSavedObject({
          id,
          attributes: attributes({
            auth: {
              type: AuthType.NoAuth,
              credentials: null,
            },
          }),
        })
      );

      // What the edit form submits on an auth-type switch: the client-side drop is gated on the
      // type being unchanged, so a blank clientSecret really does reach the server here.
      const { endpoint, ...updateAttributes } = attributes({
        auth: {
          type: AuthType.OAuth2,
          credentials: {
            clientId: 'test-client-id',
            clientSecret: '',
            tokenUrl: 'https://auth.test.com/oauth/token',
          },
        },
      });

      // Storing an OAuth2 data source with no secret is unrecoverable: every query fails with
      // "credentials are incomplete", and a later update cannot read its encryption context out
      // of the missing ciphertext, so it reports "please delete and create another data source".
      await expect(
        wrapperClient.update(DATA_SOURCE_SAVED_OBJECT_TYPE, id, updateAttributes)
      ).rejects.toThrow('"auth.credentials.clientSecret" is required');
      expect(mockedClient.update).not.toHaveBeenCalled();
    });

    it('should throw error when the stored OAuth2 secret was signed with another endpoint', async () => {
      const id = 'test-oauth2-contaminated';
      mockedClient.get.mockResolvedValue(
        getSavedObject({
          id,
          attributes: attributes({
            auth: {
              type: AuthType.OAuth2,
              credentials: oauth2Credentials('existing_encrypted_secret'),
            },
          }),
        })
      );
      cryptographyMock.decodeAndDecrypt.mockResolvedValueOnce(
        Promise.resolve({
          decryptedText: 'old-client-secret',
          encryptionContext: { endpoint: 'https://another.com' },
        })
      );

      const { endpoint, ...updateAttributes } = attributes({
        auth: {
          type: AuthType.OAuth2,
          credentials: oauth2Credentials('new-client-secret'),
        },
      });
      await expect(
        wrapperClient.update(DATA_SOURCE_SAVED_OBJECT_TYPE, id, updateAttributes)
      ).rejects.toThrow(
        'Failed to update existing data source: "endpoint" contaminated. Please delete and create another data source.'
      );
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
      expect(mockedClient.bulkUpdate).toHaveBeenCalledWith(
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
      ).rejects.toThrow(`Invalid auth type: 'not_in_registry': Bad Request`);
    });
  });
});
