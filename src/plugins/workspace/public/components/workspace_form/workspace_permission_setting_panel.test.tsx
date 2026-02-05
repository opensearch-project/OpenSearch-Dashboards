/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
// @ts-expect-error TS6133 TODO(ts-error): fixme
import { fireEvent, render, waitFor, act } from '@testing-library/react';
import {
  WorkspacePermissionSettingPanel,
  WorkspacePermissionSettingPanelProps,
} from './workspace_permission_setting_panel';
import { WorkspacePermissionItemType } from './constants';
import { WorkspacePermissionMode } from '../../../../../core/public';

// Enable React 18 concurrent mode for act() support
// @ts-expect-error TS7017 TODO(ts-error): fixme
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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
    jest.useFakeTimers();
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 600,
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      value: 600,
    });
  });

  afterEach(async () => {
    // Flush any pending timers/animation frames from EuiPopover
    await act(async () => {
      jest.runAllTimers();
    });
    jest.useRealTimers();
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

  it('should render consistent user and group permissions', async () => {
    const { renderResult } = setup();

    await act(async () => {
      jest.runAllTimers();
    });

    expect(renderResult.getByDisplayValue('foo')).toBeInTheDocument();
    expect(renderResult.getByText('Read only')).toBeInTheDocument();

    expect(renderResult.getByDisplayValue('bar')).toBeInTheDocument();
    expect(renderResult.getByText('Read and write')).toBeInTheDocument();
  });

  it('should call onChange with new user permission modes', async () => {
    const { renderResult, onChangeMock } = setup();

    expect(onChangeMock).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(renderResult.getAllByTestId('workspace-permissionModeOptions')[0]);
      jest.runAllTimers();
    });
    await act(async () => {
      fireEvent.click(renderResult.getAllByText('Read and write')[1]);
      jest.runAllTimers();
    });
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
  it('should call onChange with new group permission modes', async () => {
    const { renderResult, onChangeMock } = setup();

    expect(onChangeMock).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(renderResult.getAllByTestId('workspace-permissionModeOptions')[1]);
      jest.runAllTimers();
    });
    await act(async () => {
      fireEvent.click(renderResult.getByText('Admin'));
      jest.runAllTimers();
    });
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
  it('should call onChange with new user type', async () => {
    const { renderResult, onChangeMock } = setup();
    expect(onChangeMock).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(renderResult.getAllByTestId('workspace-typeOptions')[1]);
      jest.runAllTimers();
    });
    await act(async () => {
      fireEvent.click(renderResult.getAllByText('User')[1]);
      jest.runAllTimers();
    });
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
  it('should call onChange with new group type', async () => {
    const { renderResult, onChangeMock } = setup();

    expect(onChangeMock).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(renderResult.getAllByTestId('workspace-typeOptions')[0]);
      jest.runAllTimers();
    });
    await act(async () => {
      fireEvent.click(renderResult.getAllByText('Group')[1]);
      jest.runAllTimers();
    });
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

  it('should call onChange with new user permission setting after add new button click', async () => {
    const { renderResult, onChangeMock } = setup({
      permissionSettings: [],
    });

    await act(async () => {
      jest.runAllTimers();
    });

    expect(onChangeMock).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(renderResult.getByTestId('workspaceForm-permissionSettingPanel-addNew'));
      jest.runAllTimers();
    });
    expect(onChangeMock).toHaveBeenCalledWith([
      {
        id: 0,
        type: WorkspacePermissionItemType.User,
        modes: [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
      },
    ]);
  });

  it('should call onChange with user permission setting after delete button click', async () => {
    const { renderResult, onChangeMock } = setup();

    await act(async () => {
      jest.runAllTimers();
    });

    expect(onChangeMock).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(renderResult.getAllByLabelText('Delete permission setting')[0]);
      jest.runAllTimers();
    });
    expect(onChangeMock).toHaveBeenCalledWith([
      {
        id: 1,
        type: WorkspacePermissionItemType.Group,
        group: 'bar',
        modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Read],
      },
    ]);
  });

  it('should call onGroupOrUserIdChange after user value changed', async () => {
    const { renderResult, onChangeMock } = setup();

    await act(async () => {
      jest.runAllTimers();
    });

    expect(onChangeMock).not.toHaveBeenCalled();
    const inputElement = renderResult.getByDisplayValue('foo');
    await act(async () => {
      fireEvent.change(inputElement, { target: { value: 'fooo' } });
      jest.runAllTimers();
    });
    expect(onChangeMock).toHaveBeenCalled();
  });

  it('should not able to edit user or group when disabled', async () => {
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

    await act(async () => {
      jest.runAllTimers();
    });

    expect(renderResult.getByDisplayValue('user-1')).toBeDisabled();
    expect(renderResult.getByDisplayValue('user-group-1')).toBeDisabled();
  });

  it('should render consistent errors', async () => {
    const { renderResult } = setup({
      errors: {
        '0': { code: 0, message: 'User permission setting error' },
        '1': { code: 0, message: 'Group permission setting error' },
      },
    });

    await act(async () => {
      jest.runAllTimers();
    });

    expect(renderResult.container.querySelectorAll('.euiFormErrorText')[0]).toHaveTextContent(
      'User permission setting error'
    );
    expect(renderResult.container.querySelectorAll('.euiFormErrorText')[1]).toHaveTextContent(
      'Group permission setting error'
    );
  });
});
