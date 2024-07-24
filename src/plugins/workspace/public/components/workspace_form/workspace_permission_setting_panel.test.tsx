/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import {
  WorkspacePermissionSettingPanel,
  WorkspacePermissionSettingPanelProps,
} from './workspace_permission_setting_panel';
import { WorkspacePermissionItemType } from './constants';
import { WorkspacePermissionMode } from '../../../common/constants';

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
  it('should render consistent user and group permissions', () => {
    const { renderResult } = setup();

    expect(renderResult.getByText('foo')).toBeInTheDocument();
    expect(
      renderResult.getAllByText('Read')[0].closest('.euiButtonGroupButton-isSelected')
    ).toBeInTheDocument();

    expect(renderResult.getByText('bar')).toBeInTheDocument();
    expect(
      renderResult.getAllByText('Read & Write')[1].closest('.euiButtonGroupButton-isSelected')
    ).toBeInTheDocument();
  });

  it('should call onChange with new user permission modes', () => {
    const { renderResult, onChangeMock } = setup();

    expect(onChangeMock).not.toHaveBeenCalled();
    fireEvent.click(renderResult.getAllByText('Read & Write')[0]);
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
    fireEvent.click(renderResult.getAllByText('Owner')[1]);
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

  it('should call onChange with new user permission setting after add new button click', () => {
    const { renderResult, onChangeMock } = setup({
      permissionSettings: [],
    });

    expect(onChangeMock).not.toHaveBeenCalled();
    fireEvent.click(renderResult.getByTestId('workspaceForm-permissionSettingPanel-user-addNew'));
    expect(onChangeMock).toHaveBeenCalledWith([
      {
        id: 0,
        type: WorkspacePermissionItemType.User,
        modes: [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
      },
    ]);
  });

  it('should call onChange with new group permission setting after add new button click', () => {
    const { renderResult, onChangeMock } = setup({
      permissionSettings: [],
    });

    expect(onChangeMock).not.toHaveBeenCalled();
    fireEvent.click(renderResult.getByTestId('workspaceForm-permissionSettingPanel-group-addNew'));
    expect(onChangeMock).toHaveBeenCalledWith([
      {
        id: 0,
        type: WorkspacePermissionItemType.Group,
        modes: [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
      },
    ]);
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

    expect(renderResult.getByText('user-1')?.closest('div[role="combobox"]')).toHaveClass(
      'euiComboBox-isDisabled'
    );
    expect(renderResult.getByText('user-group-1')?.closest('div[role="combobox"]')).toHaveClass(
      'euiComboBox-isDisabled'
    );
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
