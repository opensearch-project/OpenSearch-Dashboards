/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isValidUrl } from '../utils';
import { DATA_SOURCE_VALIDATION_TITLE_EXISTS } from '../text_content';
import { CreateDataSourceState } from '../create_data_source_wizard/components/create_form/create_data_source_form';
import { EditDataSourceState } from '../edit_data_source/components/edit_form/edit_data_source_form';
import { AuthType } from '../../types';

export interface CreateEditDataSourceValidation {
  title: string[];
  endpoint: string[];
  createCredential: {
    username: string[];
    password: string[];
  };
}

export const defaultValidation: CreateEditDataSourceValidation = {
  title: [],
  endpoint: [],
  createCredential: {
    username: [],
    password: [],
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
  if (!title?.trim?.().length) {
    isValid.valid = false;
  } else if (
    title.toLowerCase() !== existingTitle.toLowerCase() &&
    Array.isArray(existingDatasourceNamesList) &&
    existingDatasourceNamesList.includes(title.toLowerCase())
  ) {
    /* title already exists */
    isValid.valid = false;
    isValid.error = DATA_SOURCE_VALIDATION_TITLE_EXISTS;
  }
  return isValid;
};

export const performDataSourceFormValidation = (
  formValues: CreateDataSourceState | EditDataSourceState,
  existingDatasourceNamesList: string[],
  existingTitle: string
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

  /* Username & Password */
  if (formValues?.auth?.type === AuthType.UsernamePasswordType) {
    /* Username */
    if (!formValues.auth.credentials?.username) {
      return false;
    }

    /* password */
    if (!formValues.auth.credentials?.password) {
      return false;
    }
  }

  return true;
};
