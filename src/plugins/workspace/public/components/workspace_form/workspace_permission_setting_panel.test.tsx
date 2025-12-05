/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import {
  WorkspacePermissionSettingPanel,
  WorkspacePermissionSettingPanelProps,
} from './workspace_permission_setting_panel';
import { WorkspacePermissionItemType } from './constants';
import { WorkspacePermissionMode } from '../../../../../core/public';

const setup = (options?: Partial<WorkspacePermissionSettingPanelProps>) => {
  const onChangeMock = jest.fn();
  const permissionSettings = [
    {
      id: 0,
      type: WorkspacePermissionItemType.User,
      userId: 'foo',
      modes: [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
    },
    {
      id: 1,
      type: WorkspacePermissionItemType.Group,
      group: 'bar',
      modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Read],
    },
  ];
  const renderResult = render(
    <WorkspacePermissionSettingPanel
      disabledUserOrGroupInputIds={[]}
      permissionSettings={permissionSettings}
      onChange={onChangeMock}
      {...options}
    />
  );
  return {
    renderResult,
    onChangeMock,
  };
};

describe('WorkspacePermissionSettingInput', () => {
  const originalOffsetHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'offsetHeight'
  );
  const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');

  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 600,
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      value: 600,
    });
  });

  afterEach(() => {
    Object.defineProperty(
      HTMLElement.prototype,
      'offsetHeight',
      originalOffsetHeight as PropertyDescriptor
    );
    Object.defineProperty(
      HTMLElement.prototype,
      'offsetWidth',
      originalOffsetWidth as PropertyDescriptor
    );
  });

  it('should render consistent user and group permissions', () => {
    const { renderResult } = setup();

    expect(renderResult.getByDisplayValue('foo')).toBeInTheDocument();
    expect(renderResult.getByText('Read only')).toBeInTheDocument();

    expect(renderResult.getByDisplayValue('bar')).toBeInTheDocument();
    expect(renderResult.getByText('Read and write')).toBeInTheDocument();
  });

  it('should call onChange with new user permission modes', () => {
    const { renderResult, onChangeMock } = setup();

    expect(onChangeMock).not.toHaveBeenCalled();
    fireEvent.click(renderResult.getAllByTestId('workspace-permissionModeOptions')[0]);
    fireEvent.click(renderResult.getAllByText('Read and write')[1]);
    expect(onChangeMock).toHaveBeenCalledWith([
      {
        id: 0,
        type: WorkspacePermissionItemType.User,
        userId: 'foo',
        modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Read],
      },
      {
        id: 1,
        type: WorkspacePermissionItemType.Group,
        group: 'bar',
        modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Read],
      },
    ]);
  });
  it('should call onChange with new group permission modes', () => {
    const { renderResult, onChangeMock } = setup();

    expect(onChangeMock).not.toHaveBeenCalled();

    fireEvent.click(renderResult.getAllByTestId('workspace-permissionModeOptions')[1]);
    fireEvent.click(renderResult.getByText('Admin'));
    expect(onChangeMock).toHaveBeenCalledWith([
      {
        id: 0,
        type: WorkspacePermissionItemType.User,
        userId: 'foo',
        modes: [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
      },
      {
        id: 1,
        type: WorkspacePermissionItemType.Group,
        group: 'bar',
        modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
      },
    ]);
  });
  it('should call onChange with new user type', () => {
    const { renderResult, onChangeMock } = setup();
    expect(onChangeMock).not.toHaveBeenCalled();

    waitFor(() => {
      fireEvent.click(renderResult.getAllByTestId('workspace-typeOptions')[1]);
      fireEvent.click(renderResult.getAllByText('User')[1]);
      expect(onChangeMock).toHaveBeenCalledWith([
        {
          id: 0,
          type: WorkspacePermissionItemType.User,
          userId: 'foo',
          modes: ['library_read', 'read'],
        },
        {
          id: 1,
          type: WorkspacePermissionItemType.User,
          modes: ['library_write', 'read'],
        },
      ]);
    });
  });
  it('should call onChange with new group type', () => {
    const { renderResult, onChangeMock } = setup();

    expect(onChangeMock).not.toHaveBeenCalled();
    waitFor(() => {
      fireEvent.click(renderResult.getAllByTestId('workspace-typeOptions')[0]);
      fireEvent.click(renderResult.getAllByText('Group')[0]);
      expect(onChangeMock).toHaveBeenCalledWith([
        {
          id: 0,
          type: WorkspacePermissionItemType.Group,
          modes: ['library_read', 'read'],
        },
        {
          id: 1,
          type: WorkspacePermissionItemType.Group,
          group: 'bar',
          modes: ['library_write', 'read'],
        },
      ]);
    });
  });

  it('should call onChange with new user permission setting after add new button click', () => {
    const { renderResult, onChangeMock } = setup({
      permissionSettings: [],
    });

    expect(onChangeMock).not.toHaveBeenCalled();
    fireEvent.click(renderResult.getByTestId('workspaceForm-permissionSettingPanel-addNew'));
    expect(onChangeMock).toHaveBeenCalledWith([
      {
        id: 0,
        type: WorkspacePermissionItemType.User,
        modes: [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
      },
    ]);
  });

  it('should call onChange with user permission setting after delete button click', () => {
    const { renderResult, onChangeMock } = setup();

    expect(onChangeMock).not.toHaveBeenCalled();
    fireEvent.click(renderResult.getAllByLabelText('Delete permission setting')[0]);
    expect(onChangeMock).toHaveBeenCalledWith([
      {
        id: 1,
        type: WorkspacePermissionItemType.Group,
        group: 'bar',
        modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Read],
      },
    ]);
  });

  it('should call onGroupOrUserIdChange after user value changed', () => {
    const { renderResult, onChangeMock } = setup();

    expect(onChangeMock).not.toHaveBeenCalled();
    const inputElement = renderResult.getByDisplayValue('foo');
    fireEvent.change(inputElement, { target: { value: 'fooo' } });
    expect(onChangeMock).toHaveBeenCalled();
  });

  it('should not able to edit user or group when disabled', () => {
    const { renderResult } = setup({
      permissionSettings: [
        {
          id: 0,
          type: WorkspacePermissionItemType.User,
          userId: 'user-1',
          modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
        },
        {
          id: 1,
          type: WorkspacePermissionItemType.Group,
          group: 'user-group-1',
          modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
        },
      ],
      disabledUserOrGroupInputIds: [0, 1],
    });

    expect(renderResult.getByDisplayValue('user-1')).toBeDisabled();
    expect(renderResult.getByDisplayValue('user-group-1')).toBeDisabled();
  });

  it('should render consistent errors', () => {
    const { renderResult } = setup({
      errors: {
        '0': { code: 0, message: 'User permission setting error' },
        '1': { code: 0, message: 'Group permission setting error' },
      },
    });
    expect(renderResult.container.querySelectorAll('.euiFormErrorText')[0]).toHaveTextContent(
      'User permission setting error'
    );
    expect(renderResult.container.querySelectorAll('.euiFormErrorText')[1]).toHaveTextContent(
      'Group permission setting error'
    );
  });
});
