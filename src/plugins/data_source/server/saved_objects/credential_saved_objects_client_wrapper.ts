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

import { CredentialMaterialsType, CREDENTIAL_SAVED_OBJECT_TYPE } from '../../common';

/**
 * Describes the Credential Saved Objects Client Wrapper class,
 * which contains the factory used to create Saved Objects Client Wrapper instances
 */
export class CredentialSavedObjectsClientWrapper {
  constructor(private cryptographyClient: CryptographyClient) {}

  /**
   * Describes the factory used to create instances of Saved Objects Client Wrappers
   * for credential spcific operations such as encryption
   * Check {@link Credential.CredentialSavedObjectAttributes} for attributes type details
   * Check {@link Credential.CredentialMaterials} for credential materials type and
   * credential materials content details
   */
  public wrapperFactory: SavedObjectsClientWrapperFactory = (wrapperOptions) => {
    const createWithCredentialMaterialsEncryption = async <T = unknown>(
      type: string,
      attributes: T,
      options?: SavedObjectsCreateOptions
    ) => {
      if (CREDENTIAL_SAVED_OBJECT_TYPE !== type) {
        return await wrapperOptions.client.create(type, attributes, options);
      }

      const encryptedAttributes = await this.validateAndEncryptAttributes(attributes);

      return await wrapperOptions.client.create(type, encryptedAttributes, options);
    };

    const bulkCreateWithCredentialMaterialsEncryption = async <T = unknown>(
      objects: Array<SavedObjectsBulkCreateObject<T>>,
      options?: SavedObjectsCreateOptions
    ): Promise<SavedObjectsBulkResponse<T>> => {
      objects = await Promise.all(
        objects.map(async (object) => {
          const { type, attributes } = object;

          if (CREDENTIAL_SAVED_OBJECT_TYPE !== type) {
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

    const updateWithCredentialMaterialsEncryption = async <T = unknown>(
      type: string,
      id: string,
      attributes: Partial<T>,
      options: SavedObjectsUpdateOptions = {}
    ): Promise<SavedObjectsUpdateResponse<T>> => {
      if (CREDENTIAL_SAVED_OBJECT_TYPE !== type) {
        return await wrapperOptions.client.update(type, id, attributes, options);
      }

      const encryptedAttributes: Partial<T> = await this.validateAndEncryptPartialAttributes(
        attributes
      );

      return await wrapperOptions.client.update(type, id, encryptedAttributes, options);
    };

    const bulkUpdateWithCredentialMaterialsEncryption = async <T = unknown>(
      objects: Array<SavedObjectsBulkUpdateObject<T>>,
      options?: SavedObjectsBulkUpdateOptions
    ): Promise<SavedObjectsBulkUpdateResponse<T>> => {
      objects = await Promise.all(
        objects.map(async (object) => {
          const { type, attributes } = object;

          if (CREDENTIAL_SAVED_OBJECT_TYPE !== type) {
            return object;
          }

          const encryptedAttributes: Partial<T> = await this.validateAndEncryptPartialAttributes(
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
      create: createWithCredentialMaterialsEncryption,
      bulkCreate: bulkCreateWithCredentialMaterialsEncryption,
      checkConflicts: wrapperOptions.client.checkConflicts,
      delete: wrapperOptions.client.delete,
      find: wrapperOptions.client.find,
      bulkGet: wrapperOptions.client.bulkGet,
      get: wrapperOptions.client.get,
      update: updateWithCredentialMaterialsEncryption,
      bulkUpdate: bulkUpdateWithCredentialMaterialsEncryption,
      errors: wrapperOptions.client.errors,
      addToNamespaces: wrapperOptions.client.addToNamespaces,
      deleteFromNamespaces: wrapperOptions.client.deleteFromNamespaces,
    };
  };

  private async validateAndEncryptAttributes<T = unknown>(attributes: T) {
    this.validateAttributes(attributes);

    return await this.encryptCredentialMaterials(attributes);
  }

  private async validateAndEncryptPartialAttributes<T = unknown>(attributes: T) {
    this.validateCredentialMaterials(attributes.credentialMaterials);

    return await this.encryptCredentialMaterials(attributes);
  }

  private validateAttributes<T = unknown>(attributes: T) {
    const { title, credentialMaterials } = attributes;

    if (title === undefined) {
      throw SavedObjectsErrorHelpers.createBadRequestError('attribute "title" required');
    }

    this.validateCredentialMaterials(credentialMaterials);
  }

  private validateCredentialMaterials<T = unknown>(credentialMaterials: T) {
    if (credentialMaterials === undefined) {
      throw SavedObjectsErrorHelpers.createBadRequestError(
        'attribute "credentialMaterials" required'
      );
    }

    const { credentialMaterialsType, credentialMaterialsContent } = credentialMaterials;

    if (credentialMaterialsType === undefined) {
      throw SavedObjectsErrorHelpers.createBadRequestError(
        'attribute "credentialMaterialsType" required for "credentialMaterials"'
      );
    }

    if (credentialMaterialsContent === undefined) {
      throw SavedObjectsErrorHelpers.createBadRequestError(
        'attribute "credentialMaterialsContent" required for "credentialMaterials"'
      );
    }
  }

  private validateUsernamePasswordTypedContent<T = unknown>(credentialMaterialsContent: T) {
    const { username, password } = credentialMaterialsContent;

    if (username === undefined) {
      throw SavedObjectsErrorHelpers.createBadRequestError('attribute "username" required');
    }

    if (password === undefined) {
      throw SavedObjectsErrorHelpers.createBadRequestError('attribute "password" required');
    }

    return;
  }

  private async encryptCredentialMaterials<T = unknown>(attributes: T) {
    const { credentialMaterials } = attributes;

    const { credentialMaterialsType, credentialMaterialsContent } = credentialMaterials;

    switch (credentialMaterialsType) {
      case CredentialMaterialsType.UsernamePasswordType:
        this.validateUsernamePasswordTypedContent(credentialMaterialsContent);
        return {
          ...attributes,
          credentialMaterials: await this.encryptUsernamePasswordTypedCredentialMaterials(
            credentialMaterials
          ),
        };
      default:
        throw SavedObjectsErrorHelpers.createBadRequestError(
          `Invalid credential materials type: '${credentialMaterialsType}'`
        );
    }
  }

  private async encryptUsernamePasswordTypedCredentialMaterials<T = unknown>(
    credentialMaterials: T
  ) {
    const { credentialMaterialsType, credentialMaterialsContent } = credentialMaterials;
    return {
      credentialMaterialsType,
      credentialMaterialsContent: {
        username: credentialMaterialsContent.username,
        password: await this.cryptographyClient.encryptAndEncode(
          credentialMaterialsContent.password
        ),
      },
    };
  }
}
