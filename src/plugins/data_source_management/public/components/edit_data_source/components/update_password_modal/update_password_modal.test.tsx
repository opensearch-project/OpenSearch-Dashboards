/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { mount, ReactWrapper } from 'enzyme';
import React from 'react';
import { UpdatePasswordModal } from './update_password_modal';

const usernameIdentifier = '[data-test-subj="data-source-update-password-username"]';
const confirmBtnIdentifier = '[data-test-subj="updateStoredPasswordConfirmBtn"]';
const cancelBtnIdentifier = '[data-test-subj="updateStoredPasswordCancelBtn"]';
const updatedPasswordFieldIdentifier =
  '[data-test-subj="updateStoredPasswordUpdatedPasswordField"]';
const confirmUpdatedPasswordFieldIdentifier =
  '[data-test-subj="updateStoredPasswordConfirmUpdatedPasswordField"]';
describe('Datasource Management: Update Stored Password Modal', () => {
  let component: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  const mockUserName = 'test_user';
  const mockFn = jest.fn();

  beforeEach(async () => {
    component = mount(
      <UpdatePasswordModal
        username={mockUserName}
        handleUpdatePassword={mockFn}
        closeUpdatePasswordModal={mockFn}
      />
    );
  });

  test('should render normally', () => {
    expect(component).toMatchSnapshot();
    expect(component.find(usernameIdentifier).last().text()).toBe(mockUserName);
    expect(component.find(confirmBtnIdentifier).last().props().disabled).toBe(true);
  });

  test('should close modal when cancel button is clicked', () => {
    spyOn(component.props(), 'closeUpdatePasswordModal').and.callThrough();
    component.find(cancelBtnIdentifier).last().simulate('click');
    expect(component.props().closeUpdatePasswordModal).toHaveBeenCalled();
  });

  /* Validations */
  test('should show validation error on blur on Confirm Password field & remove existing error when input is provided and onblur is called', () => {
    // @ts-ignore
    component.find(updatedPasswordFieldIdentifier).last().simulate('blur');

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
    spyOn(component.props(), 'handleUpdatePassword').and.callThrough();
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
    expect(component.props().handleUpdatePassword).toHaveBeenCalled();
  });
});
