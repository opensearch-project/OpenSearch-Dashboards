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
import { CredentialsType } from '../../common/data_sources';

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

  private dropCredentials<T = unknown>(attributes: Omit<T, 'credentials'>) {
    return attributes;
  }

  private async validateAndEncryptAttributes<T = unknown>(attributes: T) {
    this.validateAttributes(attributes);

    const { noAuth } = attributes;

    // Drop credentials when no Auth
    if (!noAuth) {
      return this.dropCredentials(attributes);
    }

    const { type, credentialsContent } = attributes.credentials;

    switch (type) {
      case CredentialsType.UsernamePasswordType:
        const { username, password } = credentialsContent;
        return {
          ...attributes,
          credentials: {
            type,
            credentialsContent: {
              username,
              password: await this.cryptographyClient.encryptAndEncode(password),
            },
          },
        };
      default:
        throw SavedObjectsErrorHelpers.createBadRequestError(
          `Invalid credential materials type: '${type}'`
        );
    }
  }

  private async validateAndUpdatePartialAttributes<T = unknown>(attributes: T) {
    const { noAuth, credentials } = attributes;

    // Drop credentials when no Auth
    if (!noAuth) {
      return this.dropCredentials(attributes);
    }

    const { type, credentialsContent } = credentials;

    switch (type) {
      case CredentialsType.UsernamePasswordType:
        if ('password' in credentialsContent) {
          const { username, password } = credentialsContent;
          return {
            ...attributes,
            credentials: {
              type,
              credentialsContent: {
                username,
                password: await this.cryptographyClient.encryptAndEncode(password),
              },
            },
          };
        } else {
          return attributes;
        }
      default:
        throw SavedObjectsErrorHelpers.createBadRequestError(`Invalid credentials type: '${type}'`);
    }
  }

  private validateAttributes<T = unknown>(attributes: T) {
    const { title, endpoint, noAuth, credentials } = attributes;
    if (!title) {
      throw SavedObjectsErrorHelpers.createBadRequestError('attribute "title" required');
    }

    if (!this.isValidUrl(endpoint)) {
      throw SavedObjectsErrorHelpers.createBadRequestError('attribute "endpoint" is not valid');
    }

    if (noAuth) {
      this.validateCredentials(credentials);
    }
  }

  private validateCredentials<T = unknown>(credentials: T) {
    if (credentials === undefined) {
      throw SavedObjectsErrorHelpers.createBadRequestError('attribute "credentials" required');
    }

    const { type, credentialsContent } = credentials;

    if (!type) {
      throw SavedObjectsErrorHelpers.createBadRequestError(
        'attribute "type" required for "credentials"'
      );
    }

    if (credentialsContent === undefined) {
      throw SavedObjectsErrorHelpers.createBadRequestError(
        'attribute "credentialsContent" required for "credentials"'
      );
    }

    switch (type) {
      case CredentialsType.UsernamePasswordType:
        const { username, password } = credentialsContent;

        this.validateUsername(username);
        this.validatePassword(password);
      default:
        throw SavedObjectsErrorHelpers.createBadRequestError(`Invalid credentials type: '${type}'`);
    }
  }

  private validateUsername<T = unknown>(username: T) {
    if (!username) {
      throw SavedObjectsErrorHelpers.createBadRequestError('attribute "username" required');
    }
    return;
  }

  private validatePassword<T = unknown>(password: T) {
    if (!password) {
      throw SavedObjectsErrorHelpers.createBadRequestError('attribute "password" required');
    }
    return;
  }
}
