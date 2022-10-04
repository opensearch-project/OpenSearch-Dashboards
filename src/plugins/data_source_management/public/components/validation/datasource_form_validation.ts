/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isValidUrl } from '../utils';
import { CreateDataSourceState } from '../create_data_source_wizard/components/create_form/create_data_source_form';
import { AuthType } from '../../types';
import { EditDataSourceState } from '../edit_data_source/components/edit_form/edit_data_source_form';
import {
  DATA_SOURCE_VALIDATION_USERNAME_EMPTY,
  DATA_SOURCE_VALIDATION_PASSWORD_EMPTY,
  DATA_SOURCE_VALIDATION_ENDPOINT_NOT_VALID,
  DATA_SOURCE_VALIDATION_TITLE_EMPTY,
} from '../text_content';

export interface CreateEditDataSourceValidation {
  title: string[];
  endpoint: string[];
  createCredential: {
    username: string[];
    password: string[];
  };
}

export interface UpdatePasswordValidation {
  oldPassword: string[];
  newPassword: string[];
  confirmNewPassword: string[];
}

export const defaultValidation: CreateEditDataSourceValidation = {
  title: [],
  endpoint: [],
  createCredential: {
    username: [],
    password: [],
  },
};
export const defaultPasswordValidationByField: UpdatePasswordValidation = {
  oldPassword: [],
  newPassword: [],
  confirmNewPassword: [],
};

export const performDataSourceFormValidation = (
  formValues: CreateDataSourceState | EditDataSourceState
) => {
  const validationByField: CreateEditDataSourceValidation = {
    title: [],
    endpoint: [],
    createCredential: {
      username: [],
      password: [],
    },
  };
  const formErrorMessages: string[] = [];
  /* Title validation */
  if (!formValues?.title?.trim?.().length) {
    validationByField.title.push(DATA_SOURCE_VALIDATION_TITLE_EMPTY);
    formErrorMessages.push(DATA_SOURCE_VALIDATION_TITLE_EMPTY);
  }

  /* Endpoint Validation */
  if (!isValidUrl(formValues?.endpoint)) {
    validationByField.endpoint.push(DATA_SOURCE_VALIDATION_ENDPOINT_NOT_VALID);
    formErrorMessages.push(DATA_SOURCE_VALIDATION_ENDPOINT_NOT_VALID);
  }

  /* Credential Validation */

  /* Username & Password */
  if (formValues?.auth?.type === AuthType.UsernamePasswordType) {
    /* Username */
    if (!formValues.auth.credentials?.username) {
      validationByField.createCredential.username.push(DATA_SOURCE_VALIDATION_USERNAME_EMPTY);
      formErrorMessages.push(DATA_SOURCE_VALIDATION_USERNAME_EMPTY);
    }

    /* password */
    if (!formValues.auth.credentials?.password) {
      validationByField.createCredential.password.push(DATA_SOURCE_VALIDATION_PASSWORD_EMPTY);
      formErrorMessages.push(DATA_SOURCE_VALIDATION_PASSWORD_EMPTY);
    }
  }

  return {
    formErrors: formErrorMessages,
    formErrorsByField: { ...validationByField },
  };
};
