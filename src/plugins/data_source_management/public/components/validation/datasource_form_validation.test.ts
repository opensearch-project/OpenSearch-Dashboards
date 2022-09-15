/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthType } from '../../types';
import { CreateDataSourceState } from '../create_data_source_wizard/components/create_form/create_data_source_form';
import { EditDataSourceState } from '../edit_data_source/components/edit_form/edit_data_source_form';
import {
  defaultValidation,
  performDataSourceFormValidation,
  validateUpdatePassword,
} from './datasource_form_validation';
import { mockDataSourceAttributesWithAuth } from '../../mocks';

describe('DataSourceManagement: Form Validation', () => {
  describe('validate create/edit datasource', () => {
    let form: CreateDataSourceState | EditDataSourceState = {
      formErrors: [],
      formErrorsByField: { ...defaultValidation },
      title: '',
      description: '',
      endpoint: '',
      auth: {
        type: AuthType.UsernamePasswordType,
        credentials: {
          username: '',
          password: '',
        },
      },
    };
    test('should fail validation on all fields', () => {
      const result = performDataSourceFormValidation(form);
      expect(result.formErrors.length).toBe(4);
    });
    test('should NOT fail validation on empty username/password when  No Auth is selected', () => {
      form.auth.type = AuthType.NoAuth;
      const result = performDataSourceFormValidation(form);
      expect(result.formErrors.length).toBe(2);
      expect(result.formErrorsByField.createCredential.username.length).toBe(0);
      expect(result.formErrorsByField.createCredential.password.length).toBe(0);
    });
    test('should NOT fail validation on all fields', () => {
      form = { ...form, ...mockDataSourceAttributesWithAuth };
      const result = performDataSourceFormValidation(form);
      expect(result.formErrors.length).toBe(0);
    });
  });

  describe('validate passwords', () => {
    const passwords = {
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    };
    test('should fail validation for all fields', () => {
      const result = validateUpdatePassword(passwords);
      expect(result.formValidationErrors.length).toBe(2);
    });
    test('should fail validation when passwords do not match', () => {
      passwords.oldPassword = 'test';
      passwords.newPassword = 'test123';
      const result = validateUpdatePassword(passwords);
      expect(result.formValidationErrors.length).toBe(1);
      expect(result.formValidationErrorsByField.confirmNewPassword.length).toBe(1);
    });
    test('should NOT fail validation ', () => {
      passwords.confirmNewPassword = 'test123';
      const result = validateUpdatePassword(passwords);
      expect(result.formValidationErrors.length).toBe(0);
      expect(result.formValidationErrorsByField.confirmNewPassword.length).toBe(0);
    });
  });
});
