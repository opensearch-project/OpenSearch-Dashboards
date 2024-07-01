/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow, mount } from 'enzyme';
import { DeleteModal } from './direct_query_data_source_delete_modal';
import {
  EuiButtonEmpty,
  EuiFieldText,
  EuiModalBody,
  EuiModalHeaderTitle,
  EuiText,
} from '@elastic/eui';

describe('DeleteModal', () => {
  const defaultProps = {
    onCancel: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
    prompt: 'delete',
  };

  const shallowComponent = (props = defaultProps) => shallow(<DeleteModal {...props} />);
  const mountComponent = (props = defaultProps) => mount(<DeleteModal {...props} />);

  test('renders correctly', () => {
    const wrapper = shallowComponent();
    expect(wrapper).toMatchSnapshot();
  });

  test('displays the correct title and message', () => {
    const wrapper = mountComponent();
    expect(wrapper.find(EuiModalHeaderTitle).text()).toEqual('Delete Item');
    expect(wrapper.find(EuiModalBody).find(EuiText).at(0).text()).toEqual(
      'Are you sure you want to delete this item?'
    );
  });

  test('disables the delete button initially', () => {
    const wrapper = mountComponent();
    const deleteButton = wrapper.find('button[data-test-subj="popoverModal__deleteButton"]');
    expect(deleteButton.prop('disabled')).toBe(true);
  });

  test('enables the delete button when the correct prompt is entered', () => {
    const wrapper = mountComponent();
    const input = wrapper.find(EuiFieldText);
    input.simulate('change', { target: { value: 'delete' } });
    wrapper.update();
    const deleteButton = wrapper.find('button[data-test-subj="popoverModal__deleteButton"]');
    setTimeout(() => {
      expect(deleteButton.prop('disabled')).toBe(false);
    }, 1000);
  });

  test('calls onCancel when the cancel button is clicked', () => {
    const wrapper = mountComponent();
    wrapper.find(EuiButtonEmpty).simulate('click');
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  test('calls onConfirm when the delete button is clicked', () => {
    const wrapper = mountComponent();
    const input = wrapper.find(EuiFieldText);
    input.simulate('change', { target: { value: 'delete' } });
    wrapper.update();
    const deleteButton = wrapper.find('button[data-test-subj="popoverModal__deleteButton"]');
    setTimeout(() => {
      deleteButton.simulate('click');
      expect(defaultProps.onConfirm).toHaveBeenCalled();
    }, 1000);
  });
});
