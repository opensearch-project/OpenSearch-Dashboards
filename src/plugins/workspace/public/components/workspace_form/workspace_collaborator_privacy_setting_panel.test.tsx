/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import {
  privacyType2TextMap,
  WorkspacePermissionItemType,
  WorkspacePrivacyItemType,
} from './constants';
import { WorkspacePermissionMode } from '../../../../../core/types';
import {
  WorkspaceCollaboratorPrivacySettingPanel,
  WorkspaceCollaboratorPrivacySettingProps,
} from './workspace_collaborator_privacy_setting_panel';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';

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

jest.mock('../../../../opensearch_dashboards_react/public', () => {
  return {
    useOpenSearchDashboards: jest.fn().mockReturnValue({
      services: {
        notifications: {
          toasts: {
            addError: jest.fn(),
            addSuccess: jest.fn(),
          },
        },
      },
    }),
  };
});
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
        privacyType2TextMap[WorkspacePrivacyItemType.PrivateToCollaborators].title,
        { exact: false }
      )
    ).toBeInTheDocument();

    const { renderResult: anyoneCanViewWorkspace } = setup({
      permissionSettings: permissionSettingsView,
    });
    expect(
      anyoneCanViewWorkspace.getByText(
        privacyType2TextMap[WorkspacePrivacyItemType.AnyoneCanView].title,
        { exact: false }
      )
    ).toBeInTheDocument();

    const { renderResult: anyoneCanEditWorkspace } = setup({
      permissionSettings: permissionSettingsEdit,
    });
    expect(
      anyoneCanEditWorkspace.getByText(
        privacyType2TextMap[WorkspacePrivacyItemType.AnyoneCanEdit].title,
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
        privacyType2TextMap[WorkspacePrivacyItemType.PrivateToCollaborators].title
      )
    );
    fireEvent.click(
      renderResult.getByText(privacyType2TextMap[WorkspacePrivacyItemType.AnyoneCanView].title)
    );
    fireEvent.click(renderResult.getByText('Save changes'));
    expect(handleSubmitPermissionSettingsMock).toHaveBeenCalledWith(permissionSettingsView);
  });

  it('should call addSuccess when successfully update the privacy type', async () => {
    const mockHandleSubmitPermissionSettings = jest.fn();
    mockHandleSubmitPermissionSettings.mockResolvedValue({ success: true });
    const { renderResult } = setup({
      handleSubmitPermissionSettings: mockHandleSubmitPermissionSettings,
    });

    expect(mockHandleSubmitPermissionSettings).not.toHaveBeenCalled();
    fireEvent.click(renderResult.getByText('Edit'));
    fireEvent.click(
      renderResult.getByText(
        privacyType2TextMap[WorkspacePrivacyItemType.PrivateToCollaborators].title
      )
    );
    fireEvent.click(
      renderResult.getByText(privacyType2TextMap[WorkspacePrivacyItemType.AnyoneCanEdit].title)
    );
    fireEvent.click(renderResult.getByText('Save changes'));
    const addSuccessMock = useOpenSearchDashboards().services.notifications?.toasts.addSuccess;
    await waitFor(() => {
      expect(addSuccessMock).toHaveBeenCalledWith({
        title: 'Change workspace privacy successfully.',
      });
    });
  });

  it('should call addError when error update the privacy type', async () => {
    const mockHandleSubmitPermissionSettings = jest.fn();
    mockHandleSubmitPermissionSettings.mockRejectedValue(new Error('Something went wrong'));
    const { renderResult } = setup({
      handleSubmitPermissionSettings: mockHandleSubmitPermissionSettings,
    });

    expect(mockHandleSubmitPermissionSettings).not.toHaveBeenCalled();
    fireEvent.click(renderResult.getByText('Edit'));
    fireEvent.click(
      renderResult.getByText(
        privacyType2TextMap[WorkspacePrivacyItemType.PrivateToCollaborators].title
      )
    );
    fireEvent.click(
      renderResult.getByText(privacyType2TextMap[WorkspacePrivacyItemType.AnyoneCanEdit].title)
    );
    fireEvent.click(renderResult.getByText('Save changes'));
    const addErrorMock = useOpenSearchDashboards().services.notifications?.toasts.addError;
    await waitFor(() => {
      expect(addErrorMock).toHaveBeenCalledWith(expect.any(Error), {
        title: 'Error updating workspace privacy type',
      });
    });
  });

  it('should close the modal after clicking the close button', async () => {
    const { renderResult } = setup();
    fireEvent.click(renderResult.getByText('Edit'));
    expect(renderResult.queryByText('Save changes')).toBeInTheDocument();
    fireEvent.click(renderResult.getByLabelText('Closes this modal window'));
    expect(renderResult.queryByText('Save changes')).not.toBeInTheDocument();
  });

  it('should close the modal after clicking the cancel button', async () => {
    const { renderResult } = setup();
    fireEvent.click(renderResult.getByText('Edit'));
    expect(renderResult.queryByText('Save changes')).toBeInTheDocument();
    fireEvent.click(renderResult.getByText('Cancel'));
    expect(renderResult.queryByText('Save changes')).not.toBeInTheDocument();
  });
});
