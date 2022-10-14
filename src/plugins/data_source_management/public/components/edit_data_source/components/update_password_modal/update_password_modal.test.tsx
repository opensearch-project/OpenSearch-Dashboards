/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { mount, ReactWrapper } from 'enzyme';
import React from 'react';
import { UpdatePasswordModal } from './update_password_modal';
import { wrapWithIntl } from 'test_utils/enzyme_helpers';
import { OpenSearchDashboardsContextProvider } from '../../../../../../opensearch_dashboards_react/public';
import { mockManagementPlugin } from '../../../../mocks';

const usernameIdentifier = '[data-test-subj="data-source-update-password-username"]';
const confirmBtnIdentifier = '[data-test-subj="updateStoredPasswordConfirmBtn"]';
const cancelBtnIdentifier = '[data-test-subj="updateStoredPasswordCancelBtn"]';
const updatedPasswordFieldIdentifier =
  '[data-test-subj="updateStoredPasswordUpdatedPasswordField"]';
const confirmUpdatedPasswordFieldIdentifier =
  '[data-test-subj="updateStoredPasswordConfirmUpdatedPasswordField"]';
describe('Datasource Management: Update Stored Password Modal', () => {
  let component: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  const mockedContext = mockManagementPlugin.createDataSourceManagementContext();
  const mockUserName = 'test_user';
  const mockFn = jest.fn();

  beforeEach(async () => {
    component = mount(
      wrapWithIntl(
        <UpdatePasswordModal
          username={mockUserName}
          handleUpdatePassword={mockFn}
          closeUpdatePasswordModal={mockFn}
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
    expect(component).toMatchSnapshot();
    expect(component.find(usernameIdentifier).last().text()).toBe(mockUserName);
    expect(component.find(confirmBtnIdentifier).last().props().disabled).toBe(true);
  });

  test('should close modal when cancel button is clicked', () => {
    component.find(cancelBtnIdentifier).last().simulate('click');
    expect(mockFn).toHaveBeenCalled();
  });

  /* Validations */
  test('should show validation error on blur on Confirm Password field & remove existing error when input is provided and onblur is called', () => {
    // @ts-ignore
    component.find(updatedPasswordFieldIdentifier).last().simulate('focus').simulate('blur');
    component.update();
    expect(component.find(updatedPasswordFieldIdentifier).first().prop('isInvalid')).toBe(true);
    expect(component.find(confirmBtnIdentifier).last().props().disabled).toBe(true);

    // @ts-ignore
    component
      .find(updatedPasswordFieldIdentifier)
      .last()
      .simulate('change', { target: { value: 'abc' } })
      .simulate('blur');
    expect(component.find(updatedPasswordFieldIdentifier).first().prop('isInvalid')).toBe(false);
  });
  test('should show validation error on blur on Confirm Password fields & remove existing error when input is provided and onblur is called', () => {
    /* Set updated Password field*/

    // @ts-ignore
    component
      .find(updatedPasswordFieldIdentifier)
      .last()
      .simulate('change', { target: { value: 'abc' } })
      .simulate('blur');

    // @ts-ignore
    component.find(confirmUpdatedPasswordFieldIdentifier).last().simulate('blur');

    expect(component.find(confirmUpdatedPasswordFieldIdentifier).first().prop('isInvalid')).toBe(
      true
    );

    /* Password not match */
    // @ts-ignore
    component
      .find(confirmUpdatedPasswordFieldIdentifier)
      .last()
      .simulate('change', { target: { value: 'ab' } })
      .simulate('blur');
    expect(component.find(confirmUpdatedPasswordFieldIdentifier).first().prop('isInvalid')).toBe(
      true
    );

    /* Valid passwords */
    // @ts-ignore
    component
      .find(confirmUpdatedPasswordFieldIdentifier)
      .last()
      .simulate('change', { target: { value: 'abc' } })
      .simulate('blur');
    expect(component.find(confirmUpdatedPasswordFieldIdentifier).first().prop('isInvalid')).toBe(
      false
    );
  });
  test('should update password when form is valid', () => {
    // @ts-ignore
    component
      .find(updatedPasswordFieldIdentifier)
      .last()
      .simulate('change', { target: { value: 'abc' } })
      .simulate('blur');

    component
      .find(confirmUpdatedPasswordFieldIdentifier)
      .last()
      .simulate('change', { target: { value: 'abc' } })
      .simulate('blur');

    expect(component.find(updatedPasswordFieldIdentifier).first().prop('isInvalid')).toBe(false);
    component.find(confirmBtnIdentifier).last().simulate('click');
    expect(mockFn).toHaveBeenCalled();
  });
});
