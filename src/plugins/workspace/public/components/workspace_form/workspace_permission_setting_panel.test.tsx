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
      lastAdminItemDeletable={true}
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
    fireEvent.click(renderResult.getAllByText('Admin')[1]);
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

  it('should not able to delete last user admin permission setting', () => {
    const { renderResult } = setup({
      lastAdminItemDeletable: false,
      permissionSettings: [
        {
          id: 0,
          type: WorkspacePermissionItemType.User,
          userId: 'foo',
          modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
        },
      ],
    });

    expect(renderResult.getByLabelText('Delete permission setting')).toBeDisabled();
  });

  it('should not able to delete last group admin permission setting', () => {
    const { renderResult } = setup({
      lastAdminItemDeletable: false,
      permissionSettings: [
        {
          id: 0,
          type: WorkspacePermissionItemType.Group,
          group: 'bar',
          modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
        },
      ],
    });

    expect(renderResult.getByLabelText('Delete permission setting')).toBeDisabled();
  });

  it('should able to delete permission setting if more than one admin permission', () => {
    const { renderResult } = setup({
      lastAdminItemDeletable: false,
      permissionSettings: [
        {
          id: 0,
          type: WorkspacePermissionItemType.User,
          userId: 'foo',
          modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
        },
        {
          id: 0,
          type: WorkspacePermissionItemType.Group,
          group: 'bar',
          modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
        },
      ],
    });

    expect(renderResult.getAllByLabelText('Delete permission setting')[0]).not.toBeDisabled();
    expect(renderResult.getAllByLabelText('Delete permission setting')[1]).not.toBeDisabled();
  });

  it('should render consistent errors', () => {
    const { renderResult } = setup({
      errors: { '0': 'User permission setting error', '1': 'Group permission setting error' },
    });
    expect(renderResult.container.querySelectorAll('.euiFormRow')[0]).toHaveTextContent(
      'User permission setting error'
    );
    expect(renderResult.container.querySelectorAll('.euiFormRow')[1]).toHaveTextContent(
      'Group permission setting error'
    );
  });
});
