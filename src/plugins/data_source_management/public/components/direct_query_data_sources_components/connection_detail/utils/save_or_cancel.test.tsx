/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { SaveOrCancel } from './save_or_cancel';
import { EuiBottomBar, EuiButton, EuiButtonEmpty } from '@elastic/eui';

describe('SaveOrCancel', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  const shallowComponent = () =>
    shallow(<SaveOrCancel onSave={mockOnSave} onCancel={mockOnCancel} />);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly', () => {
    const wrapper = shallowComponent();
    expect(wrapper).toMatchSnapshot();
  });

  test('renders EuiBottomBar component', () => {
    const wrapper = shallowComponent();
    expect(wrapper.find(EuiBottomBar).exists()).toBe(true);
  });

  test('renders Save button with correct props', () => {
    const wrapper = shallowComponent();
    const saveButton = wrapper.find(EuiButton);
    expect(saveButton.exists()).toBe(true);
    expect(saveButton.prop('size')).toBe('s');
    expect(saveButton.prop('iconType')).toBe('check');
    expect(saveButton.prop('fill')).toBe(true);
    expect(saveButton.children().text()).toBe('Save');
  });

  test('renders Discard button with correct props', () => {
    const wrapper = shallowComponent();
    const discardButton = wrapper.find(EuiButtonEmpty);
    expect(discardButton.exists()).toBe(true);
    expect(discardButton.prop('size')).toBe('s');
    expect(discardButton.prop('iconType')).toBe('cross');
    expect(discardButton.prop('color')).toBe('ghost');
    expect(discardButton.children().text()).toBe('Discard change(s)');
  });

  test('calls onSave when Save button is clicked', () => {
    const wrapper = shallowComponent();
    wrapper.find(EuiButton).simulate('click');
    expect(mockOnSave).toHaveBeenCalled();
  });

  test('calls onCancel when Discard button is clicked', () => {
    const wrapper = shallowComponent();
    wrapper.find(EuiButtonEmpty).simulate('click');
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
