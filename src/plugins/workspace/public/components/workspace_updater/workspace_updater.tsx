/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiPageContent,
  EuiButton,
  EuiPanel,
} from '@elastic/eui';
import { useObservable } from 'react-use';
import { i18n } from '@osd/i18n';
import { of } from 'rxjs';
import { WorkspaceAttribute } from 'opensearch-dashboards/public';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import {
  WorkspaceForm,
  WorkspaceFormSubmitData,
  WorkspaceFormData,
} from '../workspace_creator/workspace_form';
import { WORKSPACE_OVERVIEW_APP_ID, WORKSPACE_OP_TYPE_UPDATE } from '../../../common/constants';
import { DeleteWorkspaceModal } from '../delete_workspace_modal';
import { formatUrlWithWorkspaceId } from '../../../../../core/public/utils';
import { WorkspaceClient } from '../../workspace_client';
import { WorkspacePermissionSetting } from '../';

interface WorkspaceWithPermission extends WorkspaceAttribute {
  permissions?: WorkspacePermissionSetting[];
}

function getFormDataFromWorkspace(
  currentWorkspace: WorkspaceAttribute | null | undefined
): WorkspaceFormData {
  const currentWorkspaceWithPermission = (currentWorkspace || {}) as WorkspaceWithPermission;
  return {
    ...currentWorkspaceWithPermission,
    permissions: currentWorkspaceWithPermission.permissions || [],
  };
}
export const WorkspaceUpdater = () => {
  const {
    services: { application, workspaces, notifications, http, workspaceClient },
  } = useOpenSearchDashboards<{ workspaceClient: WorkspaceClient }>();

  const isPermissionEnabled = application?.capabilities.workspaces.permissionEnabled;

  const currentWorkspace = useObservable(workspaces ? workspaces.currentWorkspace$ : of(null));
  const hideDeleteButton = !!currentWorkspace?.reserved; // hide delete button for reserved workspace
  const [deleteWorkspaceModalVisible, setDeleteWorkspaceModalVisible] = useState(false);
  const [currentWorkspaceFormData, setCurrentWorkspaceFormData] = useState<WorkspaceFormData>(
    getFormDataFromWorkspace(currentWorkspace)
  );

  useEffect(() => {
    setCurrentWorkspaceFormData(getFormDataFromWorkspace(currentWorkspace));
  }, [currentWorkspace]);

  const handleWorkspaceFormSubmit = useCallback(
    async (data: WorkspaceFormSubmitData) => {
      let result;
      if (!currentWorkspace) {
        notifications?.toasts.addDanger({
          title: i18n.translate('Cannot find current workspace', {
            defaultMessage: 'Cannot update workspace',
          }),
        });
        return;
      }
      try {
        result = await workspaceClient.update(currentWorkspace?.id, data);
      } catch (error) {
        notifications?.toasts.addDanger({
          title: i18n.translate('workspace.update.failed', {
            defaultMessage: 'Failed to update workspace',
          }),
          text: error instanceof Error ? error.message : JSON.stringify(error),
        });
        return;
      }
      if (result?.success) {
        notifications?.toasts.addSuccess({
          title: i18n.translate('workspace.update.success', {
            defaultMessage: 'Update workspace successfully',
          }),
        });
        if (application && http) {
          window.location.href =
            formatUrlWithWorkspaceId(
              application.getUrlForApp(WORKSPACE_OVERVIEW_APP_ID, {
                absolute: true,
              }),
              currentWorkspace.id,
              http.basePath
            ) || '';
        }
        return;
      }
      notifications?.toasts.addDanger({
        title: i18n.translate('workspace.update.failed', {
          defaultMessage: 'Failed to update workspace',
        }),
        text: result?.error,
      });
    },
    [notifications?.toasts, currentWorkspace, application, http, workspaceClient]
  );

  if (!currentWorkspaceFormData.name) {
    return null;
  }
  const deleteWorkspace = async () => {
    if (currentWorkspace?.id) {
      let result;
      try {
        result = await workspaceClient.delete(currentWorkspace?.id);
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
        setDeleteWorkspaceModalVisible(false);
        if (http && application) {
          const homeUrl = application.getUrlForApp('home', {
            path: '/',
            absolute: false,
          });
          const targetUrl = http.basePath.prepend(http.basePath.remove(homeUrl), {
            withoutWorkspace: true,
          });
          await application.navigateToUrl(targetUrl);
        }
      } else {
        notifications?.toasts.addDanger({
          title: i18n.translate('workspace.delete.failed', {
            defaultMessage: 'Failed to delete workspace',
          }),
          text: result?.error,
        });
      }
    }
  };

  return (
    <EuiPage paddingSize="none">
      <EuiPageBody panelled>
        <EuiPageHeader
          restrictWidth
          pageTitle="Update Workspace"
          rightSideItems={
            hideDeleteButton
              ? []
              : [
                  <EuiButton color="danger" onClick={() => setDeleteWorkspaceModalVisible(true)}>
                    Delete
                  </EuiButton>,
                ]
          }
        />
        <EuiPageContent
          verticalPosition="center"
          horizontalPosition="center"
          paddingSize="none"
          color="subdued"
          hasShadow={false}
          style={{ width: '100%', maxWidth: 1000 }}
        >
          {deleteWorkspaceModalVisible && (
            <EuiPanel>
              <DeleteWorkspaceModal
                onConfirm={deleteWorkspace}
                onClose={() => setDeleteWorkspaceModalVisible(false)}
                selectedItems={currentWorkspace?.name ? [currentWorkspace.name] : []}
              />
            </EuiPanel>
          )}
          {application && (
            <WorkspaceForm
              application={application}
              onSubmit={handleWorkspaceFormSubmit}
              defaultValues={currentWorkspaceFormData}
              opType={WORKSPACE_OP_TYPE_UPDATE}
              permissionEnabled={isPermissionEnabled}
            />
          )}
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};
