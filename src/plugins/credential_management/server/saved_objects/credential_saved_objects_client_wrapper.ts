import {
    HttpServiceStart,
    SavedObjectsClientWrapperFactory,
    SavedObjectsCreateOptions,
    SavedObjectsUpdateOptions,
    SavedObjectsUpdateResponse,
} from 'opensearch-dashboards/server';

import _ from 'lodash';

import { encryptionHandler } from '../credential_manager';
import { CredentialAttributes, EncryptedCredentialAttributes } from '../routes';

export class CredentialSavedObjectsClientWrapper {
  public httpStart?: HttpServiceStart;

  constructor() {}

  public wrapperFactory: SavedObjectsClientWrapperFactory = (wrapperOptions) => {  
    const createWithEncryption = async <T = unknown> (
      type: string,
      attributes: T,
      options?: SavedObjectsCreateOptions
    ) => {
      const { title, credentialType, usernamePasswordCredentialMaterials, awsIamCredentialMaterials } = attributes;
      const encryptedAttributes = {
        title,
        credential_type: credentialType,
        credential_material: await encryptionHandler(
          credentialType,
          usernamePasswordCredentialMaterials,
          awsIamCredentialMaterials
        ),
      };
      return await wrapperOptions.client.create(type, encryptedAttributes, options);
    };

    // const updateWithEncryption = async (
    //   type: string,
    //   id: string,
    //   attributes: Partial<CredentialAttributes>,
    //   options: SavedObjectsUpdateOptions = {}
    // ): Promise<SavedObjectsUpdateResponse<CredentialAttributes>> => {
    //   const { credential_name, credential_type, username_password_credential_materials, aws_iam_credential_materials } = attributes;
    //   const encryptedAttributes = {
    //     title: credential_name,
    //     credential_type,
    //     credential_material: await encryptionHandler(
    //       credential_type,
    //       username_password_credential_materials,
    //       aws_iam_credential_materials
    //     ),
    //   };
    //   return await wrapperOptions.client.update<CredentialAttributes>(type, id, encryptedAttributes, options);
    // };
    
    return {
      ...wrapperOptions.client,
      create: createWithEncryption,
      // update: updateWithEncryption,
      errors: wrapperOptions.client.errors,
    };
  };
}
