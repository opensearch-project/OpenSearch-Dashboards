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
import { AuthType } from '../../common/data_sources';
import { EncryptionContext, CryptographyServiceSetup } from '../cryptography_service';

/**
 * Describes the Credential Saved Objects Client Wrapper class,
 * which contains the factory used to create Saved Objects Client Wrapper instances
 */
export class DataSourceSavedObjectsClientWrapper {
  constructor(private cryptography: CryptographyServiceSetup, private logger: Logger) {}

  /**
   * Describes the factory used to create instances of Saved Objects Client Wrappers
   * for data source spcific operations such as credntials encryption
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

  private isValidUrl(endpoint: string) {
    try {
      const url = new URL(endpoint);
      return Boolean(url) && (url.protocol === 'http:' || url.protocol === 'https:');
    } catch (e) {
      return false;
    }
  }

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
        const encryptionContext = {
          endpoint,
        };

        return {
          ...attributes,
          auth: await this.encryptCredentials(auth, encryptionContext),
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
          // Fetch and validate existing signature
          const encryptionContext = await this.validateEncryptionContext(
            wrapperOptions,
            id,
            options
          );

          return {
            ...attributes,
            auth: await this.encryptCredentials(auth, encryptionContext),
          };
        } else {
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

    if (!this.isValidUrl(endpoint)) {
      throw SavedObjectsErrorHelpers.createBadRequestError('"endpoint" attribute is not valid');
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

        const { username, password } = credentials;

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
      default:
        throw SavedObjectsErrorHelpers.createBadRequestError(`Invalid auth type: '${type}'`);
    }
  }

  private async validateEncryptionContext(
    wrapperOptions: SavedObjectsClientWrapperOptions,
    id: string,
    options: SavedObjectsUpdateOptions = {}
  ) {
    let attributes;

    try {
      // Fetch existing data source by id
      const savedObject = await wrapperOptions.client.get(DATA_SOURCE_SAVED_OBJECT_TYPE, id, {
        namespace: options.namespace,
      });
      attributes = savedObject.attributes;
    } catch (err: any) {
      const errMsg = `Failed to fetch existing data source for dataSourceId [${id}]`;
      this.logger.error(errMsg);
      this.logger.error(err);
      throw SavedObjectsErrorHelpers.decorateBadRequestError(err, errMsg);
    }

    if (!attributes) {
      throw SavedObjectsErrorHelpers.createBadRequestError(
        'Update failed due to deprecated data source: "attributes" missing. Please delete and create another data source.'
      );
    }

    const { endpoint, auth } = attributes;

    if (!endpoint) {
      throw SavedObjectsErrorHelpers.createBadRequestError(
        'Update failed due to deprecated data source: "endpoint" missing. Please delete and create another data source.'
      );
    }

    if (!auth) {
      throw SavedObjectsErrorHelpers.createBadRequestError(
        'Update failed due to deprecated data source: "auth" missing. Please delete and create another data source.'
      );
    }

    switch (auth.type) {
      case AuthType.NoAuth:
        // Signing the data source with exsiting endpoint
        return {
          endpoint,
        };
      case AuthType.UsernamePasswordType:
        const { credentials } = auth;
        if (!credentials) {
          throw SavedObjectsErrorHelpers.createBadRequestError(
            'Update failed due to deprecated data source: "credentials" missing. Please delete and create another data source.'
          );
        }

        const { username, password } = credentials;

        if (!username) {
          throw SavedObjectsErrorHelpers.createBadRequestError(
            'Update failed due to deprecated data source: "auth.credentials.username" missing. Please delete and create another data source.'
          );
        }

        if (!password) {
          throw SavedObjectsErrorHelpers.createBadRequestError(
            'Update failed due to deprecated data source: "auth.credentials.username" missing. Please delete and create another data source.'
          );
        }

        const { encryptionContext } = await this.cryptography
          .decodeAndDecrypt(password)
          .catch((err: any) => {
            const errMsg = `Failed to update existing data source for dataSourceId [${id}]: unable to decrypt "auth.credentials.password"`;
            this.logger.error(errMsg);
            this.logger.error(err);
            throw SavedObjectsErrorHelpers.decorateBadRequestError(err, errMsg);
          });

        if (encryptionContext.endpoint !== endpoint) {
          throw SavedObjectsErrorHelpers.createBadRequestError(
            'Update failed due to deprecated data source: "endpoint" contaminated. Please delete and create another data source.'
          );
        }
        return encryptionContext;
      default:
        throw SavedObjectsErrorHelpers.createBadRequestError(`Invalid auth type: '${type}'`);
    }
  }

  private async encryptCredentials<T = unknown>(auth: T, encryptionContext: EncryptionContext) {
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
}
