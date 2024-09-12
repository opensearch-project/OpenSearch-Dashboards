/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { mount, ReactWrapper } from 'enzyme';
import React from 'react';
import { wrapWithIntl } from 'test_utils/enzyme_helpers';
import {
  mockDataSourceAttributesWithAuth,
  mockManagementPlugin,
  existingDatasourceNamesList,
  mockDataSourceAttributesWithNoAuth,
  mockDataSourceAttributesWithRegisteredAuth,
  mockDataSourceAttributesWithSigV4Auth,
} from '../../../../mocks';
import { OpenSearchDashboardsContextProvider } from '../../../../../../opensearch_dashboards_react/public';
import { EditDataSourceForm } from './edit_data_source_form';
import { act } from 'react-dom/test-utils';
import {
  AuthType,
  noAuthCredentialAuthMethod,
  sigV4AuthMethod,
  usernamePasswordAuthMethod,
} from '../../../../types';
import { AuthenticationMethod, AuthenticationMethodRegistry } from '../../../../auth_registry';

const titleFieldIdentifier = 'dataSourceTitle';
const titleFormRowIdentifier = '[data-test-subj="editDataSourceTitleFormRow"]';
const endpointFieldIdentifier = '[data-test-subj="editDatasourceEndpointField"]';
const descriptionFieldIdentifier = 'dataSourceDescription';
const descriptionFormRowIdentifier = '[data-test-subj="editDataSourceDescriptionFormRow"]';
const authTypeSelectIdentifier = '[data-test-subj="editDataSourceSelectAuthType"]';
const usernameFieldIdentifier = 'datasourceUsername';
const usernameFormRowIdentifier = '[data-test-subj="editDatasourceUsernameFormRow"]';
const passwordFieldIdentifier = '[data-test-subj="updateDataSourceFormPasswordField"]';
const updatePasswordBtnIdentifier = '[data-test-subj="editDatasourceUpdatePasswordBtn"]';
const updateAwsCredsBtnIdentifier = '[data-test-subj="editDatasourceUpdateAwsCredentialBtn"]';
const regionFieldIdentifier = 'dataSourceRegion';
const accessKeyFieldIdentifier = 'dataSourceAccessKey';
const accessKeyFormRowIdentifier = '[data-test-subj="editDataSourceFormAccessKeyField"]';
const secretKeyFieldIdentifier = 'dataSourceSecretKey';
const secretKeyFormRowIdentifier = '[data-test-subj="editDataSourceFormSecretKeyField"]';

describe('Datasource Management: Edit Datasource Form', () => {
  const mockedContext = mockManagementPlugin.createDataSourceManagementContext();
  mockedContext.authenticationMethodRegistry.registerAuthenticationMethod(
    noAuthCredentialAuthMethod
  );
  mockedContext.authenticationMethodRegistry.registerAuthenticationMethod(
    usernamePasswordAuthMethod
  );
  mockedContext.authenticationMethodRegistry.registerAuthenticationMethod(sigV4AuthMethod);

  let component: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  const mockFn = jest.fn();

  const updateInputFieldAndBlur = (
    comp: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>,
    fieldName: string,
    updatedValue: string,
    isTestSubj?: boolean
  ) => {
    const field = isTestSubj ? comp.find(fieldName) : comp.find({ name: fieldName });
    act(() => {
      field.last().simulate('change', { target: { value: updatedValue } });
    });
    comp.update();
    act(() => {
      field.last().simulate('focus').simulate('blur');
    });
    comp.update();
  };

  const setAuthTypeValue = (testSubjId: string, value: string) => {
    component.find(testSubjId).last().simulate('click');
    component.find({ id: value }).last().simulate('click');
  };

  describe('Case 1: With Username & Password', () => {
    beforeEach(() => {
      component = mount(
        wrapWithIntl(
          <EditDataSourceForm
            existingDataSource={mockDataSourceAttributesWithAuth}
            existingDatasourceNamesList={existingDatasourceNamesList}
            isDefault={false}
            onDeleteDataSource={mockFn}
            handleSubmit={mockFn}
            onSetDefaultDataSource={mockFn}
            handleTestConnection={mockFn}
            displayToastMessage={mockFn}
            canManageDataSource={true}
          />
        ),
        {
          wrappingComponent: OpenSearchDashboardsContextProvider,
          wrappingComponentProps: {
            services: mockedContext,
          },
        }
      );
      component.update();
    });

    test('should render normally', () => {
      // @ts-ignore
      expect(component.find({ name: titleFieldIdentifier }).first().props().value).toBe(
        mockDataSourceAttributesWithAuth.title
      );
      expect(component.find(endpointFieldIdentifier).first().props().disabled).toBe(true);
    });

    /* Validation */
    test('should validate title as required field & no duplicates allowed', () => {
      /* Validate empty title - required */
      updateInputFieldAndBlur(component, titleFieldIdentifier, '');
      // @ts-ignore
      expect(component.find(titleFormRowIdentifier).first().props().isInvalid).toBe(true);

      /* Validate duplicate title */
      updateInputFieldAndBlur(component, titleFieldIdentifier, 'DuP20');
      // @ts-ignore
      expect(component.find(titleFormRowIdentifier).first().props().isInvalid).toBe(true);

      /* change to original title */
      updateInputFieldAndBlur(
        component,
        titleFieldIdentifier,
        mockDataSourceAttributesWithAuth.title
      );
      // @ts-ignore
      expect(component.find(titleFormRowIdentifier).first().props().isInvalid).toBe(false);

      /* change to valid updated title */
      updateInputFieldAndBlur(component, titleFieldIdentifier, 'test007');
      // @ts-ignore
      expect(component.find(titleFormRowIdentifier).first().props().isInvalid).toBe(false);
    });
    test('should validate username as required field', () => {
      /* Validate empty username - required */
      updateInputFieldAndBlur(component, usernameFieldIdentifier, '');
      // @ts-ignore
      expect(component.find(usernameFormRowIdentifier).first().props().isInvalid).toBe(true);

      /* change to original username */
      updateInputFieldAndBlur(
        component,
        usernameFieldIdentifier,
        mockDataSourceAttributesWithAuth.auth.credentials.username
      );
      // @ts-ignore
      expect(component.find(usernameFormRowIdentifier).first().props().isInvalid).toBe(false);
      /* change to valid updated username */
      updateInputFieldAndBlur(component, usernameFieldIdentifier, 'test');
      // @ts-ignore
      expect(component.find(usernameFormRowIdentifier).first().props().isInvalid).toBe(false);
    });
    test('should validate that password field is disabled & update stored password button is shown', () => {
      expect(component.find(passwordFieldIdentifier).first().props().disabled).toBe(true);
      expect(component.find(updatePasswordBtnIdentifier).exists()).toBe(true);
    });
    /* Functionality */
    test('should display update password modal on update stored password button click & on update confirmation should update the password', () => {
      act(() => {
        component.find(updatePasswordBtnIdentifier).first().simulate('click');
      });
      component.update();
      expect(component.find('UpdatePasswordModal').exists()).toBe(true);

      /* Update password */
      act(() => {
        // @ts-ignore
        component.find('UpdatePasswordModal').prop('handleUpdatePassword')('testPassword');
      });
      component.update();
      expect(mockFn).toHaveBeenCalled();
      expect(component.find('UpdatePasswordModal').exists()).toBe(false);
    });
    test("should hide username & password fields when 'No Authentication' is selected as the credential type", () => {
      setAuthTypeValue(authTypeSelectIdentifier, AuthType.NoAuth);
      component.update();
      expect(component.find(usernameFormRowIdentifier).exists()).toBe(false);
      expect(component.find(passwordFieldIdentifier).exists()).toBe(false);
    });

    /* Cancel Changes */
    test('should reset form on click cancel changes', async () => {
      await new Promise((resolve) =>
        setTimeout(() => {
          updateInputFieldAndBlur(component, descriptionFieldIdentifier, '');
          expect(
            // @ts-ignore
            component.find(descriptionFormRowIdentifier).first().props().isInvalid
          ).toBeUndefined();
          resolve();
        }, 100)
      );
      await new Promise((resolve) =>
        setTimeout(() => {
          /* Updated description*/
          updateInputFieldAndBlur(component, descriptionFieldIdentifier, 'testDescription');
          expect(
            // @ts-ignore
            component.find(descriptionFormRowIdentifier).first().props().isInvalid
          ).toBeUndefined();

          expect(component.find('[data-test-subj="datasource-edit-cancelButton"]').exists()).toBe(
            true
          );
          component
            .find('[data-test-subj="datasource-edit-cancelButton"]')
            .first()
            .simulate('click');
          resolve();
        }, 100)
      );
    });

    /* Save Changes */
    test('should update the form with Username&Password on click save changes', async () => {
      await new Promise((resolve) =>
        setTimeout(() => {
          updateInputFieldAndBlur(component, descriptionFieldIdentifier, '');
          expect(
            // @ts-ignore
            component.find(descriptionFormRowIdentifier).first().props().isInvalid
          ).toBeUndefined();
          resolve();
        }, 100)
      );
      await new Promise((resolve) =>
        setTimeout(() => {
          /* Updated description*/
          updateInputFieldAndBlur(component, descriptionFieldIdentifier, 'testDescription');
          expect(
            // @ts-ignore
            component.find(descriptionFormRowIdentifier).first().props().isInvalid
          ).toBeUndefined();

          expect(component.find('[data-test-subj="datasource-edit-saveButton"]').exists()).toBe(
            true
          );
          component.find('[data-test-subj="datasource-edit-saveButton"]').first().simulate('click');
          expect(mockFn).toHaveBeenCalled();
          resolve();
        }, 100)
      );
    });
  });

  describe('Case 2: With No Authentication', () => {
    beforeEach(() => {
      component = mount(
        wrapWithIntl(
          <EditDataSourceForm
            existingDataSource={mockDataSourceAttributesWithNoAuth}
            existingDatasourceNamesList={existingDatasourceNamesList}
            isDefault={false}
            onDeleteDataSource={mockFn}
            onSetDefaultDataSource={mockFn}
            handleSubmit={mockFn}
            handleTestConnection={mockFn}
            displayToastMessage={mockFn}
            canManageDataSource={true}
          />
        ),
        {
          wrappingComponent: OpenSearchDashboardsContextProvider,
          wrappingComponentProps: {
            services: mockedContext,
          },
        }
      );
      component.update();
    });

    test('should render normally', () => {
      // @ts-ignore
      expect(component.find({ name: titleFieldIdentifier }).first().props().value).toBe(
        mockDataSourceAttributesWithNoAuth.title
      );
      expect(component.find(endpointFieldIdentifier).first().props().disabled).toBe(true);
    });

    /* functionality */

    test("should show username & password fields when 'Username & Password' is selected as the credential type", () => {
      setAuthTypeValue(authTypeSelectIdentifier, AuthType.UsernamePasswordType);
      component.update();
      expect(component.find(usernameFormRowIdentifier).exists()).toBe(true);
      expect(component.find(passwordFieldIdentifier).exists()).toBe(true);
    });

    /* validation - Password */

    test('should validate password as required field', () => {
      setAuthTypeValue(authTypeSelectIdentifier, AuthType.UsernamePasswordType);
      component.update();

      /* Validate empty username - required */
      updateInputFieldAndBlur(component, passwordFieldIdentifier, '', true);
      // @ts-ignore
      expect(component.find(passwordFieldIdentifier).first().props().isInvalid).toBe(true);

      /* change to original username */
      updateInputFieldAndBlur(component, passwordFieldIdentifier, 'test123', true);
      // @ts-ignore
      expect(component.find(passwordFieldIdentifier).first().props().isInvalid).toBe(false);
    });

    test('should delete datasource on confirmation from header', () => {
      // @ts-ignore
      component.find('Header').prop('onClickDeleteIcon')();
      expect(mockFn).toHaveBeenCalled();
    });

    test('should set as the default datasource from header', () => {
      // @ts-ignore
      component.find('Header').prop('onClickSetDefault')();
      expect(mockFn).toHaveBeenCalled();
    });

    /* Save Changes */
    test('should update the form with NoAuth on click save changes', async () => {
      await new Promise((resolve) =>
        setTimeout(() => {
          updateInputFieldAndBlur(component, descriptionFieldIdentifier, '');
          expect(
            // @ts-ignore
            component.find(descriptionFormRowIdentifier).first().props().isInvalid
          ).toBeUndefined();
          resolve();
        }, 100)
      );
      await new Promise((resolve) =>
        setTimeout(() => {
          /* Updated description*/
          updateInputFieldAndBlur(component, descriptionFieldIdentifier, 'testDescription');
          expect(
            // @ts-ignore
            component.find(descriptionFormRowIdentifier).first().props().isInvalid
          ).toBeUndefined();

          expect(component.find('[data-test-subj="datasource-edit-saveButton"]').exists()).toBe(
            true
          );
          component.find('[data-test-subj="datasource-edit-saveButton"]').first().simulate('click');
          expect(mockFn).toHaveBeenCalled();
          resolve();
        }, 100)
      );
    });

    /* Test Connection */
    test('should test connection on click test connection button', async () => {
      expect(component.find('Header').exists()).toBe(true);
      // @ts-ignore
      component.find('Header').first().prop('onClickTestConnection')();
      component.update();
      expect(mockFn).toHaveBeenCalled();
    });
  });

  describe('Case 3: With AWSsigv4', () => {
    beforeEach(() => {
      component = mount(
        wrapWithIntl(
          <EditDataSourceForm
            existingDataSource={mockDataSourceAttributesWithSigV4Auth}
            existingDatasourceNamesList={existingDatasourceNamesList}
            isDefault={false}
            onDeleteDataSource={mockFn}
            handleSubmit={mockFn}
            onSetDefaultDataSource={mockFn}
            handleTestConnection={mockFn}
            displayToastMessage={mockFn}
            canManageDataSource={true}
          />
        ),
        {
          wrappingComponent: OpenSearchDashboardsContextProvider,
          wrappingComponentProps: {
            services: mockedContext,
          },
        }
      );
      component.update();
    });

    test('should render normally', () => {
      // @ts-ignore
      expect(component.find({ name: titleFieldIdentifier }).first().props().value).toBe(
        mockDataSourceAttributesWithSigV4Auth.title
      );
      expect(component.find(endpointFieldIdentifier).first().props().disabled).toBe(true);
    });

    /* Validation */
    test('should validate title as required field & no duplicates allowed', () => {
      /* Validate empty title - required */
      updateInputFieldAndBlur(component, titleFieldIdentifier, '');
      // @ts-ignore
      expect(component.find(titleFormRowIdentifier).first().props().isInvalid).toBe(true);

      /* Validate duplicate title */
      updateInputFieldAndBlur(component, titleFieldIdentifier, 'DuP20');
      // @ts-ignore
      expect(component.find(titleFormRowIdentifier).first().props().isInvalid).toBe(true);

      /* change to original title */
      updateInputFieldAndBlur(
        component,
        titleFieldIdentifier,
        mockDataSourceAttributesWithSigV4Auth.title
      );
      // @ts-ignore
      expect(component.find(titleFormRowIdentifier).first().props().isInvalid).toBe(false);

      /* change to valid updated title */
      updateInputFieldAndBlur(component, titleFieldIdentifier, 'test007');
      // @ts-ignore
      expect(component.find(titleFormRowIdentifier).first().props().isInvalid).toBe(false);
    });
    test('should validate access key as required field', () => {
      /* Validate empty accessKey - required */
      updateInputFieldAndBlur(component, accessKeyFieldIdentifier, '');
      // @ts-ignore
      expect(component.find(accessKeyFormRowIdentifier).first().props().isInvalid).toBe(true);

      /* change to original accessKey */
      updateInputFieldAndBlur(
        component,
        accessKeyFieldIdentifier,
        mockDataSourceAttributesWithSigV4Auth.auth.credentials.accessKey
      );
      // @ts-ignore
      expect(component.find(accessKeyFormRowIdentifier).first().props().isInvalid).toBe(false);
      /* change to valid updated accessKey */
      updateInputFieldAndBlur(component, accessKeyFieldIdentifier, 'test123');
      // @ts-ignore
      expect(component.find(accessKeyFormRowIdentifier).first().props().isInvalid).toBe(false);
    });
    test('should validate secret key as required field', () => {
      /* Validate empty secretKey - required */
      updateInputFieldAndBlur(component, secretKeyFieldIdentifier, '');
      // @ts-ignore
      expect(component.find(secretKeyFormRowIdentifier).first().props().isInvalid).toBe(true);

      /* change to original secretKey */
      updateInputFieldAndBlur(
        component,
        secretKeyFieldIdentifier,
        mockDataSourceAttributesWithSigV4Auth.auth.credentials.secretKey
      );
      // @ts-ignore
      expect(component.find(secretKeyFormRowIdentifier).first().props().isInvalid).toBe(false);
      /* change to valid updated secretKey */
      updateInputFieldAndBlur(component, secretKeyFieldIdentifier, 'test123');
      // @ts-ignore
      expect(component.find(secretKeyFormRowIdentifier).first().props().isInvalid).toBe(false);
    });
    /* Functionality */
    test('should display update aws credential modal on update button click and should update the credentials', () => {
      act(() => {
        component.find(updateAwsCredsBtnIdentifier).first().simulate('click');
      });
      component.update();
      expect(component.find('UpdateAwsCredentialModal').exists()).toBe(true);

      /* Update password */
      act(() => {
        // @ts-ignore
        component.find('UpdateAwsCredentialModal').prop('handleUpdateAwsCredential')('test123');
      });
      component.update();
      expect(mockFn).toHaveBeenCalled();
      expect(component.find('UpdateAwsCredentialModal').exists()).toBe(false);
    });
    test("should hide username & password fields when 'AWS Sigv4' is selected as the credential type", () => {
      setAuthTypeValue(authTypeSelectIdentifier, AuthType.SigV4);
      component.update();
      expect(component.find(usernameFormRowIdentifier).exists()).toBe(false);
      expect(component.find(passwordFieldIdentifier).exists()).toBe(false);
    });

    /* Cancel Changes */
    test('should reset form on click cancel changes', async () => {
      await new Promise((resolve) =>
        setTimeout(() => {
          updateInputFieldAndBlur(component, descriptionFieldIdentifier, '');
          expect(
            // @ts-ignore
            component.find(descriptionFormRowIdentifier).first().props().isInvalid
          ).toBeUndefined();
          resolve();
        }, 100)
      );
      await new Promise((resolve) =>
        setTimeout(() => {
          /* Updated description*/
          updateInputFieldAndBlur(component, descriptionFieldIdentifier, 'testDescription');
          expect(
            // @ts-ignore
            component.find(descriptionFormRowIdentifier).first().props().isInvalid
          ).toBeUndefined();

          expect(component.find('[data-test-subj="datasource-edit-cancelButton"]').exists()).toBe(
            true
          );
          component
            .find('[data-test-subj="datasource-edit-cancelButton"]')
            .first()
            .simulate('click');
          resolve();
        }, 100)
      );
    });

    /* Save Changes */
    test('should update the form with Username&Password on click save changes', async () => {
      await new Promise((resolve) =>
        setTimeout(() => {
          updateInputFieldAndBlur(component, descriptionFieldIdentifier, '');
          expect(
            // @ts-ignore
            component.find(descriptionFormRowIdentifier).first().props().isInvalid
          ).toBeUndefined();
          resolve();
        }, 100)
      );
      await new Promise((resolve) =>
        setTimeout(() => {
          /* Updated description*/
          updateInputFieldAndBlur(component, descriptionFieldIdentifier, 'testDescription');
          expect(
            // @ts-ignore
            component.find(descriptionFormRowIdentifier).first().props().isInvalid
          ).toBeUndefined();

          expect(component.find('[data-test-subj="datasource-edit-saveButton"]').exists()).toBe(
            true
          );
          component.find('[data-test-subj="datasource-edit-saveButton"]').first().simulate('click');
          expect(mockFn).toHaveBeenCalled();
          resolve();
        }, 100)
      );
    });
  });
});

describe('With Registered Authentication', () => {
  let component: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  const updateInputFieldAndBlur = (
    comp: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>,
    fieldName: string,
    updatedValue: string,
    isTestSubj?: boolean
  ) => {
    const field = isTestSubj ? comp.find(fieldName) : comp.find({ name: fieldName });
    act(() => {
      field.last().simulate('change', { target: { value: updatedValue } });
    });
    comp.update();
    act(() => {
      field.last().simulate('focus').simulate('blur');
    });
    comp.update();
  };

  test('should call registered crendential form', () => {
    const mockedCredentialForm = jest.fn();
    const authTypeToBeTested = 'Some Auth Type';
    const authMethodToBeTest = {
      name: authTypeToBeTested,
      credentialSourceOption: {
        value: authTypeToBeTested,
        inputDisplay: 'some input',
      },
      credentialForm: mockedCredentialForm,
    } as AuthenticationMethod;

    const mockedContext = mockManagementPlugin.createDataSourceManagementContext();
    mockedContext.authenticationMethodRegistry = new AuthenticationMethodRegistry();
    mockedContext.authenticationMethodRegistry.registerAuthenticationMethod(authMethodToBeTest);

    component = mount(
      wrapWithIntl(
        <EditDataSourceForm
          existingDataSource={mockDataSourceAttributesWithNoAuth}
          existingDatasourceNamesList={existingDatasourceNamesList}
          isDefault={false}
          onDeleteDataSource={jest.fn()}
          handleSubmit={jest.fn()}
          onSetDefaultDataSource={jest.fn()}
          handleTestConnection={jest.fn()}
          displayToastMessage={jest.fn()}
          canManageDataSource={true}
        />
      ),
      {
        wrappingComponent: OpenSearchDashboardsContextProvider,
        wrappingComponentProps: {
          services: mockedContext,
        },
      }
    );

    expect(mockedCredentialForm).toHaveBeenCalled();
  });

  test('should update the form with registered auth type on click save changes', async () => {
    const mockedCredentialForm = jest.fn();
    const mockedSubmitHandler = jest.fn();
    const authMethodToBeTest = {
      name: 'Some Auth Type',
      credentialSourceOption: {
        value: 'Some Auth Type',
        inputDisplay: 'some input',
      },
      credentialForm: mockedCredentialForm,
      credentialFormField: {},
    } as AuthenticationMethod;

    const mockedContext = mockManagementPlugin.createDataSourceManagementContext();
    mockedContext.authenticationMethodRegistry = new AuthenticationMethodRegistry();
    mockedContext.authenticationMethodRegistry.registerAuthenticationMethod(authMethodToBeTest);

    component = mount(
      wrapWithIntl(
        <EditDataSourceForm
          existingDataSource={mockDataSourceAttributesWithRegisteredAuth}
          existingDatasourceNamesList={existingDatasourceNamesList}
          isDefault={false}
          onDeleteDataSource={jest.fn()}
          handleSubmit={mockedSubmitHandler}
          onSetDefaultDataSource={jest.fn()}
          handleTestConnection={jest.fn()}
          displayToastMessage={jest.fn()}
          canManageDataSource={true}
        />
      ),
      {
        wrappingComponent: OpenSearchDashboardsContextProvider,
        wrappingComponentProps: {
          services: mockedContext,
        },
      }
    );

    await new Promise((resolve) =>
      setTimeout(() => {
        updateInputFieldAndBlur(component, descriptionFieldIdentifier, '');
        expect(
          component.find(descriptionFormRowIdentifier).first().props().isInvalid
        ).toBeUndefined();
        resolve();
      }, 100)
    );
    await new Promise((resolve) =>
      setTimeout(() => {
        /* Updated description*/
        updateInputFieldAndBlur(component, descriptionFieldIdentifier, 'testDescription');
        expect(
          component.find(descriptionFormRowIdentifier).first().props().isInvalid
        ).toBeUndefined();

        expect(component.find('[data-test-subj="datasource-edit-saveButton"]').exists()).toBe(true);
        component.find('[data-test-subj="datasource-edit-saveButton"]').first().simulate('click');
        expect(mockedSubmitHandler).toHaveBeenCalled();
        resolve();
      }, 100)
    );
  });
});
