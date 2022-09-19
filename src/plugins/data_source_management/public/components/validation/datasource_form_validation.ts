/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isValidUrl } from '../utils';
import { CreateDataSourceState } from '../create_data_source_wizard/components/create_form/create_data_source_form';
import { AuthType } from '../../types';
import { EditDataSourceState } from '../edit_data_source/components/edit_form/edit_data_source_form';
import { UpdatePasswordFormType } from '../../types';
import {
  dataSourceValidationEndpointNotValid,
  dataSourceValidationNewPasswordEmpty,
  dataSourceValidationNoPasswordMatch,
  dataSourceValidationOldPasswordEmpty,
  dataSourceValidationPasswordEmpty,
  dataSourceValidationTitleEmpty,
  dataSourceValidationUsernameEmpty,
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
    validationByField.title.push(dataSourceValidationTitleEmpty);
    formErrorMessages.push(dataSourceValidationTitleEmpty);
  }

  /* Endpoint Validation */
  if (!isValidUrl(formValues?.endpoint)) {
    validationByField.endpoint.push(dataSourceValidationEndpointNotValid);
    formErrorMessages.push(dataSourceValidationEndpointNotValid);
  }

  /* Credential Validation */

  /* Username & Password */
  if (formValues?.auth?.type === AuthType.UsernamePasswordType) {
    /* Username */
    if (!formValues.auth?.credentials?.username) {
      validationByField.createCredential.username.push(dataSourceValidationUsernameEmpty);
      formErrorMessages.push(dataSourceValidationUsernameEmpty);
    }

    /* password */
    if (!formValues.auth?.credentials?.password) {
      validationByField.createCredential.password.push(dataSourceValidationPasswordEmpty);
      formErrorMessages.push(dataSourceValidationPasswordEmpty);
    }
  }

  return {
    formErrors: formErrorMessages,
    formErrorsByField: { ...validationByField },
  };
};

export const validateUpdatePassword = (passwords: UpdatePasswordFormType) => {
  const validationByField: UpdatePasswordValidation = {
    oldPassword: [],
    newPassword: [],
    confirmNewPassword: [],
  };

  const formErrorMessages: string[] = [];

  if (!passwords.oldPassword) {
    validationByField.oldPassword.push(dataSourceValidationOldPasswordEmpty);
    formErrorMessages.push(dataSourceValidationOldPasswordEmpty);
  }
  if (!passwords.newPassword) {
    validationByField.newPassword.push(dataSourceValidationNewPasswordEmpty);
    formErrorMessages.push(dataSourceValidationNewPasswordEmpty);
  } else if (passwords.confirmNewPassword !== passwords.newPassword) {
    validationByField.confirmNewPassword.push(dataSourceValidationNoPasswordMatch);
    formErrorMessages.push(dataSourceValidationNoPasswordMatch);
  }

  return {
    formValidationErrors: formErrorMessages,
    formValidationErrorsByField: { ...validationByField },
  };
};
