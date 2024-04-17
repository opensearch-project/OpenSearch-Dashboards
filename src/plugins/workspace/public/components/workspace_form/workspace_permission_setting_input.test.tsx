/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import {
  WorkspacePermissionSettingInput,
  WorkspacePermissionSettingInputProps,
} from './workspace_permission_setting_input';
import { WorkspacePermissionItemType } from './constants';
import { WorkspacePermissionMode } from '../../../common/constants';

const setup = (options?: Partial<WorkspacePermissionSettingInputProps>) => {
  const onGroupOrUserIdChangeMock = jest.fn();
  const onPermissionModesChangeMock = jest.fn();
  const onDeleteMock = jest.fn();
  const renderResult = render(
    <WorkspacePermissionSettingInput
      index={0}
      deletable
      type={WorkspacePermissionItemType.User}
      onGroupOrUserIdChange={onGroupOrUserIdChangeMock}
      onPermissionModesChange={onPermissionModesChangeMock}
      onDelete={onDeleteMock}
      {...options}
    />
  );
  return {
    renderResult,
    onGroupOrUserIdChangeMock,
    onPermissionModesChangeMock,
    onDeleteMock,
  };
};

describe('WorkspacePermissionSettingInput', () => {
  it('should render consistent user id and permission modes', () => {
    const { renderResult } = setup({
      userId: 'foo',
      modes: [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
    });

    expect(renderResult.getByText('foo')).toBeInTheDocument();
    expect(renderResult.getByText('Read')).toBeInTheDocument();
    expect(
      renderResult.getByText('Read').closest('.euiButtonGroupButton-isSelected')
    ).toBeInTheDocument();
  });
  it('should render consistent group id and permission modes', () => {
    const { renderResult } = setup({
      type: WorkspacePermissionItemType.Group,
      group: 'bar',
      modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Read],
    });

    expect(renderResult.getByText('bar')).toBeInTheDocument();
    expect(renderResult.getByText('Read & Write')).toBeInTheDocument();
    expect(
      renderResult.getByText('Read & Write').closest('.euiButtonGroupButton-isSelected')
    ).toBeInTheDocument();
  });
  it('should call onGroupOrUserIdChange with user id', () => {
    const { renderResult, onGroupOrUserIdChangeMock } = setup();

    expect(onGroupOrUserIdChangeMock).not.toHaveBeenCalled();
    fireEvent.click(renderResult.getByText('Select'));
    fireEvent.input(renderResult.getByTestId('comboBoxSearchInput'), {
      target: { value: 'user1' },
    });
    fireEvent.blur(renderResult.getByTestId('comboBoxSearchInput'));
    expect(onGroupOrUserIdChangeMock).toHaveBeenCalledWith({ type: 'user', userId: 'user1' }, 0);
  });
  it('should call onGroupOrUserIdChange with group', () => {
    const { renderResult, onGroupOrUserIdChangeMock } = setup({
      type: WorkspacePermissionItemType.Group,
    });

    expect(onGroupOrUserIdChangeMock).not.toHaveBeenCalled();
    fireEvent.click(renderResult.getByText('Select'));
    fireEvent.input(renderResult.getByTestId('comboBoxSearchInput'), {
      target: { value: 'group' },
    });
    fireEvent.blur(renderResult.getByTestId('comboBoxSearchInput'));
    expect(onGroupOrUserIdChangeMock).toHaveBeenCalledWith({ type: 'group', group: 'group' }, 0);
  });

  it('should call onGroupOrUserIdChange without user id after clear button clicked', () => {
    const { renderResult, onGroupOrUserIdChangeMock } = setup({
      userId: 'foo',
    });

    expect(onGroupOrUserIdChangeMock).not.toHaveBeenCalled();
    fireEvent.click(renderResult.getByTestId('comboBoxClearButton'));
    expect(onGroupOrUserIdChangeMock).toHaveBeenCalledWith({ type: 'user' }, 0);
  });

  it('should call onPermissionModesChange with permission modes after permission modes changed', () => {
    const { renderResult, onPermissionModesChangeMock } = setup({});

    expect(onPermissionModesChangeMock).not.toHaveBeenCalled();
    fireEvent.click(renderResult.getByText('Admin'));
    expect(onPermissionModesChangeMock).toHaveBeenCalledWith(['library_write', 'write'], 0);
  });

  it('should call onDelete with index after delete button clicked', () => {
    const { renderResult, onDeleteMock } = setup();

    expect(onDeleteMock).not.toHaveBeenCalled();
    fireEvent.click(renderResult.getByLabelText('Delete permission setting'));
    expect(onDeleteMock).toHaveBeenCalledWith(0);
  });
});
