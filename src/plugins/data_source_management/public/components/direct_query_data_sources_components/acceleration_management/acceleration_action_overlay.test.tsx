/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow, mount } from 'enzyme';
import { EuiConfirmModal, EuiFieldText } from '@elastic/eui';
import {
  AccelerationActionOverlay,
  AccelerationActionOverlayProps,
} from './acceleration_action_overlay';
import { ACC_DELETE_MSG, ACC_VACUUM_MSG, ACC_SYNC_MSG } from './acceleration_utils';
import { CachedAcceleration } from '../../../../framework/types';
import { act } from 'react-dom/test-utils';

const mockAcceleration: CachedAcceleration = {
  flintIndexName: 'flint_index',
  type: 'covering',
  database: 'default',
  table: 'test_table',
  indexName: 'actual_index',
  autoRefresh: false,
  status: 'active',
};

describe('AccelerationActionOverlay', () => {
  const defaultProps: AccelerationActionOverlayProps = {
    isVisible: true,
    actionType: 'delete',
    acceleration: mockAcceleration,
    dataSourceName: 'test_data_source',
    onCancel: jest.fn(),
    onConfirm: jest.fn(),
  };

  const shallowComponent = (props = defaultProps) =>
    shallow(<AccelerationActionOverlay {...props} />);
  const mountComponent = (props = defaultProps) => mount(<AccelerationActionOverlay {...props} />);

  test('renders correctly', () => {
    const wrapper = shallowComponent();
    expect(wrapper).toMatchSnapshot();
  });

  test('displays the correct title and description for delete action', () => {
    const wrapper = shallowComponent();
    expect(wrapper.find(EuiConfirmModal).prop('title')).toEqual(
      `Delete acceleration ${mockAcceleration.indexName} on ${defaultProps.dataSourceName}.${mockAcceleration.database}.${mockAcceleration.table} ?`
    );
    expect(wrapper.find(EuiConfirmModal).find('p').text()).toEqual(
      ACC_DELETE_MSG(mockAcceleration.indexName)
    );
  });

  test('displays the correct title and description for vacuum action', () => {
    const props = { ...defaultProps, actionType: 'vacuum' };
    const wrapper = shallowComponent(props);
    expect(wrapper.find(EuiConfirmModal).prop('title')).toEqual(
      `Vacuum acceleration ${mockAcceleration.indexName} on ${defaultProps.dataSourceName}.${mockAcceleration.database}.${mockAcceleration.table} ?`
    );
    expect(wrapper.find(EuiConfirmModal).find('p').text()).toEqual(ACC_VACUUM_MSG);
  });

  test('displays the correct title and description for sync action', () => {
    const props = { ...defaultProps, actionType: 'sync' };
    const wrapper = shallowComponent(props);
    expect(wrapper.find(EuiConfirmModal).prop('title')).toEqual('Manual sync data?');
    expect(wrapper.find(EuiConfirmModal).find('p').text()).toEqual(ACC_SYNC_MSG);
  });

  test('calls onCancel when cancel button is clicked', () => {
    const wrapper = mountComponent();
    wrapper.find(EuiConfirmModal).prop('onCancel')();
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  test('calls onConfirm when confirm button is clicked', () => {
    const wrapper = mountComponent();
    wrapper.find(EuiConfirmModal).prop('onConfirm')();
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  test('disables confirm button when confirmation input does not match for vacuum action', () => {
    const props = { ...defaultProps, actionType: 'vacuum' };
    const wrapper = mountComponent(props);
    const confirmButton = wrapper
      .find(EuiConfirmModal)
      .find('button[data-test-subj="confirmModalConfirmButton"]');
    expect(confirmButton.prop('disabled')).toBe(true);
  });

  test('enables confirm button when confirmation input matches for vacuum action', async () => {
    const props = { ...defaultProps, actionType: 'vacuum' };
    const wrapper = mountComponent(props);

    await act(async () => {
      wrapper
        .find(EuiFieldText)
        .simulate('change', { target: { value: mockAcceleration.indexName } });
      wrapper.update();
    });

    setTimeout(() => {
      const confirmButton = wrapper
        .find(EuiConfirmModal)
        .find('button[data-test-subj="confirmModalConfirmButton"]');
      expect(confirmButton.prop('disabled')).toBe(false);
    }, 0);
  });
});
