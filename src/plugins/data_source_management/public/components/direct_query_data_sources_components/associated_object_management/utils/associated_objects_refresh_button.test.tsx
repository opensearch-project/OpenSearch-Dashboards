/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow, mount } from 'enzyme';
import { AssociatedObjectsRefreshButton } from './associated_objects_refresh_button';
import { EuiButton } from '@elastic/eui';
import { ASSC_OBJ_REFRESH_BTN } from './associated_objects_tab_utils';

describe('AssociatedObjectsRefreshButton', () => {
  const defaultProps = {
    isLoading: false,
    onClick: jest.fn(),
  };

  const shallowComponent = (props = defaultProps) =>
    shallow(<AssociatedObjectsRefreshButton {...props} />);
  const mountComponent = (props = defaultProps) =>
    mount(<AssociatedObjectsRefreshButton {...props} />);

  test('renders correctly', () => {
    const wrapper = shallowComponent();
    expect(wrapper).toMatchSnapshot();
  });

  test('displays the correct button text', () => {
    const wrapper = mountComponent();
    expect(wrapper.find(EuiButton).text()).toEqual(ASSC_OBJ_REFRESH_BTN);
  });

  test('is disabled and shows loading state when isLoading is true', () => {
    const wrapper = mountComponent({ ...defaultProps, isLoading: true });
    const button = wrapper.find(EuiButton);
    expect(button.prop('isDisabled')).toBe(true);
    expect(button.prop('isLoading')).toBe(true);
  });

  test('is enabled and not loading when isLoading is false', () => {
    const wrapper = mountComponent();
    const button = wrapper.find(EuiButton);
    expect(button.prop('isDisabled')).toBe(false);
    expect(button.prop('isLoading')).toBe(false);
  });

  test('calls onClick when button is clicked', () => {
    const wrapper = mountComponent();
    wrapper.find(EuiButton).simulate('click');
    expect(defaultProps.onClick).toHaveBeenCalled();
  });
});
