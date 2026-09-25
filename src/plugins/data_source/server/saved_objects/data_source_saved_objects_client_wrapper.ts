/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SavedObjectsBulkCreateObject,
  SavedObjectsBulkGetObject,
  SavedObjectsBulkResponse,
  SavedObjectsBulkUpdateObject,
  SavedObjectsBulkUpdateOptions,
  SavedObjectsBulkUpdateResponse,
  SavedObjectsClientWrapperFactory,
  SavedObjectsClientWrapperOptions,
  SavedObjectsCreateOptions,
  SavedObjectsFindOptions,
  SavedObjectsFindResponse,
  SavedObjectsUpdateOptions,
  SavedObjectsUpdateResponse,
} from 'opensearch-dashboards/server';
import { Logger, SavedObjectsErrorHelpers } from '../../../../../src/core/server';
import { DATA_SOURCE_SAVED_OBJECT_TYPE } from '../../common';
import {
  AuthType,
  DataSourceAttributes,
  OAuth2Content,
  SigV4Content,
  UsernamePasswordTypedContent,
} from '../../common/data_sources';
import { EncryptionContext, CryptographyServiceSetup } from '../cryptography_service';
import { isValidURL } from '../util/endpoint_validator';
import { IAuthenticationMethodRegistry } from '../auth_registry';
import { DATA_SOURCE_TITLE_LENGTH_LIMIT } from '../util/constants';

/**
 * Describes the Credential Saved Objects Client Wrapper class,
 * which contains the factory used to create Saved Objects Client Wrapper instances
 */
export class DataSourceSavedObjectsClientWrapper {
  /**
   * Describes the factory used to create instances of Saved Objects Client Wrappers
   * for data source specific operations such as credentials encryption
   */
  public wrapperFactory: SavedObjectsClientWrapperFactory = (wrapperOptions) => {
    const createWithCredentialsEncryption = async <T = unknown>(
      type: string,
      attributes: T,
      options?: SavedObjectsCreateOptions
    ) => {
      if (DATA_SOURCE_SAVED_OBJECT_TYPE !== type) {
        return await wrapperOptions.client.create(type, attributes, options);
      }

      const encryptedAttributes = await this.validateAndEncryptAttributes(attributes);

      return await wrapperOptions.client.create(type, encryptedAttributes, options);
    };

    const bulkCreateWithCredentialsEncryption = async <T = unknown>(
      objects: Array<SavedObjectsBulkCreateObject<T>>,
      options?: SavedObjectsCreateOptions
    ): Promise<SavedObjectsBulkResponse<T>> => {
      objects = await Promise.all(
        objects.map(async (object) => {
          const { type, attributes } = object;

          if (DATA_SOURCE_SAVED_OBJECT_TYPE !== type) {
            return object;
          }

          return {
            ...object,
            attributes: await this.validateAndEncryptAttributes(attributes),
          };
        })
      );
      return await wrapperOptions.client.bulkCreate(objects, options);
    };

    const updateWithCredentialsEncryption = async <T = unknown>(
      type: string,
      id: string,
      attributes: Partial<T>,
      options: SavedObjectsUpdateOptions = {}
    ): Promise<SavedObjectsUpdateResponse<T>> => {
      if (DATA_SOURCE_SAVED_OBJECT_TYPE !== type) {
        return await wrapperOptions.client.update(type, id, attributes, options);
      }

      const encryptedAttributes: Partial<T> = await this.validateAndUpdatePartialAttributes(
        wrapperOptions,
        id,
        attributes,
        options
      );

      return await wrapperOptions.client.update(type, id, encryptedAttributes, options);
    };

    const bulkUpdateWithCredentialsEncryption = async <T = unknown>(
      objects: Array<SavedObjectsBulkUpdateObject<T>>,
      options?: SavedObjectsBulkUpdateOptions
    ): Promise<SavedObjectsBulkUpdateResponse<T>> => {
      objects = await Promise.all(
        objects.map(async (object) => {
          const { id, type, attributes } = object;

          if (DATA_SOURCE_SAVED_OBJECT_TYPE !== type) {
            return object;
          }

          const encryptedAttributes: Partial<T> = await this.validateAndUpdatePartialAttributes(
            wrapperOptions,
            id,
            attributes,
            // @ts-expect-error TS2345 TODO(ts-error): fixme
            options
          );

          return {
            ...object,
            attributes: encryptedAttributes,
          };
        })
      );

      return await wrapperOptions.client.bulkUpdate(objects, options);
    };

    const getWithCredentialsStripping = async <T = unknown>(
      type: string,
      id: string,
      options?: Record<string, any>
    ) => {
      const result = await wrapperOptions.client.get<T>(type, id, options);
      if (type === DATA_SOURCE_SAVED_OBJECT_TYPE) {
        return stripCredentials(result);
      }
      return result;
    };

    const findWithCredentialsStripping = async <T = unknown>(
      options: SavedObjectsFindOptions
    ): Promise<SavedObjectsFindResponse<T>> => {
      const result = await wrapperOptions.client.find<T>(options);
      const types = Array.isArray(options.type) ? options.type : [options.type];
      if (types.includes(DATA_SOURCE_SAVED_OBJECT_TYPE)) {
        return {
          ...result,
          saved_objects: result.saved_objects.map((obj) =>
            obj.type === DATA_SOURCE_SAVED_OBJECT_TYPE ? stripCredentials(obj) : obj
          ),
        };
      }
      return result;
    };

    const bulkGetWithCredentialsStripping = async <T = unknown>(
      objects?: SavedObjectsBulkGetObject[]
    ) => {
      const result = await wrapperOptions.client.bulkGet<T>(objects);
      return {
        ...result,
        saved_objects: result.saved_objects.map((obj) =>
          obj.type === DATA_SOURCE_SAVED_OBJECT_TYPE ? stripCredentials(obj) : obj
        ),
      };
    };

    return {
      ...wrapperOptions.client,
      create: createWithCredentialsEncryption,
      bulkCreate: bulkCreateWithCredentialsEncryption,
      checkConflicts: wrapperOptions.client.checkConflicts,
      delete: wrapperOptions.client.delete,
      find: findWithCredentialsStripping,
      bulkGet: bulkGetWithCredentialsStripping,
      get: getWithCredentialsStripping,
      update: updateWithCredentialsEncryption,
      bulkUpdate: bulkUpdateWithCredentialsEncryption,
      errors: wrapperOptions.client.errors,
      addToNamespaces: wrapperOptions.client.addToNamespaces,
      deleteFromNamespaces: wrapperOptions.client.deleteFromNamespaces,
    };
  };

  constructor(
    private cryptography: CryptographyServiceSetup,
    private logger: Logger,
    private authRegistryPromise: Promise<IAuthenticationMethodRegistry>,
    private endpointBlockedIps?: string[],
    private endpointAllowlistedSuffixes?: string[]
  ) {}

  private async validateAndEncryptAttributes<T = unknown>(attributes: T) {
    await this.validateAttributes(attributes);

    // @ts-expect-error TS2339 TODO(ts-error): fixme
    const { endpoint, auth } = attributes;

    switch (auth.type) {
      case AuthType.NoAuth:
        return {
          ...attributes,
          // Drop the credentials attribute for no_auth
          auth: {
            type: auth.type,
            credentials: undefined,
          },
        };
      case AuthType.UsernamePasswordType:
        // Signing the data source with endpoint
        return {
          ...attributes,
          auth: await this.encryptBasicAuthCredential(auth, { endpoint }),
        };
      case AuthType.SigV4:
        return {
          ...attributes,
          auth: await this.encryptSigV4Credential(auth, { endpoint }),
        };
      case AuthType.OAuth2:
        // Signing the client secret with the endpoint, as for the other auth types
        return {
          ...attributes,
          auth: await this.encryptOAuth2Credential(auth, { endpoint }),
        };
      default:
        if (await this.isAuthTypeAvailableInRegistry(auth.type)) {
          return attributes;
        }
        throw SavedObjectsErrorHelpers.createBadRequestError(`Invalid auth type: '${auth.type}'`);
    }
  }

  private async validateAndUpdatePartialAttributes<T = unknown>(
    wrapperOptions: SavedObjectsClientWrapperOptions,
    id: string,
    attributes: Partial<T>,
    options: SavedObjectsUpdateOptions = {}
  ) {
    // @ts-expect-error TS2339 TODO(ts-error): fixme
    const { auth, endpoint } = attributes;

    if (endpoint) {
      throw SavedObjectsErrorHelpers.createBadRequestError(
        `Updating a dataSource endpoint is not supported`
      );
    }

    if (!auth) {
      return attributes;
    }

    const { type, credentials } = auth;
    const existingDataSourceAttr = await this.getDataSourceAttributes(wrapperOptions, id, options);
    const encryptionContext = await this.getEncryptionContext(existingDataSourceAttr);

    switch (type) {
      case AuthType.NoAuth:
        return {
          ...attributes,
          // Drop the credentials attribute for no_auth
          auth: {
            type: auth.type,
            credentials: null,
          },
        };
      case AuthType.UsernamePasswordType:
        if (credentials?.password) {
          this.validateEncryptionContext(encryptionContext, existingDataSourceAttr);
          return {
            ...attributes,
            auth: await this.encryptBasicAuthCredential(auth, encryptionContext),
          };
        } else {
          return attributes;
        }
      case AuthType.SigV4:
        this.validateEncryptionContext(encryptionContext, existingDataSourceAttr);
        if (credentials?.accessKey && credentials?.secretKey) {
          return {
            ...attributes,
            auth: await this.encryptSigV4Credential(auth, encryptionContext),
          };
        } else {
          if (credentials?.accessKey) {
            throw SavedObjectsErrorHelpers.createBadRequestError(
              `Failed to update existing data source with auth type ${type}: "credentials.secretKey" missing.`
            );
          }

          if (credentials?.secretKey) {
            throw SavedObjectsErrorHelpers.createBadRequestError(
              `Failed to update existing data source with auth type ${type}: "credentials.accessKey" missing.`
            );
          }
          return attributes;
        }
      case AuthType.OAuth2: {
        // Only re-encrypt when a new secret is supplied; the other OAuth2 fields are
        // stored in plain text and can be updated on their own.
        if (credentials?.clientSecret) {
          this.validateEncryptionContext(encryptionContext, existingDataSourceAttr);
          return {
            ...attributes,
            auth: await this.encryptOAuth2Credential(auth, encryptionContext),
          };
        }

        // Changing an existing data source to OAuth2 has to carry a secret: there is no stored
        // OAuth2 secret to fall back on, and validateAuth only runs on create. Accepting a
        // blank one here would store a data source that can never authenticate
        // (extractOAuth2Config rejects it) and can never be repaired either, because the next
        // update reads its encryption context out of the ciphertext that is now missing.
        if (existingDataSourceAttr.auth?.type !== AuthType.OAuth2) {
          throw SavedObjectsErrorHelpers.createBadRequestError(
            '"auth.credentials.clientSecret" is required when changing a data source to OAuth2'
          );
        }

        // No new secret supplied, so the stored one must survive untouched. Saved object
        // updates merge recursively: an absent clientSecret keeps the stored ciphertext, but
        // an empty string overwrites it. Credentials are stripped on read, so an edit form
        // round trip submits blank strings - drop the key here instead of relying on callers
        // to omit it.
        const { clientSecret: blankClientSecret, ...credentialsToKeep } = (credentials ??
          {}) as Record<string, unknown>;

        return {
          ...attributes,
          auth: {
            ...auth,
            credentials: credentialsToKeep,
          },
        };
      }
      default:
        if (await this.isAuthTypeAvailableInRegistry(auth.type)) {
          return attributes;
        }
        throw SavedObjectsErrorHelpers.createBadRequestError(`Invalid credentials type: '${type}'`);
    }
  }

  private async validateAttributes<T = unknown>(attributes: T) {
    // @ts-expect-error TS2339 TODO(ts-error): fixme
    const { title, endpoint, auth } = attributes;
    this.validateTitle(title);
    await this.validateEndpoint(endpoint);
    await this.validateAuth(auth);
  }

  private async validateEndpoint(endpoint: string) {
    const validationResult = await isValidURL(
      endpoint,
      this.endpointBlockedIps,
      this.endpointAllowlistedSuffixes
    );
    if (!validationResult.valid) {
      // Log detailed error for server-side debugging
      this.logger.error(`Endpoint validation failed for ${endpoint}: ${validationResult.error}`);

      // Throw error with safe user message
      throw SavedObjectsErrorHelpers.createBadRequestError(
        validationResult.userMessage || 'Endpoint URL validation failed'
      );
    }
  }

  private validateTitle(title: string) {
    if (!title.trim().length) {
      throw SavedObjectsErrorHelpers.createBadRequestError(
        '"title" attribute must be a non-empty string'
      );
    }

    if (title.length > DATA_SOURCE_TITLE_LENGTH_LIMIT) {
      throw SavedObjectsErrorHelpers.createBadRequestError(
        `"title" attribute is limited to ${DATA_SOURCE_TITLE_LENGTH_LIMIT} characters`
      );
    }
  }

  private async validateAuth<T = unknown>(auth: T) {
    if (!auth) {
      throw SavedObjectsErrorHelpers.createBadRequestError('"auth" attribute is required');
    }

    // @ts-expect-error TS2339 TODO(ts-error): fixme
    const { type, credentials } = auth;

    if (!type) {
      throw SavedObjectsErrorHelpers.createBadRequestError('"auth.type" attribute is required');
    }

    switch (type) {
      case AuthType.NoAuth:
        break;
      case AuthType.UsernamePasswordType:
        if (!credentials) {
          throw SavedObjectsErrorHelpers.createBadRequestError(
            '"auth.credentials" attribute is required'
          );
        }

        const { username, password } = credentials as UsernamePasswordTypedContent;

        if (!username) {
          throw SavedObjectsErrorHelpers.createBadRequestError(
            '"auth.credentials.username" attribute is required'
          );
        }

        if (!password) {
          throw SavedObjectsErrorHelpers.createBadRequestError(
            '"auth.credentials.password" attribute is required'
          );
        }
        break;
      case AuthType.SigV4:
        if (!credentials) {
          throw SavedObjectsErrorHelpers.createBadRequestError(
            '"auth.credentials" attribute is required'
          );
        }

        const { accessKey, secretKey, region, service } = credentials as SigV4Content;

        if (!accessKey) {
          throw SavedObjectsErrorHelpers.createBadRequestError(
            '"auth.credentials.accessKey" attribute is required'
          );
        }

        if (!secretKey) {
          throw SavedObjectsErrorHelpers.createBadRequestError(
            '"auth.credentials.secretKey" attribute is required'
          );
        }

        if (!region) {
          throw SavedObjectsErrorHelpers.createBadRequestError(
            '"auth.credentials.region" attribute is required'
          );
        }

        if (!service) {
          throw SavedObjectsErrorHelpers.createBadRequestError(
            '"auth.credentials.service" attribute is required'
          );
        }
        break;
      case AuthType.OAuth2:
        if (!credentials) {
          throw SavedObjectsErrorHelpers.createBadRequestError(
            '"auth.credentials" attribute is required'
          );
        }

        const { clientId, clientSecret, tokenUrl } = credentials as OAuth2Content;

        if (!clientId) {
          throw SavedObjectsErrorHelpers.createBadRequestError(
            '"auth.credentials.clientId" attribute is required'
          );
        }

        if (!clientSecret) {
          throw SavedObjectsErrorHelpers.createBadRequestError(
            '"auth.credentials.clientSecret" attribute is required'
          );
        }

        if (!tokenUrl) {
          throw SavedObjectsErrorHelpers.createBadRequestError(
            '"auth.credentials.tokenUrl" attribute is required'
          );
        }
        break;
      default:
        if (await this.isAuthTypeAvailableInRegistry(type)) {
          break;
        }
        throw SavedObjectsErrorHelpers.createBadRequestError(`Invalid auth type: '${type}'`);
    }
  }

  private async getEncryptionContext(attributes: DataSourceAttributes) {
    let encryptionContext: EncryptionContext;

    if (!attributes) {
      throw SavedObjectsErrorHelpers.createBadRequestError(
        'Failed to update existing data source: "attributes" missing. Please delete and create another data source.'
      );
    }

    const { endpoint, auth } = attributes;

    if (!endpoint) {
      throw SavedObjectsErrorHelpers.createBadRequestError(
        'Failed to update existing data source: "endpoint" missing. Please delete and create another data source.'
      );
    }

    if (!auth) {
      throw SavedObjectsErrorHelpers.createBadRequestError(
        'Failed to update existing data source: "auth" missing. Please delete and create another data source.'
      );
    }

    switch (auth.type) {
      case AuthType.NoAuth:
        // Signing the data source with existing endpoint
        encryptionContext = { endpoint };
        break;
      case AuthType.UsernamePasswordType:
        const { credentials } = auth;
        if (!credentials) {
          throw SavedObjectsErrorHelpers.createBadRequestError(
            'Failed to update existing data source: "credentials" missing. Please delete and create another data source.'
          );
        }

        const { username, password } = credentials as UsernamePasswordTypedContent;

        if (!username) {
          throw SavedObjectsErrorHelpers.createBadRequestError(
            'Failed to update existing data source: "auth.credentials.username" missing. Please delete and create another data source.'
          );
        }

        if (!password) {
          throw SavedObjectsErrorHelpers.createBadRequestError(
            'Failed to update existing data source: "auth.credentials.password" missing. Please delete and create another data source.'
          );
        }
        encryptionContext = await this.getEncryptionContextFromCipher(password);
        break;
      case AuthType.SigV4:
        const { accessKey, secretKey } = auth.credentials as SigV4Content;
        const accessKeyEncryptionContext = await this.getEncryptionContextFromCipher(accessKey);
        const secretKeyEncryptionContext = await this.getEncryptionContextFromCipher(secretKey);

        if (accessKeyEncryptionContext.endpoint !== secretKeyEncryptionContext.endpoint) {
          throw SavedObjectsErrorHelpers.createBadRequestError(
            'Failed to update existing data source: encryption contexts for "auth.credentials.accessKey" and "auth.credentials.secretKey" must be same. Please delete and create another data source.'
          );
        }
        encryptionContext = accessKeyEncryptionContext;
        break;
      case AuthType.OAuth2:
        // The client secret is the only encrypted OAuth2 field, so it carries the context.
        const { clientSecret: storedClientSecret } = auth.credentials as OAuth2Content;

        if (!storedClientSecret) {
          throw SavedObjectsErrorHelpers.createBadRequestError(
            'Failed to update existing data source: "auth.credentials.clientSecret" missing. Please delete and create another data source.'
          );
        }
        encryptionContext = await this.getEncryptionContextFromCipher(storedClientSecret);
        break;
      default:
        if (await this.isAuthTypeAvailableInRegistry(auth.type)) {
          return attributes;
        }
        throw SavedObjectsErrorHelpers.createBadRequestError(`Invalid auth type: '${auth.type}'`);
    }

    return encryptionContext;
  }

  private async getDataSourceAttributes(
    wrapperOptions: SavedObjectsClientWrapperOptions,
    id: string,
    options: SavedObjectsUpdateOptions = {}
  ): Promise<DataSourceAttributes> {
    try {
      // Fetch existing data source by id
      const savedObject = await wrapperOptions.client.get(DATA_SOURCE_SAVED_OBJECT_TYPE, id, {
        namespace: options.namespace,
      });
      return savedObject.attributes as DataSourceAttributes;
    } catch (err: any) {
      const errMsg = `Failed to fetch existing data source for dataSourceId [${id}]`;
      this.logger.error(`${errMsg}: ${err} ${err.stack}`);
      throw SavedObjectsErrorHelpers.decorateBadRequestError(err, errMsg);
    }
  }

  private validateEncryptionContext = (
    encryptionContext: EncryptionContext,
    dataSource: DataSourceAttributes
  ) => {
    // validate encryption context
    if (encryptionContext.endpoint !== dataSource.endpoint) {
      throw SavedObjectsErrorHelpers.createBadRequestError(
        'Failed to update existing data source: "endpoint" contaminated. Please delete and create another data source.'
      );
    }
  };

  private async getEncryptionContextFromCipher(cipher: string) {
    const { encryptionContext } = await this.cryptography
      .decodeAndDecrypt(cipher)
      .catch((err: any) => {
        const errMsg = `Failed to update existing data source: unable to decrypt auth content`;
        this.logger.error(`${errMsg}: ${err} ${err.stack}`);
        throw SavedObjectsErrorHelpers.decorateBadRequestError(err, errMsg);
      });

    return encryptionContext;
  }

  private async encryptBasicAuthCredential<T = unknown>(
    auth: T,
    encryptionContext: EncryptionContext
  ) {
    const {
      // @ts-expect-error TS2339 TODO(ts-error): fixme
      credentials: { username, password },
    } = auth;

    return {
      ...auth,
      credentials: {
        username,
        password: await this.cryptography.encryptAndEncode(password, encryptionContext),
      },
    };
  }

  private async encryptSigV4Credential<T = unknown>(auth: T, encryptionContext: EncryptionContext) {
    const {
      // @ts-expect-error TS2339 TODO(ts-error): fixme
      credentials: { accessKey, secretKey, region, service },
    } = auth;

    return {
      ...auth,
      credentials: {
        region,
        accessKey: await this.cryptography.encryptAndEncode(accessKey, encryptionContext),
        secretKey: await this.cryptography.encryptAndEncode(secretKey, encryptionContext),
        service,
      },
    };
  }

  /**
   * Encrypts the OAuth2 client secret before it is persisted. Only the client secret is
   * sensitive: clientId, tokenUrl, scopes, audience and grantType stay in plain text so
   * they remain usable for token requests and cache keys without a decryption round trip.
   *
   * The fields are listed explicitly rather than spread, matching the basicauth and sigv4
   * helpers. That drops anything else the caller sent — in particular OAuth2Content.token,
   * a live bearer token which is never read back from the saved object and so must not be
   * written to it at all.
   */
  private async encryptOAuth2Credential<T = unknown>(
    auth: T,
    encryptionContext: EncryptionContext
  ) {
    const {
      // @ts-expect-error TS2339 TODO(ts-error): fixme
      credentials: { clientId, clientSecret, tokenUrl, scopes, audience, grantType },
    } = auth;

    return {
      ...auth,
      credentials: {
        clientId,
        clientSecret: await this.cryptography.encryptAndEncode(clientSecret, encryptionContext),
        tokenUrl,
        scopes,
        audience,
        grantType,
      },
    };
  }

  private async getAuthenticationMethodFromRegistry(type: string) {
    const authMethod = (await this.authRegistryPromise).getAuthenticationMethod(type);
    return authMethod;
  }

  private async isAuthTypeAvailableInRegistry(type: string): Promise<boolean> {
    const authMethod = await this.getAuthenticationMethodFromRegistry(type);
    return authMethod !== undefined;
  }
}

/**
 * Strip auth.credentials from a data source saved object before returning it
 * through external read APIs (get / find / bulkGet). Credentials are encrypted
 * at rest and must never be exposed to callers via the saved objects API.
 * configureClient / configureLegacyClient retrieve credentials via an internal
 * repository that bypasses this wrapper.
 */
function stripCredentials<T = unknown>(obj: any): any {
  if (!obj?.attributes?.auth) return obj;
  return {
    ...obj,
    attributes: {
      ...obj.attributes,
      auth: {
        ...obj.attributes.auth,
        credentials: undefined,
      },
    },
  };
}
