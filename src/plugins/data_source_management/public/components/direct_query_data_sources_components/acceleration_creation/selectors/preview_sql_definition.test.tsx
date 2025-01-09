/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { PreviewSQLDefinition } from './preview_sql_definition';
import { EuiButton } from '@elastic/eui';
import { coreMock } from '../../../../../../../core/public/mocks';
import { formValidator, hasError } from '../create/utils';

jest.mock('../visual_editors/query_builder', () => ({
  accelerationQueryBuilder: jest.fn(() => 'mocked SQL query'),
}));

jest.mock('../create/utils', () => ({
  formValidator: jest.fn(() => ({})),
  hasError: jest.fn(() => false),
}));

describe('PreviewSQLDefinition', () => {
  const mockCoreStart = coreMock.createStart();
  const mockAccelerationFormData = {
    dataSource: 'test_source',
    formErrors: {},
  };

  const mockSetAccelerationFormData = jest.fn();
  const mockResetFlyout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCoreStart.http.get.mockResolvedValue({
      status: {
        statuses: [{ id: 'plugin:queryWorkbenchDashboards' }],
      },
    });
  });

  const mountComponent = async () => {
    const wrapper = mount(
      <PreviewSQLDefinition
        accelerationFormData={mockAccelerationFormData}
        setAccelerationFormData={mockSetAccelerationFormData}
        resetFlyout={mockResetFlyout}
        notifications={mockCoreStart.notifications}
        application={mockCoreStart.application}
        http={mockCoreStart.http}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });
    wrapper.update();

    return wrapper;
  };

  test('renders component correctly', async () => {
    const wrapper = await mountComponent();
    expect(wrapper).toMatchSnapshot();
  });

  test('opens SQL Workbench when button is clicked', async () => {
    const wrapper = await mountComponent();

    const button = wrapper.findWhere(
      (node) => node.type() === EuiButton && node.prop('data-test-subj') === 'workbenchButton'
    );

    expect(button.exists()).toBe(true);
    expect(button.length).toBe(1);

    await act(async () => {
      button.prop('onClick')();
      await Promise.resolve();
    });

    expect(mockCoreStart.application.navigateToApp).toHaveBeenCalledWith(expect.any(String), {
      path: '#/test_source',
      state: {
        language: 'sql',
        queryToRun: 'mocked SQL query',
      },
    });
    expect(mockResetFlyout).toHaveBeenCalled();
  });

  test('displays error toast if SQL Workbench plugin check fails', async () => {
    mockCoreStart.http.get.mockRejectedValueOnce(new Error('Error checking plugin'));

    await mountComponent();

    expect(mockCoreStart.notifications.toasts.addDanger).toHaveBeenCalledWith(
      'Error checking Query Workbench Plugin Installation status.'
    );
  });

  test('shows update preview button when form data changes', async () => {
    const wrapper = await mountComponent();

    const previewButton = wrapper.findWhere(
      (node) => node.type() === EuiButton && node.text().includes('Generate preview')
    );

    await act(async () => {
      previewButton.prop('onClick')();
      await Promise.resolve();
    });

    await act(async () => {
      wrapper.setProps({
        accelerationFormData: { ...mockAccelerationFormData, dataSource: 'new_source' },
      });
      await Promise.resolve();
    });
    wrapper.update();

    const updateButton = wrapper.findWhere(
      (node) => node.type() === EuiButton && node.text().includes('Update preview')
    );

    expect(updateButton.exists()).toBe(true);
  });

  test('validates form before opening SQL Workbench', async () => {
    // Mock form validation to return errors
    (formValidator as jest.Mock).mockReturnValueOnce({ someField: 'error' });
    (hasError as jest.Mock).mockReturnValueOnce(true);

    const wrapper = await mountComponent();

    const button = wrapper.findWhere(
      (node) => node.type() === EuiButton && node.prop('data-test-subj') === 'workbenchButton'
    );

    await act(async () => {
      button.prop('onClick')();
      await Promise.resolve();
    });

    expect(mockCoreStart.application.navigateToApp).not.toHaveBeenCalled();
    expect(mockSetAccelerationFormData).toHaveBeenCalledWith({
      ...mockAccelerationFormData,
      formErrors: { someField: 'error' },
    });
  });

  test('hides SQL Workbench button when plugin is not installed', async () => {
    mockCoreStart.http.get.mockResolvedValueOnce({
      status: {
        statuses: [{ id: 'some-other-plugin' }],
      },
    });

    const wrapper = await mountComponent();

    const button = wrapper.findWhere(
      (node) => node.type() === EuiButton && node.prop('data-test-subj') === 'workbenchButton'
    );

    expect(button.exists()).toBe(false);
  });
});
