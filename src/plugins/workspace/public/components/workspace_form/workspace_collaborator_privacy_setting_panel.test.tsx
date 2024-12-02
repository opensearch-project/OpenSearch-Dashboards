/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import {
  privacyType2CopyMap,
  WorkspacePermissionItemType,
  WorkspacePrivacyItemType,
} from './constants';
import { WorkspacePermissionMode } from '../../../common/constants';
import {
  WorkspaceCollaboratorPrivacySettingPanel,
  WorkspaceCollaboratorPrivacySettingProps,
} from './workspace_collaborator_privacy_setting_panel';

const permissionSettingsView = [
  {
    id: 0,
    type: WorkspacePermissionItemType.User,
    userId: 'foo',
    modes: [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
  },
  {
    id: 1,
    type: WorkspacePermissionItemType.User,
    userId: '*',
    modes: [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
  },
];
const permissionSettingsEdit = [
  {
    id: 0,
    type: WorkspacePermissionItemType.User,
    userId: 'foo',
    modes: [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
  },
  {
    id: 1,
    type: WorkspacePermissionItemType.User,
    userId: '*',
    modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Read],
  },
];

const setup = (options?: Partial<WorkspaceCollaboratorPrivacySettingProps>) => {
  const handleSubmitPermissionSettingsMock = jest.fn();
  const permissionSettings = [
    {
      id: 0,
      type: WorkspacePermissionItemType.User,
      userId: 'foo',
      modes: [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
    },
  ];
  const renderResult = render(
    <WorkspaceCollaboratorPrivacySettingPanel
      permissionSettings={permissionSettings}
      handleSubmitPermissionSettings={handleSubmitPermissionSettingsMock}
      {...options}
    />
  );
  return {
    renderResult,
    handleSubmitPermissionSettingsMock,
  };
};

describe('WorkspaceCollaboratorPrivacySettingPanel', () => {
  it('should render correct privacyType with permission settings', () => {
    const { renderResult: privateWorkspace } = setup();
    expect(
      privateWorkspace.getByText(
        privacyType2CopyMap[WorkspacePrivacyItemType.PrivateToCollaborators].title,
        { exact: false }
      )
    ).toBeInTheDocument();

    const { renderResult: anyoneCanViewWorkspace } = setup({
      permissionSettings: permissionSettingsView,
    });
    expect(
      anyoneCanViewWorkspace.getByText(
        privacyType2CopyMap[WorkspacePrivacyItemType.AnyoneCanView].title,
        { exact: false }
      )
    ).toBeInTheDocument();

    const { renderResult: anyoneCanEditWorkspace } = setup({
      permissionSettings: permissionSettingsEdit,
    });
    expect(
      anyoneCanEditWorkspace.getByText(
        privacyType2CopyMap[WorkspacePrivacyItemType.AnyoneCanEdit].title,
        { exact: false }
      )
    ).toBeInTheDocument();
  });

  it('should call handleSubmitPermissionSettings with new privacy type', () => {
    const { renderResult, handleSubmitPermissionSettingsMock } = setup();

    expect(handleSubmitPermissionSettingsMock).not.toHaveBeenCalled();
    fireEvent.click(renderResult.getByText('Edit'));
    fireEvent.click(
      renderResult.getByText(
        privacyType2CopyMap[WorkspacePrivacyItemType.PrivateToCollaborators].title
      )
    );
    fireEvent.click(
      renderResult.getByText(privacyType2CopyMap[WorkspacePrivacyItemType.AnyoneCanView].title)
    );
    fireEvent.click(renderResult.getByText('Save changes'));
    expect(handleSubmitPermissionSettingsMock).toHaveBeenCalledWith(permissionSettingsView);
  });
});
