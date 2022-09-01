/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isValidUrl } from '../utils';
import { CredentialSourceType } from '../../types';
import { CreateEditDataSourceState } from '../create_edit_data_source_wizard/create_edit_data_source_wizard';

export interface CreateEditDataSourceValidation {
  title: string[];
  description: string[];
  endpoint: string[];
  credential: string[];
  createCredential: {
    title: string[];
    description: string[];
    username: string[];
    password: string[];
  };
}

export const defaultValidation: CreateEditDataSourceValidation = {
  title: [],
  description: [],
  endpoint: [],
  credential: [],
  createCredential: {
    title: [],
    description: [],
    username: [],
    password: [],
  },
};

export const performDataSourceFormValidation = (formValues: CreateEditDataSourceState) => {
  const validationByField: CreateEditDataSourceValidation = {
    title: [],
    description: [],
    endpoint: [],
    credential: [],
    createCredential: {
      title: [],
      description: [],
      username: [],
      password: [],
    },
  };
  const formErrorMessages: string[] = [];
  /* Title validation */
  if (!formValues.dataSourceTitle) {
    validationByField.title.push('Title should not be empty');
    formErrorMessages.push('Title should not be empty');
  }
  /* Description Validation */
  if (!formValues.dataSourceDescription) {
    validationByField.description.push('Description should not be empty');
    formErrorMessages.push('Description should not be empty');
  }
  /* Endpoint Validation */
  if (!isValidUrl(formValues.endpoint)) {
    validationByField.endpoint.push('Endpoint is not valid');
    formErrorMessages.push('Endpoint is not valid');
  }

  /* Credential Validation */
  /*  Existing Credential */

  if (!formValues.selectedCredentialSourceType) {
    validationByField.credential.push('Please associate a credential');
    formErrorMessages.push('Please associate a credential');
  }

  if (
    formValues.selectedCredentialSourceType === CredentialSourceType.ExistingCredential &&
    !formValues.selectedCredentials?.length
  ) {
    validationByField.credential.push('Please associate a credential');
    formErrorMessages.push('Please associate a credential');
  }

  /* Create new credentials */
  if (formValues.selectedCredentialSourceType === CredentialSourceType.CreateCredential) {
    /* title */
    if (!formValues.createCredential.title) {
      validationByField.createCredential.title.push('Title should not be empty');
      formErrorMessages.push('New credential - Title should not be empty');
    }

    /* description */
    if (!formValues.createCredential.description) {
      validationByField.createCredential.description.push('Description should not be empty');
      formErrorMessages.push('New credential - Description should not be empty');
    }

    /* Username */
    if (!formValues.createCredential.credentialMaterials.credentialMaterialsContent.username) {
      validationByField.createCredential.username.push('Username should not be empty');
      formErrorMessages.push('New credential - Username should not be empty');
    }

    /* password */
    if (!formValues.createCredential.credentialMaterials.credentialMaterialsContent.password) {
      validationByField.createCredential.password.push('Password should not be empty');
      formErrorMessages.push('New credential - Password should not be empty');
    }
  }

  return {
    formErrors: formErrorMessages,
    formErrorsByField: { ...validationByField },
  };
};
