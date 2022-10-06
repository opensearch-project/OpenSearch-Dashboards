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
import { AuthType } from '../../../../types';

const titleIdentifier = '[data-test-subj="createDataSourceFormTitleField"]';
const descriptionIdentifier = `[data-test-subj="createDataSourceFormDescriptionField"]`;
const endpointIdentifier = '[data-test-subj="createDataSourceFormEndpointField"]';
const authTypeIdentifier = '[data-test-subj="createDataSourceFormAuthTypeSelect"]';
const usernameIdentifier = '[data-test-subj="createDataSourceFormUsernameField"]';
const passwordIdentifier = '[data-test-subj="createDataSourceFormPasswordField"]';
const createButtonIdentifier = '[data-test-subj="createDataSourceButton"]';

describe('Datasource Management: Create Datasource form', () => {
  const mockedContext = mockManagementPlugin.createDataSourceManagementContext();
  let component: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  const mockSubmitHandler = jest.fn();

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

  const setAuthTypeValue = (
    comp: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>,
    value: AuthType
  ) => {
    // @ts-ignore
    comp
      .find(authTypeIdentifier)
      .first()
      // @ts-ignore
      .prop('onChange')(value);
    comp.update();
  };

  beforeEach(() => {
    component = mount(
      wrapWithIntl(
        <CreateDataSourceForm handleSubmit={mockSubmitHandler} existingDatasourceNamesList={[]} />
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
    expect(component).toMatchSnapshot();
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
    setAuthTypeValue(component, AuthType.NoAuth);
    component.update();

    /* Click on submit without any user input */
    findTestSubject(component, 'createDataSourceButton').simulate('click');

    const { authType, username, password } = getFields(component);

    expect(authType.prop('idSelected')).toBe(AuthType.NoAuth);
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

    expect(component).toMatchSnapshot();
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
    setAuthTypeValue(component, AuthType.UsernamePasswordType);
    changeTextFieldValue(titleIdentifier, 'test');
    changeTextFieldValue(descriptionIdentifier, 'test');
    changeTextFieldValue(endpointIdentifier, 'https://test.com');
    changeTextFieldValue(usernameIdentifier, 'test123');
    changeTextFieldValue(passwordIdentifier, 'test123');

    findTestSubject(component, 'createDataSourceButton').simulate('click');

    expect(component).toMatchSnapshot();
    expect(mockSubmitHandler).toHaveBeenCalled(); // should call submit as all fields are valid
  });

  /* No Auth - Username & Password */
  test('should create data source with No Auth when all fields are valid', () => {
    /* set form fields */
    setAuthTypeValue(component, AuthType.NoAuth); // No auth
    changeTextFieldValue(titleIdentifier, 'test');
    changeTextFieldValue(descriptionIdentifier, 'test');
    changeTextFieldValue(endpointIdentifier, 'https://test.com');

    findTestSubject(component, 'createDataSourceButton').simulate('click');

    expect(component).toMatchSnapshot();
    expect(mockSubmitHandler).toHaveBeenCalled(); // should call submit as all fields are valid
  });
});
