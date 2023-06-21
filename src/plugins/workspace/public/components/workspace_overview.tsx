/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiPageHeader, EuiButton, EuiPanel, EuiSpacer, EuiTitle } from '@elastic/eui';
import { useObservable } from 'react-use';
import { of } from 'rxjs';
import { i18n } from '@osd/i18n';
import { ApplicationStart } from '../../../../core/public';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { DeleteWorkspaceModal } from './delete_workspace_modal';
import { PATHS } from '../../common/constants';
import { WORKSPACE_APP_ID, WORKSPACE_ID_IN_SESSION_STORAGE } from '../../common/constants';

export const WorkspaceOverview = () => {
  const {
    services: { workspaces, application, notifications },
  } = useOpenSearchDashboards<{ application: ApplicationStart }>();

  const currentWorkspace = useObservable(
    workspaces ? workspaces.client.currentWorkspace$ : of(null)
  );

  const workspaceId = currentWorkspace?.id;
  const workspaceName = currentWorkspace?.name;
  const [deleteWorkspaceModalVisible, setDeleteWorkspaceModalVisible] = useState(false);

  const deleteWorkspace = async () => {
    if (workspaceId) {
      let result;
      try {
        result = await workspaces?.client.delete(workspaceId);
      } catch (error) {
        notifications?.toasts.addDanger({
          title: i18n.translate('workspace.delete.failed', {
            defaultMessage: 'Failed to delete workspace',
          }),
          text: error instanceof Error ? error.message : JSON.stringify(error),
        });
        return setDeleteWorkspaceModalVisible(false);
      }
      if (result?.success) {
        notifications?.toasts.addSuccess({
          title: i18n.translate('workspace.delete.success', {
            defaultMessage: 'Delete workspace successfully',
          }),
        });
      } else {
        notifications?.toasts.addDanger({
          title: i18n.translate('workspace.delete.failed', {
            defaultMessage: 'Failed to delete workspace',
          }),
          text: result?.error,
        });
      }
    }
    setDeleteWorkspaceModalVisible(false);
    await application.navigateToApp('home');
  };

  const onUpdateWorkspaceClick = () => {
    if (!currentWorkspace || !currentWorkspace.id) {
      notifications?.toasts.addDanger({
        title: i18n.translate('Cannot find current workspace', {
          defaultMessage: 'Cannot update workspace',
        }),
      });
      return;
    }
    application.navigateToApp(WORKSPACE_APP_ID, {
      path: PATHS.update + '?' + WORKSPACE_ID_IN_SESSION_STORAGE + '=' + currentWorkspace.id,
    });
  };

  return (
    <>
      <EuiPageHeader
        pageTitle="Overview"
        rightSideItems={[
          <EuiButton color="danger" onClick={() => setDeleteWorkspaceModalVisible(true)}>
            Delete
          </EuiButton>,
          <EuiButton>Update</EuiButton>,
          <EuiButton color="danger">Delete</EuiButton>,
          <EuiButton onClick={onUpdateWorkspaceClick}>Update</EuiButton>,
        ]}
      />
      <EuiPanel>
        {deleteWorkspaceModalVisible && (
          <DeleteWorkspaceModal
            onConfirm={deleteWorkspace}
            onClose={() => setDeleteWorkspaceModalVisible(false)}
            selectedItems={workspaceName ? [workspaceName] : []}
          />
        )}
        <EuiTitle size="m">
          <h3>Workspace</h3>
        </EuiTitle>
        <EuiSpacer />
        {JSON.stringify(currentWorkspace)}
      </EuiPanel>
    </>
  );
};
