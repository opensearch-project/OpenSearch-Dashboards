/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { extractRegisteredAuthTypeCredentials, isValidUrl } from '../utils';
import { CreateDataSourceState } from '../create_data_source_wizard/components/create_form/create_data_source_form';
import { EditDataSourceState } from '../edit_data_source/components/edit_form/edit_data_source_form';
import { AuthType } from '../../types';
import { AuthenticationMethodRegistry } from '../../auth_registry';

export interface CreateEditDataSourceValidation {
  title: string[];
  endpoint: string[];
  createCredential: {
    username: string[];
    password: string[];
  };
  awsCredential: {
    region: string[];
    accessKey: string[];
    secretKey: string[];
    service: string[];
  };
}

export const defaultValidation: CreateEditDataSourceValidation = {
  title: [],
  endpoint: [],
  createCredential: {
    username: [],
    password: [],
  },
  awsCredential: {
    region: [],
    accessKey: [],
    secretKey: [],
    service: [],
  },
};

export const isTitleValid = (
  title: string,
  existingDatasourceNamesList: string[],
  existingTitle: string
) => {
  const isValid = {
    valid: true,
    error: '',
  };
  /* Title validation */
  if (!title.trim().length) {
    isValid.valid = false;
  } else if (title.length > 32) {
    /* title length validation */
    isValid.valid = false;
    isValid.error = i18n.translate('dataSourcesManagement.validation.titleLength', {
      defaultMessage: 'Title must be no longer than 32 characters',
    });
  } else if (
    title.toLowerCase() !== existingTitle.toLowerCase() &&
    Array.isArray(existingDatasourceNamesList) &&
    existingDatasourceNamesList.includes(title.toLowerCase())
  ) {
    /* title already exists */
    isValid.valid = false;
    isValid.error = i18n.translate('dataSourcesManagement.validation.titleExists', {
      defaultMessage: 'This title is already in use',
    });
  }
  return isValid;
};

export const performDataSourceFormValidation = (
  formValues: CreateDataSourceState | EditDataSourceState,
  existingDatasourceNamesList: string[],
  existingTitle: string,
  authenticationMethodRegistry: AuthenticationMethodRegistry,
  // The auth type the data source is currently stored with, when editing an existing one.
  // Credentials are stripped on read, so a stored secret arrives blank and must not be treated
  // as missing - but only when there actually is a stored secret of that type to fall back on.
  existingAuthType?: AuthType | string
) => {
  /* Title validation */
  const titleValid = isTitleValid(formValues?.title, existingDatasourceNamesList, existingTitle);

  if (!titleValid.valid) {
    return false;
  }

  /* Endpoint Validation */
  if (!isValidUrl(formValues?.endpoint)) {
    return false;
  }

  /* Credential Validation */

  if (formValues?.auth?.type === AuthType.NoAuth) {
    return true;
  } else if (formValues?.auth?.type === AuthType.UsernamePasswordType) {
    /* Username */
    if (!formValues.auth.credentials?.username) {
      return false;
    }

    /* password */
    if (!formValues.auth.credentials?.password) {
      return false;
    }
  } else if (formValues?.auth?.type === AuthType.SigV4) {
    /* Access key */
    if (!formValues.auth.credentials?.accessKey) {
      return false;
    }

    /* Secret key */
    if (!formValues.auth.credentials?.secretKey) {
      return false;
    }

    /* Region */
    if (!formValues.auth.credentials?.region) {
      return false;
    }

    /* Service Name */
    if (!formValues.auth.credentials?.service) {
      return false;
    }
  } else if (formValues?.auth?.type === AuthType.OAuth2) {
    /* Credentials are stripped when a data source is read (stripCredentials sets
     * auth.credentials to undefined, not just the secret), so in edit mode every OAuth2 field
     * arrives blank. A blank field therefore means "keep the stored value" and must not fail
     * validation, or Save and Test stay disabled for every existing OAuth2 data source before
     * the user has touched anything. Switching an existing data source TO OAuth2 has nothing
     * stored to keep, so there the fields are still required. */
    const isStoredOAuth2 = existingAuthType === AuthType.OAuth2;

    /* Client ID */
    if (!isStoredOAuth2 && !formValues.auth.credentials?.clientId) {
      return false;
    }

    /* Client Secret */
    if (!isStoredOAuth2 && !formValues.auth.credentials?.clientSecret) {
      return false;
    }

    /* Token URL - shape is checked whenever a value is present, the same way endpoint is, so a
     * malformed value is not persisted only to fail later when the token is requested. */
    const tokenUrl = formValues.auth.credentials?.tokenUrl as string | undefined;
    if (!isStoredOAuth2 && !tokenUrl) {
      return false;
    }
    if (tokenUrl && !isValidUrl(tokenUrl)) {
      return false;
    }

    /* scopes, audience and grantType are optional and are intentionally not
     * validated here. Falling through to the registry branch below would reject
     * them when empty, because that branch requires every field declared in
     * credentialFormField to be non-empty. */
  } else {
    const registeredCredentials = extractRegisteredAuthTypeCredentials(
      (formValues?.auth?.credentials ?? {}) as { [key: string]: string },
      formValues?.auth?.type ?? '',
      authenticationMethodRegistry
    );

    for (const credentialValue of Object.values(registeredCredentials)) {
      if (credentialValue.trim().length === 0) {
        return false;
      }
    }
  }

  return true;
};
