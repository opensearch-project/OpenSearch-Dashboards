/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SavedObjectsBulkCreateObject,
  SavedObjectsBulkResponse,
  SavedObjectsBulkUpdateObject,
  SavedObjectsBulkUpdateOptions,
  SavedObjectsBulkUpdateResponse,
  SavedObjectsClientWrapperFactory,
  SavedObjectsClientWrapperOptions,
  SavedObjectsCreateOptions,
  SavedObjectsUpdateOptions,
  SavedObjectsUpdateResponse,
} from 'opensearch-dashboards/server';
import { Logger, SavedObjectsErrorHelpers } from '../../../../../src/core/server';
import { DATA_SOURCE_SAVED_OBJECT_TYPE } from '../../common';
import {
  AuthType,
  DataSourceAttributes,
  SigV4Content,
  UsernamePasswordTypedContent,
} from '../../common/data_sources';
import { EncryptionContext, CryptographyServiceSetup } from '../cryptography_service';
import { isValidURL } from '../util/endpoint_validator';

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

    return {
      ...wrapperOptions.client,
      create: createWithCredentialsEncryption,
      bulkCreate: bulkCreateWithCredentialsEncryption,
      checkConflicts: wrapperOptions.client.checkConflicts,
      delete: wrapperOptions.client.delete,
      find: wrapperOptions.client.find,
      bulkGet: wrapperOptions.client.bulkGet,
      get: wrapperOptions.client.get,
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
    private endpointBlockedIps?: string[]
  ) {}

  private async validateAndEncryptAttributes<T = unknown>(attributes: T) {
    this.validateAttributes(attributes);

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
      default:
        throw SavedObjectsErrorHelpers.createBadRequestError(`Invalid auth type: '${auth.type}'`);
    }
  }

  private async validateAndUpdatePartialAttributes<T = unknown>(
    wrapperOptions: SavedObjectsClientWrapperOptions,
    id: string,
    attributes: Partial<T>,
    options: SavedObjectsUpdateOptions = {}
  ) {
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
      default:
        throw SavedObjectsErrorHelpers.createBadRequestError(`Invalid credentials type: '${type}'`);
    }
  }

  private validateAttributes<T = unknown>(attributes: T) {
    const { title, endpoint, auth } = attributes;
    if (!title?.trim?.().length) {
      throw SavedObjectsErrorHelpers.createBadRequestError(
        '"title" attribute must be a non-empty string'
      );
    }

    if (!isValidURL(endpoint, this.endpointBlockedIps)) {
      throw SavedObjectsErrorHelpers.createBadRequestError(
        '"endpoint" attribute is not valid or allowed'
      );
    }

    if (!auth) {
      throw SavedObjectsErrorHelpers.createBadRequestError('"auth" attribute is required');
    }

    this.validateAuth(auth);
  }

  private validateAuth<T = unknown>(auth: T) {
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
      default:
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
      default:
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
}
