/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthType } from '../../types';
import { CreateDataSourceState } from '../create_data_source_wizard/components/create_form/create_data_source_form';
import { EditDataSourceState } from '../edit_data_source/components/edit_form/edit_data_source_form';
import { defaultValidation, performDataSourceFormValidation } from './datasource_form_validation';
import { mockDataSourceAttributesWithAuth } from '../../mocks';

describe('DataSourceManagement: Form Validation', () => {
  describe('validate create/edit datasource', () => {
    let form: CreateDataSourceState | EditDataSourceState = {
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
    test('should fail validation when title is empty', () => {
      const result = performDataSourceFormValidation(form, [], '');
      expect(result).toBe(false);
    });
    test('should fail validation on duplicate title', () => {
      form.title = 'test';
      const result = performDataSourceFormValidation(form, ['oldTitle', 'test'], 'oldTitle');
      expect(result).toBe(false);
    });
    test('should fail validation when endpoint is not valid', () => {
      form.endpoint = mockDataSourceAttributesWithAuth.endpoint;
      const result = performDataSourceFormValidation(form, [], '');
      expect(result).toBe(false);
    });
    test('should fail validation when username is empty', () => {
      form.endpoint = 'test';
      const result = performDataSourceFormValidation(form, [], '');
      expect(result).toBe(false);
    });
    test('should fail validation when password is empty', () => {
      form.auth.credentials.username = 'test';
      form.auth.credentials.password = '';
      const result = performDataSourceFormValidation(form, [], '');
      expect(result).toBe(false);
    });
    test('should NOT fail validation on empty username/password when  No Auth is selected', () => {
      form.auth.type = AuthType.NoAuth;
      form.title = 'test';
      form.endpoint = mockDataSourceAttributesWithAuth.endpoint;
      const result = performDataSourceFormValidation(form, [], '');
      expect(result).toBe(true);
    });
    test('should NOT fail validation on all fields', () => {
      form = { ...form, ...mockDataSourceAttributesWithAuth };
      const result = performDataSourceFormValidation(
        form,
        [mockDataSourceAttributesWithAuth.title],
        mockDataSourceAttributesWithAuth.title
      );
      expect(result).toBe(true);
    });
  });
});
