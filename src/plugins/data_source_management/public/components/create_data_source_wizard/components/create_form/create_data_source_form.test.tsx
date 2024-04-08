/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mockManagementPlugin } from '../../../../mocks';
import { mount, ReactWrapper } from 'enzyme';
import { wrapWithIntl } from 'test_utils/enzyme_helpers';
import { OpenSearchDashboardsContextProvider } from '../../../../../../opensearch_dashboards_react/public';
import { CreateDataSourceForm } from './create_data_source_form';
// @ts-ignore
import { findTestSubject } from '@elastic/eui/lib/test';
import {
  AuthType,
  noAuthCredentialAuthMethod,
  sigV4AuthMethod,
  usernamePasswordAuthMethod,
} from '../../../../types';
import { AuthenticationMethod, AuthenticationMethodRegistry } from '../../../../auth_registry';

const titleIdentifier = '[data-test-subj="createDataSourceFormTitleField"]';
const descriptionIdentifier = `[data-test-subj="createDataSourceFormDescriptionField"]`;
const endpointIdentifier = '[data-test-subj="createDataSourceFormEndpointField"]';
const authTypeIdentifier = '[data-test-subj="createDataSourceFormAuthTypeSelect"]';
const usernameIdentifier = '[data-test-subj="createDataSourceFormUsernameField"]';
const passwordIdentifier = '[data-test-subj="createDataSourceFormPasswordField"]';
const createButtonIdentifier = '[data-test-subj="createDataSourceButton"]';
const testConnectionButtonIdentifier = '[data-test-subj="createDataSourceTestConnectionButton"]';

describe('Datasource Management: Create Datasource form', () => {
  const mockedContext = mockManagementPlugin.createDataSourceManagementContext();
  mockedContext.authenticationMethodRegistry.registerAuthenticationMethod(
    noAuthCredentialAuthMethod
  );
  mockedContext.authenticationMethodRegistry.registerAuthenticationMethod(
    usernamePasswordAuthMethod
  );
  mockedContext.authenticationMethodRegistry.registerAuthenticationMethod(sigV4AuthMethod);

  let component: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  const mockSubmitHandler = jest.fn();
  const mockTestConnectionHandler = jest.fn();
  const mockCancelHandler = jest.fn();

  const getFields = (comp: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>) => {
    return {
      title: comp.find(titleIdentifier).first(),
      description: comp.find(descriptionIdentifier).first(),
      endpoint: comp.find(endpointIdentifier).first(),
      authType: comp.find(authTypeIdentifier).first(),
      username: comp.find(usernameIdentifier).first(),
      password: comp.find(passwordIdentifier).first(),
    };
  };

  const changeTextFieldValue = (testSubjId: string, value: string) => {
    component.find(testSubjId).last().simulate('change', {
      target: {
        value,
      },
    });
  };
  const blurOnField = (testSubjId: string) => {
    component.find(testSubjId).last().simulate('focus');
    component.find(testSubjId).last().simulate('blur');
  };

  const setAuthTypeValue = (testSubjId: string, value: string) => {
    component.find(testSubjId).last().simulate('click');
    component.find({ id: value }).last().simulate('click');
  };

  beforeEach(() => {
    component = mount(
      wrapWithIntl(
        <CreateDataSourceForm
          handleTestConnection={mockTestConnectionHandler}
          handleSubmit={mockSubmitHandler}
          handleCancel={mockCancelHandler}
          existingDatasourceNamesList={['dup20']}
        />
      ),
      {
        wrappingComponent: OpenSearchDashboardsContextProvider,
        wrappingComponentProps: {
          services: mockedContext,
        },
      }
    );
  });

  /* Scenario 1: Should render the page normally*/
  test('should render normally', () => {
    const testConnBtn = component.find(testConnectionButtonIdentifier).last();
    expect(testConnBtn.prop('disabled')).toBe(true);
  });

  /* Scenario 2: submit without any input from user - should display validation error messages*/
  /* Default option: Username & Password*/
  test('should disable submit button when there is no user input on any field', () => {
    const createBtn = component.find(createButtonIdentifier).last();
    expect(createBtn.prop('disabled')).toBe(true);
  });

  /* Change option: No Authentication */
  test('should validate when auth type changed & previously submit button clicked', () => {
    /* Update Eui Super Select Value to No Auth*/
    setAuthTypeValue(authTypeIdentifier, AuthType.NoAuth);
    component.update();

    /* Click on submit without any user input */
    findTestSubject(component, 'createDataSourceButton').simulate('click');

    const { authType, username, password } = getFields(component);

    expect(authType.prop('valueOfSelected')).toBe(AuthType.NoAuth);
    expect(username.exists()).toBeFalsy(); // username field does not exist when No Auth option is selected
    expect(password.exists()).toBeFalsy(); // password field does not exist when No Auth option is selected
  });

  test('should throw validation error when title is not valid & remove error on update valid title', () => {
    changeTextFieldValue(descriptionIdentifier, 'test');
    changeTextFieldValue(endpointIdentifier, 'https://test.com');
    changeTextFieldValue(usernameIdentifier, 'test123');
    changeTextFieldValue(passwordIdentifier, 'test123');

    component.find(titleIdentifier).last().simulate('blur');

    const { title, description, endpoint, username, password } = getFields(component);

    expect(title.prop('isInvalid')).toBe(true);
    expect(description.prop('isInvalid')).toBe(undefined);
    expect(endpoint.prop('isInvalid')).toBe(false);
    expect(username.prop('isInvalid')).toBe(false);
    expect(password.prop('isInvalid')).toBe(false);

    /* Update title & remove validation*/
    changeTextFieldValue(titleIdentifier, 'test');
    component.find(titleIdentifier).last().simulate('blur');
    findTestSubject(component, 'createDataSourceButton').simulate('click');
    expect(mockSubmitHandler).toHaveBeenCalled(); // should call submit as all fields are valid
  });

  /* Create data source with no errors */
  /* Username & Password */
  test('should create data source with username & password when all fields are valid', () => {
    /* set form fields */
    setAuthTypeValue(authTypeIdentifier, AuthType.UsernamePasswordType);
    changeTextFieldValue(titleIdentifier, 'test');
    changeTextFieldValue(descriptionIdentifier, 'test');
    changeTextFieldValue(endpointIdentifier, 'https://test.com');
    changeTextFieldValue(usernameIdentifier, 'test123');
    changeTextFieldValue(passwordIdentifier, 'test123');

    findTestSubject(component, 'createDataSourceTestConnectionButton').simulate('click');

    findTestSubject(component, 'createDataSourceButton').simulate('click');
    expect(mockTestConnectionHandler).toHaveBeenCalled();
    expect(mockSubmitHandler).toHaveBeenCalled(); // should call submit as all fields are valid
  });

  /* No Auth - Username & Password */
  test('should create data source with No Auth when all fields are valid', () => {
    /* set form fields */
    setAuthTypeValue(authTypeIdentifier, AuthType.NoAuth); // No auth
    changeTextFieldValue(titleIdentifier, 'test');
    changeTextFieldValue(descriptionIdentifier, 'test');
    changeTextFieldValue(endpointIdentifier, 'https://test.com');

    findTestSubject(component, 'createDataSourceButton').simulate('click');

    expect(mockSubmitHandler).toHaveBeenCalled(); // should call submit as all fields are valid
  });

  /* Validation */
  test('should validate title as required field & no duplicates allowed', () => {
    /* Validate duplicate title */
    changeTextFieldValue(titleIdentifier, 'DuP20');
    blurOnField(titleIdentifier);
    // @ts-ignore
    expect(component.find(titleIdentifier).first().props().isInvalid).toBe(true);

    /* change to original title */
    changeTextFieldValue(titleIdentifier, 'test_unique_value');
    blurOnField(titleIdentifier);
    // @ts-ignore
    expect(component.find(titleIdentifier).first().props().isInvalid).toBe(false);
  });

  test('should validate endpoint as required field & valid url', () => {
    /* Validate empty endpoint */
    changeTextFieldValue(endpointIdentifier, '');
    blurOnField(endpointIdentifier);
    // @ts-ignore
    expect(component.find(endpointIdentifier).first().props().isInvalid).toBe(true);

    /* Validate invalid URL */
    changeTextFieldValue(endpointIdentifier, 'invalidURL');
    blurOnField(endpointIdentifier);
    // @ts-ignore
    expect(component.find(endpointIdentifier).first().props().isInvalid).toBe(true);

    /* Validate valid URL */
    changeTextFieldValue(endpointIdentifier, 'https://connectionurl.com');
    blurOnField(endpointIdentifier);
    // @ts-ignore
    expect(component.find(endpointIdentifier).first().props().isInvalid).toBe(false);
  });

  test('should validate username as required field', () => {
    /* Validate empty username */
    changeTextFieldValue(usernameIdentifier, '');
    blurOnField(usernameIdentifier);
    // @ts-ignore
    expect(component.find(usernameIdentifier).first().props().isInvalid).toBe(true);

    /* Validate valid username */
    changeTextFieldValue(usernameIdentifier, 'admin');
    blurOnField(usernameIdentifier);
    // @ts-ignore
    expect(component.find(usernameIdentifier).first().props().isInvalid).toBe(false);
  });

  test('should validate password as required field', () => {
    /* Validate empty password */
    changeTextFieldValue(passwordIdentifier, '');
    blurOnField(passwordIdentifier);
    // @ts-ignore
    expect(component.find(passwordIdentifier).first().props().isInvalid).toBe(true);

    /* Validate valid password */
    changeTextFieldValue(passwordIdentifier, 'admin123');
    blurOnField(passwordIdentifier);
    // @ts-ignore
    expect(component.find(passwordIdentifier).first().props().isInvalid).toBe(false);
  });
});

describe('Datasource Management: Create Datasource form with different authType configurations', () => {
  let component: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  const mockSubmitHandler = jest.fn();
  const mockTestConnectionHandler = jest.fn();
  const mockCancelHandler = jest.fn();

  /* Scenario 1: Should render the page normally with all authMethod combinations */
  test('should render normally with all authMethod combinations', () => {
    const authMethodCombinationsToBeTested = [
      [sigV4AuthMethod],
      [noAuthCredentialAuthMethod],
      [usernamePasswordAuthMethod],
      [noAuthCredentialAuthMethod, sigV4AuthMethod],
      [usernamePasswordAuthMethod, sigV4AuthMethod],
      [noAuthCredentialAuthMethod, usernamePasswordAuthMethod],
      [noAuthCredentialAuthMethod, usernamePasswordAuthMethod, sigV4AuthMethod],
    ];

    authMethodCombinationsToBeTested.forEach((authMethodCombination) => {
      const mockedContext = mockManagementPlugin.createDataSourceManagementContext();
      mockedContext.authenticationMethodRegistry = new AuthenticationMethodRegistry();

      authMethodCombination.forEach((authMethod) => {
        mockedContext.authenticationMethodRegistry.registerAuthenticationMethod(authMethod);
      });

      component = mount(
        wrapWithIntl(
          <CreateDataSourceForm
            handleTestConnection={mockTestConnectionHandler}
            handleSubmit={mockSubmitHandler}
            handleCancel={mockCancelHandler}
            existingDatasourceNamesList={['dup20']}
          />
        ),
        {
          wrappingComponent: OpenSearchDashboardsContextProvider,
          wrappingComponentProps: {
            services: mockedContext,
          },
        }
      );

      const authOptionSelector = component.find(authTypeIdentifier).first();
      expect(authOptionSelector).toMatchSnapshot();
    });
  });

  /* Scenario 2: options selector should be disabled when only one authMethod supported */
  test('options selector should be disabled when less than or equal to one authMethod supported', () => {
    const authMethodCombinationsToBeTested = [
      [],
      [sigV4AuthMethod],
      [noAuthCredentialAuthMethod],
      [usernamePasswordAuthMethod],
    ];

    authMethodCombinationsToBeTested.forEach((authMethodCombination) => {
      const mockedContext = mockManagementPlugin.createDataSourceManagementContext();
      mockedContext.authenticationMethodRegistry = new AuthenticationMethodRegistry();

      authMethodCombination.forEach((authMethod) => {
        mockedContext.authenticationMethodRegistry.registerAuthenticationMethod(authMethod);
      });

      component = mount(
        wrapWithIntl(
          <CreateDataSourceForm
            handleTestConnection={mockTestConnectionHandler}
            handleSubmit={mockSubmitHandler}
            handleCancel={mockCancelHandler}
            existingDatasourceNamesList={['dup20']}
          />
        ),
        {
          wrappingComponent: OpenSearchDashboardsContextProvider,
          wrappingComponentProps: {
            services: mockedContext,
          },
        }
      );

      const authOptionSelector = component.find(authTypeIdentifier).last();
      expect(authOptionSelector.prop('disabled')).toBe(true);
    });
  });

  /* Scenario 3: options selector should not be disabled when more than one authMethod supported */
  test('options selector should not be disabled when more than one authMethod supported', () => {
    const authMethodCombinationsToBeTested = [
      [sigV4AuthMethod, usernamePasswordAuthMethod],
      [noAuthCredentialAuthMethod, sigV4AuthMethod],
      [noAuthCredentialAuthMethod, usernamePasswordAuthMethod],
      [noAuthCredentialAuthMethod, sigV4AuthMethod, usernamePasswordAuthMethod],
    ];

    authMethodCombinationsToBeTested.forEach((authMethodCombination) => {
      const mockedContext = mockManagementPlugin.createDataSourceManagementContext();
      mockedContext.authenticationMethodRegistry = new AuthenticationMethodRegistry();

      authMethodCombination.forEach((authMethod) => {
        mockedContext.authenticationMethodRegistry.registerAuthenticationMethod(authMethod);
      });

      component = mount(
        wrapWithIntl(
          <CreateDataSourceForm
            handleTestConnection={mockTestConnectionHandler}
            handleSubmit={mockSubmitHandler}
            handleCancel={mockCancelHandler}
            existingDatasourceNamesList={['dup20']}
          />
        ),
        {
          wrappingComponent: OpenSearchDashboardsContextProvider,
          wrappingComponentProps: {
            services: mockedContext,
          },
        }
      );

      const authOptionSelector = component.find(authTypeIdentifier).last();
      expect(authOptionSelector.prop('disabled')).toBe(false);
    });
  });
});

describe('Datasource Management: Create Datasource form with registered Auth Type', () => {
  let component: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  const mockSubmitHandler = jest.fn();
  const mockTestConnectionHandler = jest.fn();
  const mockCancelHandler = jest.fn();
  const changeTextFieldValue = (testSubjId: string, value: string) => {
    component.find(testSubjId).last().simulate('change', {
      target: {
        value,
      },
    });
  };

  test('should call registered crendential form at the first round when registered method is at the first place and username & password disabled', () => {
    const mockCredentialForm = jest.fn();
    const authTypeToBeTested = 'Some Auth Type';
    const authMethodToBeTested = {
      name: authTypeToBeTested,
      credentialSourceOption: {
        value: authTypeToBeTested,
        inputDisplay: 'some input',
      },
      credentialForm: mockCredentialForm,
    } as AuthenticationMethod;

    const authMethodCombinationsToBeTested = [
      [authMethodToBeTested],
      [authMethodToBeTested, sigV4AuthMethod],
      [authMethodToBeTested, noAuthCredentialAuthMethod],
      [authMethodToBeTested, noAuthCredentialAuthMethod, sigV4AuthMethod],
    ];

    authMethodCombinationsToBeTested.forEach((authMethodCombination) => {
      const mockedContext = mockManagementPlugin.createDataSourceManagementContext();
      mockedContext.authenticationMethodRegistry = new AuthenticationMethodRegistry();

      authMethodCombination.forEach((authMethod) => {
        mockedContext.authenticationMethodRegistry.registerAuthenticationMethod(authMethod);
      });

      component = mount(
        wrapWithIntl(
          <CreateDataSourceForm
            handleTestConnection={mockTestConnectionHandler}
            handleSubmit={mockSubmitHandler}
            handleCancel={mockCancelHandler}
            existingDatasourceNamesList={['dup20']}
          />
        ),
        {
          wrappingComponent: OpenSearchDashboardsContextProvider,
          wrappingComponentProps: {
            services: mockedContext,
          },
        }
      );

      expect(mockCredentialForm).toHaveBeenCalled();
    });
  });

  test('should not call registered crendential form at the first round when registered method is at the first place and username & password enabled', () => {
    const mockCredentialForm = jest.fn();
    const authTypeToBeTested = 'Some Auth Type';
    const authMethodToBeTested = {
      name: authTypeToBeTested,
      credentialSourceOption: {
        value: authTypeToBeTested,
        inputDisplay: 'some input',
      },
      credentialForm: mockCredentialForm,
    } as AuthenticationMethod;

    const authMethodCombinationsToBeTested = [
      [authMethodToBeTested, usernamePasswordAuthMethod],
      [authMethodToBeTested, usernamePasswordAuthMethod, sigV4AuthMethod],
      [authMethodToBeTested, usernamePasswordAuthMethod, noAuthCredentialAuthMethod],
      [
        authMethodToBeTested,
        usernamePasswordAuthMethod,
        noAuthCredentialAuthMethod,
        sigV4AuthMethod,
      ],
    ];

    authMethodCombinationsToBeTested.forEach((authMethodCombination) => {
      const mockedContext = mockManagementPlugin.createDataSourceManagementContext();
      mockedContext.authenticationMethodRegistry = new AuthenticationMethodRegistry();

      authMethodCombination.forEach((authMethod) => {
        mockedContext.authenticationMethodRegistry.registerAuthenticationMethod(authMethod);
      });

      component = mount(
        wrapWithIntl(
          <CreateDataSourceForm
            handleTestConnection={mockTestConnectionHandler}
            handleSubmit={mockSubmitHandler}
            handleCancel={mockCancelHandler}
            existingDatasourceNamesList={['dup20']}
          />
        ),
        {
          wrappingComponent: OpenSearchDashboardsContextProvider,
          wrappingComponentProps: {
            services: mockedContext,
          },
        }
      );

      expect(mockCredentialForm).not.toHaveBeenCalled();
    });
  });

  test('should not call registered crendential form at the first round when registered method is not at the first place', () => {
    const mockCredentialForm = jest.fn();
    const authTypeToBeTested = 'Some Auth Type';
    const authMethodToBeTested = {
      name: authTypeToBeTested,
      credentialSourceOption: {
        value: authTypeToBeTested,
        inputDisplay: 'some input',
      },
      credentialForm: mockCredentialForm,
    } as AuthenticationMethod;

    const authMethodCombinationsToBeTested = [
      [sigV4AuthMethod, authMethodToBeTested],
      [noAuthCredentialAuthMethod, authMethodToBeTested],
      [noAuthCredentialAuthMethod, authMethodToBeTested, sigV4AuthMethod],
    ];

    authMethodCombinationsToBeTested.forEach((authMethodCombination) => {
      const mockedContext = mockManagementPlugin.createDataSourceManagementContext();
      mockedContext.authenticationMethodRegistry = new AuthenticationMethodRegistry();

      authMethodCombination.forEach((authMethod) => {
        mockedContext.authenticationMethodRegistry.registerAuthenticationMethod(authMethod);
      });

      component = mount(
        wrapWithIntl(
          <CreateDataSourceForm
            handleTestConnection={mockTestConnectionHandler}
            handleSubmit={mockSubmitHandler}
            handleCancel={mockCancelHandler}
            existingDatasourceNamesList={['dup20']}
          />
        ),
        {
          wrappingComponent: OpenSearchDashboardsContextProvider,
          wrappingComponentProps: {
            services: mockedContext,
          },
        }
      );

      expect(mockCredentialForm).not.toHaveBeenCalled();
    });
  });

  test('should create data source with registered Auth when all fields are valid', () => {
    const mockCredentialForm = jest.fn();
    const authMethodToBeTested = {
      name: 'Some Auth Type',
      credentialSourceOption: {
        value: 'Some Auth Type',
        inputDisplay: 'some input',
      },
      credentialForm: mockCredentialForm,
      credentialFormField: {
        userNameRegistered: 'some filled in userName from registed auth credential form',
        passWordRegistered: 'some filled in password from registed auth credential form',
      },
    } as AuthenticationMethod;

    const mockedContext = mockManagementPlugin.createDataSourceManagementContext();
    mockedContext.authenticationMethodRegistry = new AuthenticationMethodRegistry();
    mockedContext.authenticationMethodRegistry.registerAuthenticationMethod(authMethodToBeTested);

    component = mount(
      wrapWithIntl(
        <CreateDataSourceForm
          handleTestConnection={mockTestConnectionHandler}
          handleSubmit={mockSubmitHandler}
          handleCancel={mockCancelHandler}
          existingDatasourceNamesList={['dup20']}
        />
      ),
      {
        wrappingComponent: OpenSearchDashboardsContextProvider,
        wrappingComponentProps: {
          services: mockedContext,
        },
      }
    );

    changeTextFieldValue(titleIdentifier, 'test');
    changeTextFieldValue(descriptionIdentifier, 'test');
    changeTextFieldValue(endpointIdentifier, 'https://test.com');

    findTestSubject(component, 'createDataSourceButton').simulate('click');

    expect(mockSubmitHandler).toHaveBeenCalled();
  });
});
