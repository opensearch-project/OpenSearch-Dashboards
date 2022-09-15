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
  SavedObjectsCreateOptions,
  SavedObjectsUpdateOptions,
  SavedObjectsUpdateResponse,
} from 'opensearch-dashboards/server';

import { SavedObjectsErrorHelpers } from '../../../../core/server';

import { CryptographyClient } from '../cryptography';

import { DATA_SOURCE_SAVED_OBJECT_TYPE } from '../../common';
import { AuthType } from '../../common/data_sources';

/**
 * Describes the Credential Saved Objects Client Wrapper class,
 * which contains the factory used to create Saved Objects Client Wrapper instances
 */
export class DataSourceSavedObjectsClientWrapper {
  constructor(private cryptographyClient: CryptographyClient) {}

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
        attributes
      );

      return await wrapperOptions.client.update(type, id, encryptedAttributes, options);
    };

    const bulkUpdateWithCredentialsEncryption = async <T = unknown>(
      objects: Array<SavedObjectsBulkUpdateObject<T>>,
      options?: SavedObjectsBulkUpdateOptions
    ): Promise<SavedObjectsBulkUpdateResponse<T>> => {
      objects = await Promise.all(
        objects.map(async (object) => {
          const { type, attributes } = object;

          if (DATA_SOURCE_SAVED_OBJECT_TYPE !== type) {
            return object;
          }

          const encryptedAttributes: Partial<T> = await this.validateAndUpdatePartialAttributes(
            attributes
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
      return Boolean(new URL(endpoint));
    } catch (e) {
      return false;
    }
  }

  private async validateAndEncryptAttributes<T = unknown>(attributes: T) {
    this.validateAttributes(attributes);

    const { auth } = attributes;

    switch (auth.type) {
      case AuthType.NoAuth:
        return {
          ...attributes,
          // Drop the credentials attribute for no_auth
          credentials: undefined,
        };
      case AuthType.UsernamePasswordType:
        return {
          ...attributes,
          auth: await this.encryptCredentials(auth),
        };
      default:
        throw SavedObjectsErrorHelpers.createBadRequestError(`Invalid auth type: '${type}'`);
    }
  }

  private async validateAndUpdatePartialAttributes<T = unknown>(attributes: T) {
    const { auth, endpoint } = attributes;

    if (endpoint) {
      throw SavedObjectsErrorHelpers.createBadRequestError(
        `Update data source endpoint is not supported`
      );
    }

    if (auth === undefined) {
      return attributes;
    }

    const { type, credentials } = auth;

    switch (type) {
      case AuthType.NoAuth:
        return {
          ...attributes,
          // Drop the credentials attribute for no_auth
          credentials: undefined,
        };
      case AuthType.UsernamePasswordType:
        if (credentials && credentials.password) {
          return {
            ...attributes,
            auth: await this.encryptCredentials(auth),
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
    if (!title) {
      throw SavedObjectsErrorHelpers.createBadRequestError(
        'attribute "title" required for "data source" saved object'
      );
    }

    if (!this.isValidUrl(endpoint)) {
      throw SavedObjectsErrorHelpers.createBadRequestError(
        'attribute "endpoint" is not valid for "data source" saved object'
      );
    }

    if (auth === undefined) {
      throw SavedObjectsErrorHelpers.createBadRequestError(
        'attribute "auth" required for "data source" saved object'
      );
    }

    this.validateAuth(auth);
  }

  private validateAuth<T = unknown>(auth: T) {
    const { type, credentials } = auth;

    if (!type) {
      throw SavedObjectsErrorHelpers.createBadRequestError(
        'attribute "auth.type" required for "data source" saved object'
      );
    }

    switch (type) {
      case AuthType.NoAuth:
        break;
      case AuthType.UsernamePasswordType:
        if (credentials === undefined) {
          throw SavedObjectsErrorHelpers.createBadRequestError(
            'attribute "auth.credentials" required for "data source" saved object'
          );
        }

        const { username, password } = credentials;

        if (!username) {
          throw SavedObjectsErrorHelpers.createBadRequestError(
            'attribute "auth.credentials.username" required for "data source" saved object'
          );
        }

        if (!password) {
          throw SavedObjectsErrorHelpers.createBadRequestError(
            'attribute "auth.credentials.password" required for "data source" saved object'
          );
        }

        break;
      default:
        throw SavedObjectsErrorHelpers.createBadRequestError(`Invalid auth type: '${type}'`);
    }
  }

  private async encryptCredentials<T = unknown>(auth: T) {
    const {
      credentials: { username, password },
    } = auth;

    return {
      ...auth,
      credentials: {
        username,
        password: await this.cryptographyClient.encryptAndEncode(password),
      },
    };
  }
}
