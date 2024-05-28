/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthType } from '../../types';
import { CreateDataSourceState } from '../create_data_source_wizard/components/create_form/create_data_source_form';
import { EditDataSourceState } from '../edit_data_source/components/edit_form/edit_data_source_form';
import { defaultValidation, performDataSourceFormValidation } from './datasource_form_validation';
import {
  mockDataSourceAttributesWithAuth,
  mockDataSourceAttributesWithSigV4Auth,
} from '../../mocks';
import { AuthenticationMethod, AuthenticationMethodRegistry } from '../../auth_registry';

describe('DataSourceManagement: Form Validation', () => {
  describe('validate create/edit datasource for Username and Password auth type', () => {
    let authenticationMethodRegistry = new AuthenticationMethodRegistry();
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
      const result = performDataSourceFormValidation(form, [], '', authenticationMethodRegistry);
      expect(result).toBe(false);
    });
    test('should fail validation on duplicate title', () => {
      form.title = 'test';
      const result = performDataSourceFormValidation(
        form,
        ['oldTitle', 'test'],
        'oldTitle',
        authenticationMethodRegistry
      );
      expect(result).toBe(false);
    });
    test('should fail validation when title is longer than 32 characters', () => {
      form.title = 'test'.repeat(10);
      const result = performDataSourceFormValidation(form, [], '', authenticationMethodRegistry);
      expect(result).toBe(false);
    });
    test('should fail validation when endpoint is not valid', () => {
      form.endpoint = mockDataSourceAttributesWithAuth.endpoint;
      const result = performDataSourceFormValidation(form, [], '', authenticationMethodRegistry);
      expect(result).toBe(false);
    });
    test('should fail validation when username is empty', () => {
      form.endpoint = 'test';
      const result = performDataSourceFormValidation(form, [], '', authenticationMethodRegistry);
      expect(result).toBe(false);
    });
    test('should fail validation when password is empty', () => {
      form.auth.credentials.username = 'test';
      form.auth.credentials.password = '';
      const result = performDataSourceFormValidation(form, [], '', authenticationMethodRegistry);
      expect(result).toBe(false);
    });
    test('should NOT fail validation on empty username/password when  No Auth is selected', () => {
      form.auth.type = AuthType.NoAuth;
      form.title = 'test';
      form.endpoint = mockDataSourceAttributesWithAuth.endpoint;
      const result = performDataSourceFormValidation(form, [], '', authenticationMethodRegistry);
      expect(result).toBe(true);
    });
    test('should NOT fail validation on all fields', () => {
      form = { ...form, ...mockDataSourceAttributesWithAuth };
      const result = performDataSourceFormValidation(
        form,
        [mockDataSourceAttributesWithAuth.title],
        mockDataSourceAttributesWithAuth.title,
        authenticationMethodRegistry
      );
      expect(result).toBe(true);
    });
    test('should NOT fail validation when registered auth type is selected and related credential field not empty', () => {
      authenticationMethodRegistry = new AuthenticationMethodRegistry();
      const authMethodToBeTested = {
        name: 'Some Auth Type',
        credentialSourceOption: {
          value: 'Some Auth Type',
          inputDisplay: 'some input',
        },
        credentialForm: jest.fn(),
        credentialFormField: {
          userNameRegistered: 'some filled in userName from registed auth credential form',
          passWordRegistered: 'some filled in password from registed auth credential form',
        },
      } as AuthenticationMethod;

      authenticationMethodRegistry.registerAuthenticationMethod(authMethodToBeTested);

      const formWithRegisteredAuth: CreateDataSourceState | EditDataSourceState = {
        formErrorsByField: { ...defaultValidation },
        title: 'test registered auth type',
        description: '',
        endpoint: 'https://test.com',
        auth: {
          type: 'Some Auth Type',
          credentials: {
            userNameRegistered: 'some filled in userName from registed auth credential form',
            passWordRegistered: 'some filled in password from registed auth credential form',
          },
        },
      };
      const result = performDataSourceFormValidation(
        formWithRegisteredAuth,
        [],
        '',
        authenticationMethodRegistry
      );
      expect(result).toBe(true);
    });
  });

  describe('validate create/edit datasource for SigV4 auth type', () => {
    let authenticationMethodRegistry = new AuthenticationMethodRegistry();
    let form: CreateDataSourceState | EditDataSourceState = {
      formErrorsByField: { ...defaultValidation },
      title: '',
      description: '',
      endpoint: '',
      auth: {
        type: AuthType.SigV4,
        credentials: {
          accesskey: 'test123',
          secretKey: 'test123',
          service: 'es',
          region: 'us-east-1',
        },
      },
    };
    test('should fail validation when title is empty', () => {
      const result = performDataSourceFormValidation(form, [], '', authenticationMethodRegistry);
      expect(result).toBe(false);
    });
    test('should fail validation on duplicate title', () => {
      form.title = 'test';
      const result = performDataSourceFormValidation(
        form,
        ['oldTitle', 'test'],
        'oldTitle',
        authenticationMethodRegistry
      );
      expect(result).toBe(false);
    });
    test('should fail validation when title is longer than 32 characters', () => {
      form.title = 'test'.repeat(10);
      const result = performDataSourceFormValidation(form, [], '', authenticationMethodRegistry);
      expect(result).toBe(false);
    });
    test('should fail validation when endpoint is not valid', () => {
      form.endpoint = mockDataSourceAttributesWithSigV4Auth.endpoint;
      const result = performDataSourceFormValidation(form, [], '', authenticationMethodRegistry);
      expect(result).toBe(false);
    });
    test('should fail validation when accesskey is empty', () => {
      form.auth.credentials!.accessKey = 'test';
      const result = performDataSourceFormValidation(form, [], '', authenticationMethodRegistry);
      expect(result).toBe(false);
    });
    test('should fail validation when secrectKey is empty', () => {
      form.auth.credentials!.accessKey = 'test';
      form.auth.credentials!.secretKey = '';
      const result = performDataSourceFormValidation(form, [], '', authenticationMethodRegistry);
      expect(result).toBe(false);
    });
    test('should NOT fail validation on empty accesskey/secretKey when  No Auth is selected', () => {
      form.auth.type = AuthType.NoAuth;
      form.title = 'test';
      form.endpoint = mockDataSourceAttributesWithSigV4Auth.endpoint;
      const result = performDataSourceFormValidation(form, [], '', authenticationMethodRegistry);
      expect(result).toBe(true);
    });
    test('should NOT fail validation on all fields', () => {
      form = { ...form, ...mockDataSourceAttributesWithSigV4Auth };
      const result = performDataSourceFormValidation(
        form,
        [mockDataSourceAttributesWithSigV4Auth.title],
        mockDataSourceAttributesWithSigV4Auth.title,
        authenticationMethodRegistry
      );
      expect(result).toBe(true);
    });
    test('should NOT fail validation when registered auth type is selected and related credential field not empty', () => {
      authenticationMethodRegistry = new AuthenticationMethodRegistry();
      const authMethodToBeTested = {
        name: 'Some Auth Type',
        credentialSourceOption: {
          value: 'Some Auth Type',
          inputDisplay: 'some input',
        },
        credentialForm: jest.fn(),
        credentialFormField: {
          userNameRegistered: 'some filled in userName from registed auth credential form',
          passWordRegistered: 'some filled in password from registed auth credential form',
        },
      } as AuthenticationMethod;

      authenticationMethodRegistry.registerAuthenticationMethod(authMethodToBeTested);

      const formWithRegisteredAuth: CreateDataSourceState | EditDataSourceState = {
        formErrorsByField: { ...defaultValidation },
        title: 'test registered auth type',
        description: '',
        endpoint: 'https://test.com',
        auth: {
          type: 'Some Auth Type',
          credentials: {
            userNameRegistered: 'some filled in userName from registed auth credential form',
            passWordRegistered: 'some filled in password from registed auth credential form',
          },
        },
      };
      const result = performDataSourceFormValidation(
        formWithRegisteredAuth,
        [],
        '',
        authenticationMethodRegistry
      );
      expect(result).toBe(true);
    });
  });
});
